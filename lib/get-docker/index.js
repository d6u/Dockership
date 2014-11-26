'use strict';

var Promise = require('bluebird');
var Docker = require('./docker-promisified');
var ssdConfig = require('./ssd-config');
var getKeys = require('./get-keys');

var docker;

module.exports = function () {
  if (!docker) {
    return getKeys().spread(function (ca, cert, key) {

      var match = /^(\w+):\/\/([\w\.]+):(\d+)$/.exec(ssdConfig['connection']);

      if (!match) throw Error('ssd config does not have correct "connection" value');

      docker = new Docker({
        protocol: match[1],
        host: match[2],
        port: match[3],
        ca: ca,
        cert: cert,
        key: key
      });

      return docker;
    });
  } else {
    return new Promise(function (resolve, reject) {
      resolve(docker);
    });
  }
};
