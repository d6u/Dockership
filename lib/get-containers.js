var Promise     = require('bluebird');
var _           = require('lodash');
var semver      = require('semver');
var getDocker   = require('./get-docker');
var escapeRegex = require('./util/escape-regex');

module.exports = function (meta) {
    var tagRegex = new RegExp('^(' + escapeRegex(meta.repo) + '):(\\d+(?:\\.\\d+)*)$');

    return getDocker()
      .call('listContainersAsync', {all: true})
      .then(_)
      .call('filter', function (container) {
        var m = container.Image.match(tagRegex);
        if (m && semver.valid(m[2])) {
          container.tag = m[0];
          container.repo = m[1];
          container.version = m[2];
          return true;
        }
      })
      .call('sort', function (a, b) {
        if (semver.gt(a.version, b.version)) {
          return -1;
        } else if (semver.gt(b.version, a.version)) {
          return 1;
        } else {
          var aUp = /^Up/.test(a.Status);
          var bUp = /^Up/.test(b.Status);
          if (aUp && !bUp) {
            return -1;
          } else if (!aUp && bUp) {
            return 1;
          } else {
            return 0;
          }
        }
      })
      .call('value');
};
