var Promise       = require('bluebird');
var parseMeta     = require('../parse-meta');
var bindArg       = require('../util/bind-arg');
var getContainers = require('../get-containers');

module.exports = function () {
  return Promise.bind(this)
    .then(function () {
      if (this.container !== undefined) {
        if (/^Up/.test(this.container.Status)) {
          throw this.container;
        } else {
          return this.docker.getContainer(this.container.Id);
        }
      } else {
        return this.docker.createContainerAsync(parseMeta(this.meta));
      }
    })
    .then(function (container) {  return container.startAsync(); })
    .then(function () {           return getContainers(this.meta); })
    .tap(bindArg('containers'))
    .then(function (containers) { throw containers[0]; })
    .catch(
      function isContainer(obj) { return obj.Id !== undefined; },
      bindArg('container')
    );
};
