'use strict';

var PropertyMissingError = require('./errors/property-missing-error');

/**
 * Check whether a property is defined, if not throw PropertyMissingError
 *
 * @param {Any}    variable
 * @param {string} name
 * @throw {PropertyMissingError}
 */
module.exports = function (variable, name) {
  if (variable == null) {
    throw new PropertyMissingError(name);
  }
};
