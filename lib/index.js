'use strict';

var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var _            = require('lodash');

var REGEX        = require('./util/regex');
var Docker       = require('./promisified/docker-promisified');
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
 * @param {Object} opts.buildContext - path to dockerfile dir relative to cwd
 * @param {Object} opts.docker - options pass to dockerode
 * @param {Object} opts.meta - definations for the container
 */
function Dockership(opts) {
  _check(opts.buildContext, 'opts.buildContext');
  _check(opts.docker, 'opts.docker');
  _check(opts.meta, 'opts.meta');
  this.opts = opts;
  this.docker = new Docker(this.opts.docker);
  EventEmitter.call(this);
}

util.inherits(Dockership, EventEmitter);

Dockership.prototype.images     = require('./images');
Dockership.prototype.containers = require('./containers');
require('./build')(Dockership.prototype);
require('./start')(Dockership.prototype);

Dockership.prototype.stop = function () {
  return this
    .containers()
    .bind(this)
    .each(function (container) {
      if (REGEX.UP.test(container.Status)) {
        return this.docker.getContainer(container.Id).stopAsync();
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

Dockership.prototype.exec = function (cmds) {
  return this
    .containers()
    .bind(this)
    .then(function (containers) {
      if (containers.length && containers[0].version === this.opts.meta.version) {
        if (REGEX.UP.test(containers[0].Status)) {
          return this.docker
            .getContainer(containers[0].Id)
            .execAsync(_.defaults({Cmd: cmds}, DEFAULT_EXEC_OPTION))
            .startAsync();
        }
        throw new Error('container is not Up');
      }
      throw new Error('container does not exist');
    });
};

Dockership.makeLogger = require('./make-logger');

module.exports = Dockership;
