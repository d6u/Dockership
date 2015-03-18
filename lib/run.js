'use strict';

var parseMeta = require('./util/parse-meta');
var _ = require('lodash');


module.exports = function (proto) {

  proto.run = function () {
    var oldContainers;

    return this
      .containers()
      .bind(this)
      .then(function (containers) {
        oldContainers = containers;

        var meta = this.configTemplate ? this.configTemplate.new() : this.opts.meta;
        var createOpts = parseMeta(meta);

        return this.docker
          .createContainerAsync(createOpts)
          .then(function (container) {
            return container.startAsync();
          });
      })
      .then(this.containers)
      .then(_)
      .call('find', function (container) {
        for (var i = 0; i < oldContainers.length; i++) {
          if (oldContainers[i].Id === container.Id) {
            return false;
          }
        }
        return true;
      });
  };

};
