'use strict';

var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var _            = require('lodash');

var REGEX        = require('./util/regex');
var makeDocker = require('./util/make-docker');
var ConfigTemplate = require('./config-template');
var _check = require('./util/_check');

/**
 * Constructor
 *
 * @param {Object} opts
 * @param {Object} opts.buildContext - path to dockerfile dir relative to cwd
 * @param {Object} opts.docker - options pass to dockerode
 * @param {Object} opts.meta - definations for the container
 * @param {Object} opts.valueDefs - map of functions to generate value for opts.meta as template
 */
function Dockership(opts) {
  _check(opts.buildContext, 'opts.buildContext');
  _check(opts.docker, 'opts.docker');
  _check(opts.meta, 'opts.meta');
  this.opts = opts;
  this.docker = makeDocker(this.opts.docker);
  this.configTemplate = null;
  if (this.opts.valueDefs) {
    this.configTemplate = new ConfigTemplate(this.opts.meta, this.opts.valueDefs);
  }
  EventEmitter.call(this);
}

util.inherits(Dockership, EventEmitter);

Dockership.prototype.newConfig = function () {
  return this.configTemplate.new();
};

Dockership.prototype.currentConfig = function () {
  return this.configTemplate.get();
};

Dockership.prototype.images     = require('./images');
Dockership.prototype.containers = require('./containers');
require('./build')(Dockership.prototype);
require('./run')(Dockership.prototype);
require('./remove')(Dockership.prototype);
require('./start')(Dockership.prototype);

Dockership.prototype.stop = function (id) {
  if (id === 'all') {
    return this
      .containers()
      .bind(this)
      .each(function (container) {
        if (REGEX.UP.test(container.Status)) {
          return this.stop(container.Id);
        }
      });
  } else {
    return this.docker.getContainer(id).stopAsync();
  }
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

Dockership.prototype.exec = function (id, cmds) {
  var execOpts = _.defaults({Cmd: cmds}, DEFAULT_EXEC_OPTION);

  return this.docker
    .getContainer(id)
    .execAsync(execOpts)
    .then(function (exec) {
      return exec.startAsync();
    });
};

Dockership.makeLogger = require('./make-logger');

Dockership.PropertyMissingError = require('./errors/property-missing-error');
Dockership.FieldNotValidError = require('./errors/field-not-valid-error');
Dockership.ImageNotNewerVersionError = require('./errors/image-not-newer-version-error');
Dockership.BuildError = require('./errors/build-error');

module.exports = Dockership;
