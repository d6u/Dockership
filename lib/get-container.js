var Promise     = require('bluebird');
var _           = require('lodash');
var semver      = require('semver');
var getDocker   = require('./get-docker');
var getConfig   = require('./get-config');
var escapeRegex = require('./util/escape-regex');

function getVersion(tags) {
  for (var i = 0; i < tags.length; i++) {
    var v = tags[i].split(':')[1];
    if (semver.valid(v)) {
      return v;
    }
  }
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

      containers.sort(function (a, b) {
        if (semver.gt(getVersion([a.Image]), getVersion([b.Image]))) {
          return -1;
        } else if (semver.gt(getVersion([b.Image]), getVersion([a.Image]))) {
          return 1;
        } else {
          return 0;
        }
      });

      return containers;
    });
};
