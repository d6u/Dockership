'use strict';

var Stream        = require('stream');
var Promise       = require('bluebird');
var fs            = require('./fs-promisified');
var makeTar       = require('./make-tar');
var getDocker     = require('./get-docker');
var getConfig     = require('./get-config');

function makeTmpDir() {
  return fs.mkdirAsync('./.tmp-ssd')
    .catch(function (err) {
      if (err && err.cause.code !== 'EEXIST') throw err;
    });
}

function handleBuild(meta, docker, tarPath) {
  return docker.buildImageAsync(tarPath, {
    t: meta['repo'] + ':' + meta['version'],
    nocache: true
  });
}

module.exports = function (stage) {
  return Promise.all([
    getConfig('meta', stage),
    getDocker(stage),
    makeTar('./source', './.tmp-ssd'),
    makeTmpDir()
  ]).spread(handleBuild);
};
