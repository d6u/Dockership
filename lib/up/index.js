var async             = require('async');
var Promise           = require('bluebird');
var semver            = require('semver');
var EventEmitter      = require('events').EventEmitter;

var getConfig         = require('../get-config');
var getDocker         = require('../get-docker');
var bindArg           = require('../util/bind-arg');

var getImage          = require('./get-image');
var getContainer      = require('./get-container');
var cleanupContainers = require('./cleanup-containers');
var startContainer    = require('./start-container');

module.exports = function (stage) {
  var emitter = new EventEmitter();

  Promise.bind({})
    .then(function () { return getConfig('meta', stage); })
    .tap(bindArg('meta'))
    .then(function () { return getDocker(stage); })
    .tap(bindArg('docker'))
    .then(getImage(emitter))
    .then(getContainer)
    .then(cleanupContainers)
    .then(startContainer)
    // .then() // remove other images
    .then(function () {
      emitter.emit('info', 'container up and running');
      emitter.emit('info', this.container);
    })
    .catch(function (err) {
      emitter.emit('error', err);
    })
    .finally(function () {
      emitter.emit('end');
    });

  return Promise.resolve(emitter);
};
