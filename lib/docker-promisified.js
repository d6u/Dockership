var Promise = require('bluebird');
var Docker  = require('dockerode');

Promise.promisifyAll(Docker.prototype);

var _getContainer = Docker.prototype.getContainer;

Docker.prototype.getContainer = function () {
  var container = _getContainer.apply(this, arguments);
  if (!container.startAsync) {
    var containerPrototype = Object.getPrototypeOf(container);

    var _exec = containerPrototype.exec;
    containerPrototype.exec = function (opts, cb) {
      _exec.call(container, opts, function (err, exec) {
        if (exec && !exec.startAsync) {
          Promise.promisifyAll(Object.getPrototypeOf(exec));
        }
        cb(err, exec);
      });
    };

    Promise.promisifyAll(containerPrototype);
  }
  return container;
}

module.exports = Docker;
