'use strict';

var semver = require('semver');
var _makeTar = require('./_make-tar');
var _handleBuildResponse = require('./_handle-build-response');

module.exports = function (proto) {

  proto.build = function () {
    return this
      .images()
      .bind(this)
      .then(function (images) {
        var localNewer = images.length && semver.gt(this.opts.meta.version, images[0].version);
        if (!localNewer) {
          throw images[0];
        }
      })
      .then(this._buildImage)
      .then(this._handleBuildResponse);
      .then(this.images)
      .get(0);
  };

  proto._buildImage = function _buildImage() {
    return this
      ._makeTar()
      .bind(this)
      .then(function (tarContent) {
        return this.docker.buildImageAsync(tarContent, {
          t: this.opts.meta.repo + ':' + this.opts.meta.version,
          nocache: !this.opts.cache
        });
      });
  };

  proto._makeTar = _makeTar;
  proto._handleBuildResponse = _handleBuildResponse;

};
