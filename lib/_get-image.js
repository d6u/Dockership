'use strict';

var semver = require('semver');

module.exports = function (proto) {

  proto._getImage = function () {
    return this._remoteImages()
    .bind(this)
    .then(function (images) {
      if (!this._isLocalNewer(images[0])) {
        throw images[0];
      }
    })
    .then(this._buildImage)
    .then(this._handleBuildResponse)
    .then(this._remoteImages)
    .then(function (images) { throw images[0]; })
    .catch(function isImage(obj) {
      return obj.Id !== undefined;
    }, function (image) {
      this.image = image;
    });
  };

  proto._isLocalNewer = function (image) {
    return image == null || semver.gt(this.opts.meta.version, image.version);
  };

  proto._buildImage = function () {
    return this._makeTar()
    .bind(this)
    .then(function (tarContent) {
      return this.docker.buildImageAsync(tarContent, {
        t: this.opts.meta.repo + ':' + this.opts.meta.version,
        nocache: !this.opts.cache
      });
    });
  };
};
