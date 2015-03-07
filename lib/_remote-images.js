'use strict';

var semver = require('semver');
var getMatcher = require('./util/get-matcher');

module.exports = function () {
  var matcher = getMatcher(this.opts.meta.repo);

  return this.docker
  .listImagesAsync()
  .call('filter', function (image) {
    if (image.RepoTags.length > 1) {
      this.emit('warn', 'detected image with multiple RepoTags:\n' + JSON.stringify(image, null, 4));
    }
    image.RepoTags.forEach(function (tag) {
      var m = matcher(tag);
      // For image with multiple RepoTags, we used tag with greatest version
      if (m && semver.valid(m.version) && (!image.version || semver.gt(m.version, image.version))) {
        image.tag     = m.tag;
        image.repo    = m.repo;
        image.version = m.version;
      }
    });
    return image.tag; // truthy value
  }, this)
  .call('sort', function (a, b) {
    if (semver.gt(a.version, b.version)) {
      return -1;
    } else {
      return 1;
    }
  });
};
