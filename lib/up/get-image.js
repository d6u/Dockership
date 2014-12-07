var Promise             = require('bluebird');
var semver              = require('semver');
var getImages           = require('../get-images');
var build               = require('../build');
var bindArg             = require('../util/bind-arg');
var handleBuildResponse = require('./handle-build-response');

module.exports = function () {
  return Promise.bind(this)
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
    );
};
