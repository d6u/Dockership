var Promise     = require('bluebird');
var _           = require('lodash');
var semver      = require('semver');
var getDocker   = require('./get-docker');
var escapeRegex = require('./util/escape-regex');

module.exports = function (meta) {
    var tagRegex = new RegExp('^(' + escapeRegex(meta.repo) + '):(\\d+(?:\\.\\d+)*)$');

    return getDocker()
      .call('listImagesAsync')
      .then(_)
      .call('filter', function (image) {
        for (var i = 0; i < image.RepoTags.length; i++) {
          var m = image.RepoTags[i].match(tagRegex);
          if (m && semver.valid(m[2]) && (!image.version || semver.gt(m[2], image.version))) {
            image.tag     = m[0];
            image.repo    = m[1];
            image.version = m[2];
          }
        }
        return image.version;
      })
      .call('sort', function (a, b) {
        if (semver.gt(a.version, b.version)) {
          return -1;
        } else if (semver.gt(b.version, a.version)) {
          return 1;
        } else {
          return 0;
        }
      })
      .call('value');
};
