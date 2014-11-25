'use strict';

var Promise = require('bluebird');
var fs = require('./fs-promisified');
var makeTar = require('./make-tar');
var getDocker = require('./get-docker');
var semver = require('semver');
var PerLineStream = require('./per-line-stream');
var LogStream = require('./log-stream');
var Stream = require('stream');

function makeTmpDir() {
  return fs.mkdirAsync('./.tmp-ssd')
    .catch(function (err) {
      if (err && err.cause.code !== 'EEXIST') throw err;
    });
}

function getMeta() {
  return fs.readFileAsync('./source/meta.json').then(JSON.parse);
}

function findImage(repoName, images) {
  for (var i = 0; i < images.length; i++) {
    for (var j = 0; j < images[i].RepoTags.length; j++) {
      if (images[i].RepoTags[j].indexOf(repoName) > -1) {
        return images[i];
      }
    }
  }
}

function versionsGt(base, image) {
  var versions = image.RepoTags.map(function (tag) {
    return tag.split(':')[1];
  });
  for (var i = 0; i < versions.length; i++) {
    if (semver.gt(base, versions[i])) {
      return true;
    }
  }
  return false;
}

function handleBuild(meta, docker, tarPath) {

  return docker.listImagesAsync()
    .then(function (images) {
      return findImage(meta['image-tag'], images);
    })
    .then(function (image) {
      if (image) {
        return [versionsGt(meta['version'], image), image];
      } else {
        return [true, image];
      }
    })
    .spread(function (isLocalNewer, image) {
      if (!isLocalNewer) {
        throw new Error('server has the same or greater version than local copies');
      }
      return docker.buildImageAsync(tarPath, {
        t: meta['image-tag'] + ':' + meta['version'],
        nocache: true
      });
    });
}

module.exports = function () {
  Promise.join(getMeta(), getDocker(), makeTar('./source', './.tmp-ssd'), makeTmpDir())
    .spread(handleBuild)
    .then(function (response) {
      return new Promise(function (resolve, reject) {
        response
          .pipe(new PerLineStream())
          .pipe(new LogStream())
          .on('finish', resolve);
      });
    })
    .then(function (stream) {
      console.log('finished');
    });
};
