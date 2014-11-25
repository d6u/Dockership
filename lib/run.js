'use strict';

var Promise   = require('bluebird');
var getDocker = require('./get-docker');
var async     = require('async');
var semver    = require('semver');

module.exports = function (imageName, ltVersion, opt) {

  return getDocker()
    .then(function (docker) {
      return docker.listContainersAsync() // {all: true}
        .then(function (containers) {
          console.log(containers);
          return [docker, containers];
        });
    }).spread(function (docker, containers) {
      // make sure no newer or same version already running
      return new Promise(function (resolve, reject) {
        async.eachSeries(containers, function (containerInfo, cb) {
          if (containerInfo.Image.indexOf(imageName) > -1) {
            var v = containerInfo.Image.split(':')[1];
            if (v !== undefined && !semver.gt(ltVersion, v)) {
              return cb(new Error('server has the same or greater version than local copies'));
            }
          }
          cb();
        }, function (err) {
          if (err) return reject(err);
          resolve(docker);
        });
      });
    })
    .then(function (docker) {
      // run docker
      return docker.createContainerAsync(opt)
        .then(function (container) {
          container.start(function (err) {
            if (err) throw err;
          });
        });
    })
    .catch(function (err) {
      if (err.message === 'server has the same or greater version than local copies') {
        console.log('server has the same or greater version containers');
      } else {
        console.error(err);
      }
    });
};
