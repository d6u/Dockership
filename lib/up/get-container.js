var Promise       = require('bluebird');

var getContainers = require('../get-containers');
var bindArg       = require('../util/bind-arg');

module.exports = function (stage) {
  return function () {
    return Promise.bind(this)
      .then(function () { return getContainers(stage); })
      .tap(bindArg('containers'))
      .then(function (containers) {
        if (containers.length && containers[0].tag === this.image.tag) {
          return containers[0];
        }
      })
      .tap(bindArg('container'));
  };
};
