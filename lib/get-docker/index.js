var Promise   = require('bluebird');
var Docker    = require('./docker-promisified');
var getConfig = require('../get-config');
var getKeys   = require('./get-keys');
var bindArg   = require('../util/bind-arg');

var docker;

module.exports = function (stage) {
  if (!docker) {
    return Promise.bind({})
      .then(function () {
        return getConfig('ssd', stage)
      })
      .tap(bindArg('ssdConfig'))
      .then(function (ssdConfig) {
        return getKeys(ssdConfig);
      })
      .then(function (keys) {
        var match = /^(\w+):\/\/([\w\.]+):(\d+)$/.exec(this.ssdConfig['connection']);

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
