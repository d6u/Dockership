'use strict';

var KEYS = ['ca', 'cert', 'key'];

var Promise = require('bluebird');
var path = require('path');
var fs = require('./fs-promisified');
var ssdConfig = require('./get-config');
var error = require('./get-logger')('error');

function readKey(file) {
  var full = path.join(process.cwd(), file);
  return fs.readFileAsync(full)
  .catch(function (err) {
    error(file + ' file does not exist in "' + path.normalize(full) + '"');
  });
}

module.exports = function () {
  var promises = KEYS.map(function (key) {
    return readKey(ssdConfig[key]);
  });

  return Promise.all(promises).then(function (keys) {
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === undefined) {
        throw Error('Some key file cannot be located.');
      }
    }
    return keys;
  });
};
