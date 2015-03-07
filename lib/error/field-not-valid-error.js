'use strict';

function FieldNotValidError(name, value, regex) {
  this.name = 'FieldNotValidError';
  this.fieldName = name;
  this.fieldVal  = value;
  this.regex     = regex;
  this.message = '"' + this.fieldName + '" with value "' + this.fieldVal + '" is not in valid format';
  if (this.regex) {
    this.message += ', it should match: ' + this.regex.toString();
  }
  Error.captureStackTrace(this, FieldNotValidError);
}

FieldNotValidError.prototype = Object.create(Error.prototype);
FieldNotValidError.prototype.constructor = FieldNotValidError;

module.exports = FieldNotValidError;
