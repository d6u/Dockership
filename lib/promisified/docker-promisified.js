'use strict';

var Bluebird = require('bluebird');
var Docker  = require('dockerode');

Bluebird.promisifyAll(Docker.prototype);

var _getContainer = Docker.prototype.getContainer;

Docker.prototype.getContainer = function () {
  var container = _getContainer.apply(this, arguments);
  if (!container.startAsync) {
    var containerPrototype = Object.getPrototypeOf(container);

    var _exec = containerPrototype.exec;
    containerPrototype.exec = function (opts, cb) {
      _exec.call(container, opts, function (err, exec) {
        if (exec && !exec.startAsync) {
          Bluebird.promisifyAll(Object.getPrototypeOf(exec));
        }
        cb(err, exec);
      });
    };

    Bluebird.promisifyAll(containerPrototype);
  }
  return container;
};

module.exports = Docker;
