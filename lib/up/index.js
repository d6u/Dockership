var async               = require('async');
var Promise             = require('bluebird');
var semver              = require('semver');
var getConfig           = require('../get-config');
var getDocker           = require('../get-docker');
var parseMeta           = require('../parse-meta');
var getLogger           = require('../get-logger');
var getImage            = require('./get-image');
var getContainer        = require('./get-container');
var cleanupContainers   = require('./cleanup-containers');
var bindArg             = require('../util/bind-arg');
var startContainer      = require('./start-container');

var error = getLogger('error');
var log   = getLogger('local');

module.exports = function () {
  return Promise.bind({})
    .then(function () { return getConfig('meta'); })
    .tap(bindArg('meta'))
    .then(function () { return getDocker(); })
    .tap(bindArg('docker'))
    .then(getImage)
    .then(getContainer)
    .then(cleanupContainers)
    .then(startContainer)
    // .then() // remove other images
    .then(function () {
      log('container up and running');
      log(this.container);
    })
    .catch(function (err) {
      if (err) error(err.message);
    });
}
