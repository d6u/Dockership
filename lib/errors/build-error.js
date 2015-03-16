'use strict';

function BuildError(message, details) {
  this.name = 'BuildError';
  this.message = message;
  this.details = details;
  Error.captureStackTrace(this, BuildError);
}

BuildError.prototype = Object.create(Error.prototype);
BuildError.prototype.constructor = BuildError;

module.exports = BuildError;
