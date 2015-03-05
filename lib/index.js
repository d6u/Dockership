'use strict';

var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Bluebird     = require('bluebird');
var _            = require('lodash');
var semver       = require('semver');
var Docker       = require('./lib/docker-promisified');
var async        = require('./lib/async-promisified');

var PropertyMissingError = require('./error/property-missing-error');

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

Server.prototype._remoteImages        = require('./_remote-images');
Server.prototype._getImage            = require('./_get-image');
Server.prototype._buildImage          = require('./_build-image');
Server.prototype._makeTar             = require('./_make-tar');
Server.prototype._handleBuildResponse = require('./_handle-build-response');
Server.prototype._remoteContainers    = require('./_remote-containers');
Server.prototype._cleanUpContainers   = require('./_clean-up-containers');
Server.prototype._startContainer      = require('./_start-container');

Server.prototype._isLocalNewer = function (image) {
  return image == null || semver.gt(this.opts.meta.version, image.version);
};

Server.prototype.status = function () {
  return this._remoteImages()
  .then(function () {
    return this._remoteContainers();
  });
};

Server.prototype._getContainer = function () {
  return this._remoteContainers()
  .then(function () {
    if (this.containers.length && this.containers[0].tag === this.image.tag) {
      this.container = this.containers[0];
    }
  });
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
Server.prototype.up = function (opts) {
  return Bluebird.bind(this)
    .then(function () { return this.getConfig('meta'); })
    .then(function () { return this.getDocker(); })
    .then(function () { return this._getImage(opts); })
    .then(function () { return this._getContainer(); })
    .then(function () { return this._cleanUpContainers(); })
    .then(function () { return this._startContainer(); })
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

module.exports = Server;
