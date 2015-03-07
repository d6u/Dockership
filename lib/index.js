'use strict';

var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Bluebird     = require('bluebird');
var _            = require('lodash');

var Docker               = require('./promisified/docker-promisified');
var async                = require('./promisified/async-promisified');
var PropertyMissingError = require('./error/property-missing-error');

/**
 * Check whether a property is defined, if not throw PropertyMissingError
 *
 * @param {Any}    variable
 * @param {string} name
 * @throw {PropertyMissingError}
 */
function _check(variable, name) {
  if (variable == null) {
    throw new PropertyMissingError(name);
  }
}

/**
 * Constructor
 *
 * @param {Object} opts
 * @param {Object} opts.dockerfileContext - path to dockerfile dir relative to cwd
 * @param {Object} opts.docker - options pass to dockerode
 * @param {Object} opts.meta - definations for the container
 */
function Server(opts) {
  _check(opts.dockerfileContext, 'opts.dockerfileContext');
  _check(opts.docker, 'opts.docker');
  _check(opts.meta, 'opts.meta');
  this.opts = opts;
  this.docker = new Docker(this.opts.docker);
  EventEmitter.call(this);
}

util.inherits(Server, EventEmitter);

Server.prototype.status = function () {
  return Bluebird.join(this._remoteImages(), this._remoteContainers());
};

/**
 * Run the process of
 *   1. build image (if not exist)
 *   2. cleanup old container (if any)
 *   3. start container (if not start)
 *
 * Within the process, info and error will be emitted on `server` instance.
 * Note this will not throw error on returned promise.
 *
 * @return {Bluebird}
 */
Server.prototype.up = function () {
  return this._getImage()
    .bind(this)
    .then(this._getContainer)
    .then(this._cleanUpContainers)
    .then(this._startContainer)
    // .then() // remove other images
    .then(function () {
      this.emit('info', 'container up and running');
      this.emit('info', this.container);
    })
    .catch(function (err) {
      this.emit('error', err);
    })
    .finally(function () {
      this.emit('end');
    });
};

Server.prototype.start = function () {
  return Bluebird.bind(this)
    .then(function () { return this.getConfig('meta'); })
    .then(function () { return this.getDocker(); })
    .then(function () { return this.getContainers(); })
    .then(function () {
      if (this.containers.length &&
          this.containers[0].version === this.meta.version) {
        return this.containers[0];
      }
    })
    .then(function (container) {
      if (container) {
        if (!/^Up/.test(container.Status)) {
          return this.docker.getContainer(container.Id).startAsync();
        }
      }
    });
};

Server.prototype.stop = function () {
  return Bluebird.bind(this)
    .then(function () { return this.getConfig('meta'); })
    .then(function () { return this.getDocker(); })
    .then(function () { return this.getContainers(); })
    .then(function () {
      var docker = this.docker;
      return async.eachAsync(this.containers, function (container, cb) {
        if (/^Up/.test(container.Status)) {
          docker.getContainer(container.Id).stopAsync().then(function () {
            cb();
          });
        } else {
          cb();
        }
      });
    });
};

/**
 * Default options for container.exec method
 * Used in `exec`
 * @type {Object}
 */
var DEFAULT_EXEC_OPTION = {
  AttachStdout: true,
  AttachStderr: true,
  Tty: false
};

Server.prototype.exec = function (cmds) {
  return Bluebird.bind(this)
    .then(function () { return this.getConfig('meta'); })
    .then(function () { return this.getDocker(); })
    .then(function () { return this.getContainers(); })
    .then(function () {
      if (this.containers.length &&
          this.containers[0].version === this.meta.version) {
        return this.containers[0];
      }
    })
    .then(function (container) {
      if (container) {
        if (/^Up/.test(container.Status)) {
          return this.docker.getContainer(container.Id)
            .execAsync(_.defaults({Cmd: cmds}, DEFAULT_EXEC_OPTION));
        }
      }
      throw new Error('container does not exist or no container is not Up');
    })
    .then(function (exec) {
      return exec.startAsync();
    });
};

Server.prototype._remoteImages        = require('./_remote-images');
require('./_get-image')(Server.prototype);
Server.prototype._makeTar             = require('./_make-tar');
Server.prototype._handleBuildResponse = require('./_handle-build-response');
Server.prototype._remoteContainers    = require('./_remote-containers');
Server.prototype._cleanUpContainers   = require('./_clean-up-containers');
Server.prototype._startContainer      = require('./_start-container');

Server.prototype._getContainer = function () {
  return this._remoteContainers()
  .then(function () {
    if (this.containers.length && this.containers[0].tag === this.image.tag) {
      this.container = this.containers[0];
    }
  });
};

module.exports = Server;
