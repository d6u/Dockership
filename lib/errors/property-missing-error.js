'use strict';

function PropertyMissingError(name) {
  this.name = 'PropertyMissingError';
  this.propertyName = name;
  this.message = '"' + this.propertyName + '" is required but not defined';
  Error.captureStackTrace(this, PropertyMissingError);
}

PropertyMissingError.prototype = Object.create(Error.prototype);
PropertyMissingError.prototype.constructor = PropertyMissingError;

module.exports = PropertyMissingError;
