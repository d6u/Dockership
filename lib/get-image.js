var Promise     = require('bluebird');
var _           = require('lodash');
var semver      = require('semver');
var getDocker   = require('./get-docker');
var getConfig   = require('./get-config');
var escapeRegex = require('./util/escape-regex');

function assignValidVersion(image) {
  var tags = image.RepoTags;
  for (var i = 0; i < tags.length; i++) {
    var v = tags[i].split(':')[1];
    if (semver.valid(v)) {
      image.version = v;
      return;
    }
  }
  throw new Error(tags.toString() + ' has no valid semver version')
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

      images.forEach(assignValidVersion);

      images.sort(function (a, b) {
        if (semver.gt(a.version, b.version)) {
          return -1;
        } else if (semver.gt(b.version, a.version)) {
          return 1;
        } else {
          return 0;
        }
      });

      return images;
    });
};
