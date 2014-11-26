'use strict';

var Promise   = require('bluebird');
var Docker    = require('./docker-promisified');
var getConfig = require('../get-config');
var getKeys   = require('./get-keys');

var docker;

module.exports = function () {
  if (!docker) {
    return Promise.all([
      getConfig('ssd', process.env.NODE_ENV),
      getKeys()
    ])
      .spread(function (ssdConfig, keys) {
        var match = /^(\w+):\/\/([\w\.]+):(\d+)$/.exec(ssdConfig['connection']);

        if (!match) throw new Error('ssd config does not have correct "connection" value');

        docker = new Docker({
          protocol: match[1],
          host: match[2],
          port: match[3],
          ca:   keys.ca,
          cert: keys.cert,
          key:  keys.key
        });

        return docker;
      });
  } else {
    return Promise.resolve(docker);
  }
};
