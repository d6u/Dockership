'use strict';

var fs = require('../fs-promisified');
var escapeRegex = require('../util/escape-regex');

/**
 * @return {Boolean} resolve to true if file, false if dir, throw error if neither
 */
module.exports = function (absPath) {
  // TODO: check absolute path

  return fs.lstatAsync(absPath).then(function (stats) {
    if (stats.isFile()) {
      return true;
    } else if (stats.isDirectory()) {
      return false;
    } else {
      throw new Error(absPath + ' is not a dir or file.');
    }
  });
};
