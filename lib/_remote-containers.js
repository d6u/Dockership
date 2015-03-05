module.exports = function () {
  return Bluebird.bind(this)
    .then(function () {
      _check.call(this, 'docker', 'meta');
      var matcher = getMatcher(this.meta.repo);

      return this.docker.listContainersAsync({all: true})
        .then(function (containers) {
          return _(containers)
            .filter(function (container) {
              var m = matcher(container.Image);
              if (m && semver.valid(m.version)) {
                container.tag     = m.tag;
                container.repo    = m.repo;
                container.version = m.version;
                return true;
              }
            })
            .sort(function (a, b) {
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
            });
        });
    })
    .then(function (_containers) { this.containers = _containers.value(); });
};
