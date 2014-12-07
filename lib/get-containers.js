var Promise    = require('bluebird');
var _          = require('lodash');
var semver     = require('semver');
var getDocker  = require('./get-docker');
var getMatcher = require('./util/get-matcher');
var getConfig  = require('./get-config');

module.exports = function (stage) {
  return getConfig('meta').then(function (meta) {
    var matcher = getMatcher(meta.repo);

    return getDocker(stage)
      .call('listContainersAsync', {all: true})
      .then(_)
      .call('filter', function (container) {
        var m = matcher(container.Image);
        if (m && semver.valid(m.version)) {
          container.tag     = m.tag;
          container.repo    = m.repo;
          container.version = m.version;
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
  });
};
