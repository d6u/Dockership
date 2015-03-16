'use strict';

var util = require('util');

function ImageNotNewerVersionError(repo, version) {
  this.name = 'ImageNotNewerVersionError';
  this.repo = repo;
  this.version = version;
  this.message = util.format('Local image "%s:%s" is not newer than remote images', this.repo, this.version);
  Error.captureStackTrace(this, ImageNotNewerVersionError);
}

ImageNotNewerVersionError.prototype = Object.create(Error.prototype);
ImageNotNewerVersionError.prototype.constructor = ImageNotNewerVersionError;

module.exports = ImageNotNewerVersionError;
