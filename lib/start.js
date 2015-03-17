'use strict';

var parseMeta = require('./util/parse-meta');
var REGEX = require('./util/regex');


module.exports = function (proto) {

  proto.start = function () {
    return this
      .containers()
      .bind(this)
      .then(function (containers) {
        if (containers.length && containers[0].version === this.opts.meta.version) {
          if (REGEX.UP.test(containers[0].Status)) {
            throw containers[0];
          } else {
            return this.docker.getContainer(containers[0].Id).startAsync();
          }
        } else {
          return this.docker
            .createContainerAsync(parseMeta(this.configTemplate ? this.configTemplate.get() : this.opts.meta))
            .then(function (container) {
              return container.startAsync();
            });
        }
      })
      .then(this.containers)
      .get(0);
  };

};
