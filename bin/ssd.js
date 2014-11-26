#!/usr/bin/env node

var argv          = require('minimist')(process.argv.slice(2));
var Promise       = require('bluebird');
var semver        = require('semver');
var ssd           = require('../index');
var getConfig     = require('../lib/get-config');
var getLogger     = require('../lib/get-logger');
var parseMeta     = require('../lib/parse-meta');
var PerLineStream = require('../lib/per-line-stream');
var LogStream     = require('../lib/log-stream');
var getDocker     = require('../lib/get-docker');

var log   = getLogger('ssd');
var error = getLogger('error');

var $meta;

switch (argv['_'][0]) {
  case 'status':
    Promise.join(ssd.getImage(), ssd.getContainer(), function (images, containers) {
      getLogger('Images')(JSON.stringify(images, null, 2));
      getLogger('Containers')(JSON.stringify(containers, null, 2));
    });
    break;
  case 'up':
    up();
    break;
  default:
}

function up() {
  Promise.all([ getConfig('meta'), ssd.getImage() ])
    .spread(function (meta, images) {
      $meta = meta;
      if (images.length === 0 || semver.gt(meta.version, images[0].version)) {
        return ssd.build();
      } else {
        var err = new Error('server has greater or same version image than local');
        err.code = 'VERSIONERROR';
        err.image = images[0];
        throw err;
      }
    })
    .then(function (response) {
      return new Promise(function (resolve, reject) {
        var logging = response
          .pipe(new PerLineStream())
          .pipe(new LogStream());

        logging
          .on('finish', resolve)
          .on('error', reject);
      });
    })
    .then(function () {
      log('finish building image');
    })
    .catch(function (err) {
      error(err.message);
      switch(err.code) {
        case 'BUILDERROR':
          break;
        case 'VERSIONERROR':
          return startContainer(err.image);
      }
    })
    .then(function (id) {
      if (id) {
        log(id);
      }
    });
}

function startContainer(image) {
  return ssd.getContainer()
    .then(function (containers) {
      for (var i = 0; i < containers.length; i++) {
        if (!semver.gt($meta.version, containers[i].version)) {
          if (containers[i].Status.match(/^Up/)) {
            log('server already running container with same or greater version');
            return containers[i].Id;
          } else if (containers[i].Status.match(/^Exited/)) {
            log('server has an existed container with same or greater version');
            log('start that container');
            return getDocker()
              .then(function (docker) {
                return new Promise(function (resolve, reject) {
                  docker.getContainer(containers[i].Id).start(function (err) {
                    if (err) return reject(err);
                    resolve(containers[i].Id);
                  });
                });
              });
          }
        }
      }
    });
}
