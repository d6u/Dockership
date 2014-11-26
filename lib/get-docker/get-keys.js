'use strict';

var KEYS = ['ca', 'cert', 'key'];

var Promise   = require('bluebird');
var path      = require('path');
var getConfig = require('../get-config');
var fs        = require('../fs-promisified');

function readKey(file) {
  return fs.readFileAsync(path.resolve(file))
    .catch(function (err) {
      // suppress errors
    });
}

module.exports = function () {
  return getConfig('ssd', process.env.NODE_ENV)
    .then(function (ssdConfig) {
      var promises = {};
      KEYS.forEach(function (key) {
        promises[key] = readKey(ssdConfig[key]);
      });
      return Promise.props(promises);
    });
};
