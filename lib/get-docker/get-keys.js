'use strict';

var KEYS = ['ca', 'cert', 'key'];

var Promise   = require('bluebird');
var path      = require('path');
var fs        = require('../fs-promisified');

function readKey(file) {
  return fs.readFileAsync(path.resolve(file));
}

module.exports = function (ssdConfig) {
  var keys = KEYS.map(function (key) {
    return readKey(ssdConfig[key]);
  });

  return Promise.settle(keys)
    .then(function (results) {
      var errs = new Promise.AggregateError;
      var dict = {};
      var i = 0;
      results.forEach(function (r) {
        if (r.isFulfilled()) {
          dict[KEYS[i]] = r.value();
        } else {
          var err = r.reason().cause;
          err.message = KEYS[i] + ' config ' + err.message;
          errs.push(err);
        }
        i += 1;
      });
      if (errs.length) {
        throw errs;
      } else {
        return dict;
      }
    });
};
