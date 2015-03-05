'use strict';

var _ = require('lodash');
var semver = require('semver');
var getMatcher = require('./util/get-matcher');

var upRegex = /^Up/;

module.exports = function () {
  var matcher = getMatcher(this.opts.meta.repo);

  return this.docker
  .listContainersAsync({all: true})
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
  // Sort containers based on version then status,
  // containers with Up status will rank higher
  .call('sort', function (a, b) {
    if (semver.gt(a.version, b.version)) {
      return -1;
    } else if (semver.gt(b.version, a.version)) {
      return 1;
    } else {
      var aUp = upRegex.test(a.Status);
      var bUp = upRegex.test(b.Status);
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
