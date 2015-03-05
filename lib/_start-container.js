module.exports = function () {
  return Bluebird.bind(this)
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
    .then(function () { return this.getContainers(); })
    .then(function () { throw this.containers[0]; })
    .catch(
      function isContainer(obj) { return obj.Id !== undefined; },
      function (container) { this.container = container; }
    );
};
