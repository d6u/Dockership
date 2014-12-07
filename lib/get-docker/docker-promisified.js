var Promise = require('bluebird');
var Docker  = require('dockerode');

Promise.promisifyAll(Docker.prototype);

var _getContainer = Docker.prototype.getContainer;

Docker.prototype.getContainer = function () {
  var container = _getContainer.apply(this, arguments);
  if (!container.startAsync) {
    Promise.promisifyAll(Object.getPrototypeOf(container));
  }
  return container;
}

module.exports = Docker;
