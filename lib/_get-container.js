'use strict';

var Bluebird = require('bluebird');
var parseMeta = require('./util/parse-meta');

var upRegex = /^Up/;

module.exports = function (proto) {

  proto._getContainer = function () {
    return this._remoteContainers()
    .bind(this)
    .tap(function (containers) {
      if (containers.length && containers[0].tag === this.image.tag) {
        this.container = containers[0];
      }
    })
    // Get containers that's not `this.container`
    .filter(function (container) {
      return !(this.container && this.container.Id === container.Id);
    })
    .map(function (container) {
      return this.docker.getContainer(container.Id);
    })
    .each(function (container) {
      if (upRegex.test(container.Status)) {
        return container.stopAsync();
      }
    })
    .each(function (container) {
      return container.removeAsync();
    })
    .then(this._startContainer);
  };

  proto._startContainer = function () {
    return Bluebird.bind(this)
    .then(function () {
      if (this.container !== undefined) {
        if (upRegex.test(this.container.Status)) {
          throw this.container;
        } else {
          return this.docker.getContainer(this.container.Id);
        }
      } else {
        return this.docker.createContainerAsync(parseMeta(this.opts.meta));
      }
    })
    .then(function (container) { return container.startAsync(); })
    .then(this._remoteContainers)
    .then(function (containers) { throw containers[0]; })
    .catch(
      function isContainer(obj) { return obj.Id !== undefined; },
      function (container) { this.container = container; }
    );
  };

};
