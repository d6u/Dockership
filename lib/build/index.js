'use strict';

var semver = require('semver');
var _makeTar = require('./_make-tar');
var _handleBuildResponse = require('./_handle-build-response');
var ImageExistError = require('../errors/image-exist-error');

module.exports = function (proto) {

  proto.build = function () {
    return this
      .images()
      .bind(this)
      .then(function (images) {
        var remoteNewer = images.length && semver.gte(images[0].version, this.opts.meta.version);
        if (remoteNewer) {
          throw new ImageExistError(this.opts.meta.repo, this.opts.meta.version);
        }
      })
      .then(this._buildImage)
      .then(this._handleBuildResponse)
      .then(this.images)
      .get(0);
  };

  proto._buildImage = function _buildImage() {
    return this
      ._makeTar()
      .bind(this)
      .then(function (tarContent) {
        return this.docker.buildImageAsync(tarContent, {
          t: this.opts.meta.repo + ':' + this.opts.meta.version
        });
      });
  };

  proto._makeTar = _makeTar;
  proto._handleBuildResponse = _handleBuildResponse;

};
