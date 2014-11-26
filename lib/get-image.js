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
      return docker.listImagesAsync();
    });

  return Promise.all([p1, p2])
    .spread(function (meta, images) {
      var tagRegex = new RegExp('^' + escapeRegex(meta.repo));

      var images = _.filter(images, function (image) {
        for (var i = 0; i < image.RepoTags.length; i++) {
          if (image.RepoTags[i].match(tagRegex)) {
            return true;
          }
        }
      });

      images.sort(function (a, b) {
        if (semver.gt(getVersion(a.RepoTags), getVersion(b.RepoTags))) {
          return -1;
        } else if (semver.gt(getVersion(b.RepoTags), getVersion(a.RepoTags))) {
          return 1;
        } else {
          return 0;
        }
      });

      return images;
    });
};
