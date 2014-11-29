var async               = require('async');
var Promise             = require('bluebird');
var semver              = require('semver');
var getConfig           = require('../get-config');
var getImages           = require('../get-images');
var getContainers       = require('../get-containers');
var build               = require('../build');
var handleBuildResponse = require('./handle-build-response')
var getDocker           = require('../get-docker');
var parseMeta           = require('../parse-meta');
var getLogger           = require('../get-logger');

var error = getLogger('error');
var log   = getLogger('local');

function bindArg(name) {
  return function (arg) {
    this[name] = arg;
  };
}

module.exports = function () {
  return Promise.bind({})
    .then(function () { return getConfig('meta'); })
    .tap(bindArg('meta'))
    .then(function () { return getDocker(); })
    .tap(bindArg('docker'))
    // get image
    .then(function () { return getImages(this.meta); })
    .tap(bindArg('images'))
    .then(function () {
      if (this.images.length === 0 || semver.gt(this.meta.version, this.images[0].version)) {
        return build();
      } else {
        throw this.images[0];
      }
    })
    .then(handleBuildResponse)
    .then(function () { return getImages(this.meta); })
    .tap(bindArg('images'))
    .then(function () { throw this.images[0]; })
    .catch(
      function isImage(obj) { return obj.Id !== undefined; },
      bindArg('image')
    )
    // get container
    .then(function () {
      return getContainers(this.meta);
    })
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
    )
    // stop and remove all other containers
    .then(function () {
      var containers = _.filter(this.containers, function (container) {
        return this.container.Id !== container.Id;
      }, this);
      if (containers !== undefined) return containers;
      throw undefined;
    })
    .then(function (containers) {
      return new Promise(function (resolve, reject) {
        async.each(containers, function (container, cb) {
          return Promise
            .try(function () {
              return docker.getContainer(container.Id);
            })
            .then(function (container) {
              if (/^Up/.test(container.Status)) {
                return container.stopAsync();
              }
            })
            .then(function () {
              return target.removeAsync();
            })
            .then(function () { cb(); }, cb);
        }, function (err) {
          if (err) return reject(err);
          resolve();
        });
      });
    })
    .then(function (container) {
      log('container up and running');
      log(container);
    })
    .catch(function (err) {
      if (err) error(err.message);
    });
}
