var Promise       = require('bluebird');
var getContainers = require('../get-containers');
var bindArg       = require('./bind-arg');

module.exports = function () {
  return Promise.bind(this)
    .then(function () { return getContainers(this.meta); })
    .tap(bindArg('containers'))
    .then(function (containers) {
      if (containers[0].tag === this.image.tag) {
        if (containers[0].Image.match(/^Up/)) {
          throw containers[0];
        } else {
          var c = this.docker.getContainer(containers[0].Id);
          if (!c.startAsync) {
            Promise.promisifyAll(Object.getPrototypeOf(c));
          }
          return c.startAsync().bind(this)
            .then(function () {
              return getContainers(this.meta);
            })
            .tap(bindArg('containers'))
            .then(function () {
              throw this.containers[0];
            });
        }
      } else {
        return this.docker.createContainerAsync(parseMeta(this.meta));
      }
    })
    .then(function (container) {
      if (!container.startAsync) {
        Promise.promisifyAll(Object.getPrototypeOf(container));
      }
      return container.startAsync();
    })
    .then(function () { return getContainers(this.meta); })
    .tap(bindArg('containers'))
    .then(function () { throw this.containers[0]; })
    .catch(
      function isContainer(obj) { return obj.Id !== undefined; },
      bindArg('container')
    );
};
