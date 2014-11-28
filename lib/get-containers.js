var Promise     = require('bluebird');
var _           = require('lodash');
var semver      = require('semver');
var getDocker   = require('./get-docker');
var getConfig   = require('./get-config');
var escapeRegex = require('./util/escape-regex');

function assignValidVersion(container) {
  var v = container.Image.split(':')[1];
  if (semver.valid(v)) {
    container.version = v;
    return;
  }
  throw new Error(container.Names.toString() + ' has no valid semver image version')
}

module.exports = function () {
  var p1 = getConfig('meta');
  var p2 = getDocker()
    .then(function (docker) {
      return docker.listContainersAsync({all: true});
    });

  return Promise.all([p1, p2])
    .spread(function (meta, containers) {
      var tagRegex = new RegExp('^' + escapeRegex(meta.repo));

      var containers = _.filter(containers, function (container) {
        if (container.Image.match(tagRegex)) {
          return true;
        }
      });

      containers.forEach(assignValidVersion);

      containers.sort(function (a, b) {
        if (semver.gt(a.version, b.version)) {
          return -1;
        } else if (semver.gt(b.version, a.version)) {
          return 1;
        } else {
          return 0;
        }
      });

      return containers;
    });
};
