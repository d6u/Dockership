'use strict';

var Promise   = require('bluebird');
var getDocker = require('./get-docker');
var async     = require('async');
var semver    = require('semver');

module.exports = function (imageName, ltVersion) {
  return getDocker()
    .then(function (docker) {
      return docker.listContainersAsync()
        .then(function (containers) {
          return new Promise(function (resolve, reject) {
            async.eachSeries(containers, function (containerInfo, cb) {
              if (containerInfo.Image.indexOf(imageName) > -1) {
                var v = containerInfo.Image.split(':')[1];
                if (v !== undefined && semver.gt(ltVersion, v)) {
                  return docker.getContainer(containerInfo.Id).stop(cb);
                }
              }
              cb();
            }, function (err) {
              if (err) return reject(err);
              resolve();
            });
          });
        });
    });
};
