var Promise    = require('bluebird');
var _          = require('lodash');
var semver     = require('semver');
var getDocker  = require('./get-docker');
var getMatcher = require('./util/get-matcher');
var getConfig  = require('./get-config');

module.exports = function (stage) {
  return getConfig('meta', stage).then(function (meta) {
    var matcher = getMatcher(meta.repo);

    return getDocker(stage)
      .call('listImagesAsync')
      .then(_)
      .call('filter', function (image) {
        for (var i = 0; i < image.RepoTags.length; i++) {
          var m = matcher(image.RepoTags[i]);
          if (m !== undefined && semver.valid(m.version) &&
              (!image.version || semver.lt(m.version, image.version))) {
            image.tag     = m.tag;
            image.repo    = m.repo;
            image.version = m.version;
          }
        }
        return image.tag; // truthy value
      })
      .call('sort', function (a, b) {
        if (semver.gt(a.version, b.version)) {
          return -1;
        } else {
          return 1;
        }
      })
      .call('value');
  });
};
