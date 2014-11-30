var Promise = require('bluebird');
var _       = require('lodash');
var bindArg = require('./bind-arg');

module.exports = function () {
  return Promise.bind(this)
    .then(function () {
      var containers = _.filter(this.containers, function (container) {
        return this.container.Id !== container.Id;
      }, this);
      if (containers !== undefined) return containers;
      throw undefined;
    })
    .then(function (containers) {
      return new Promise(function (resolve, reject) {
        async.each(containers, function (container, cb) {
          return Promise
            .try(function () {
              return docker.getContainer(container.Id);
            })
            .then(function (container) {
              if (/^Up/.test(container.Status)) {
                return container.stopAsync();
              }
            })
            .then(function () {
              return target.removeAsync();
            })
            .then(function () { cb(); }, cb);
        }, function (err) {
          if (err) return reject(err);
          resolve();
        });
      });
    });
};
