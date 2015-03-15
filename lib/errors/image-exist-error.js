'use strict';

var util = require('util');

function ImageExistError(repo, version) {
  this.name = 'ImageExistError';
  this.repo = repo;
  this.version = version;
  this.message = util.format('Image %s:%s already exists on server', this.repo, this.version);
  Error.captureStackTrace(this, ImageExistError);
}

ImageExistError.prototype = Object.create(Error.prototype);
ImageExistError.prototype.constructor = ImageExistError;

module.exports = ImageExistError;
