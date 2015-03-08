'use strict';

var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Bluebird     = require('bluebird');
var _            = require('lodash');

var Docker               = require('./promisified/docker-promisified');
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
  // TODO: remove other images
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

var upRegex = /^Up/;

Server.prototype.start = function () {
  return this._remoteContainers()
  .bind(this)
  .then(function (containers) {
    if (containers.length && containers[0].version === this.opts.meta.version) {
      return containers[0];
    }
  })
  .then(function (container) {
    if (container && !upRegex.test(container.Status)) {
      return this.docker.getContainer(container.Id).startAsync();
    }
  });
};

Server.prototype.stop = function () {
  return this._remoteContainers()
  .bind(this)
  .each(function (container) {
    if (upRegex.test(container.Status)) {
      this.docker.getContainer(container.Id).stopAsync();
    }
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
  return this._remoteContainers()
  .bind(this)
  .then(function (containers) {
    if (containers.length && containers[0].version === this.opts.meta.version) {
      return containers[0];
    }
  })
  .then(function (container) {
    if (container && upRegex.test(container.Status)) {
      this.docker.getContainer(container.Id)
      .execAsync(_.defaults({Cmd: cmds}, DEFAULT_EXEC_OPTION));
    }
    throw new Error('container does not exist or is not Up');
  })
  .then(function (exec) {
    return exec.startAsync();
  });
};

Server.prototype._remoteImages        = require('./_remote-images');
Server.prototype._remoteContainers    = require('./_remote-containers');
Server.prototype._makeTar             = require('./_make-tar');
Server.prototype._handleBuildResponse = require('./_handle-build-response');
require('./_get-image')(Server.prototype);
require('./_get-container')(Server.prototype);

module.exports = Server;
