'use strict';

var path         = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Promise      = require('bluebird');
var _            = require('lodash');
var semver       = require('semver');
var Stream       = require('stream');
var Writable     = Stream.Writable;
var through2 = require('through2');
var Docker       = require('./lib/docker-promisified');
var fs           = require('./lib/fs-promisified');
var async        = require('./lib/async-promisified');

var PropertyMissingError = require('./lib/property-missing-error');
var readJSON             = require('./lib/read-json');
var getMatcher           = require('./lib/util/get-matcher');
var makeTar              = require('./lib/make-tar');
var ParseJSONResponse = require('./lib/parse-json-response.js');
var parseMeta            = require('./lib/parse-meta');

var _hasOwn = {}.hasOwnProperty;

function _check() {
  for (var i = 0; i < arguments.length; i++) {
    if (!_hasOwn.call(this, arguments[i]) || typeof this[arguments[i]] === 'undefined') {
      throw new PropertyMissingError(arguments[i]);
    }
  }
}

/**
 *
 * @param {[type]} stage [description]
 */
function Server(stage) {
  this.stage = stage;
  _check.call(this, 'stage');
  EventEmitter.call(this);
}

util.inherits(Server, EventEmitter);

/**
 * Used in `._getPath`
 * @type {Object}
 */
var CONFIG_PATHS = {
  'meta': function () {
    return path.resolve('source', 'meta.json');
  },
  'ssd': function () {
    _check.call(this, 'stage');
    return path.resolve('stage', this.stage, 'ssd.json');
  }
};

Server.prototype._getPath = function (name) {
  if (!(name in CONFIG_PATHS)) {
    throw new Error('cannot recognize config name "' + name + '"');
  }
  return CONFIG_PATHS[name].call(this);
};

Server.prototype.getConfig = function (name) {
  if (this[name] == undefined) {
    return Promise.bind(this)
      .then(function () { return readJSON(this._getPath(name)); })
      .tap(function (obj) { this[name] = obj; });
  } else {
    return Promise.resolve(this[name]);
  }
};

/**
 * Used in `._getKeys`
 * @type {Array}
 */
var KEYS = ['ca', 'cert', 'key'];

function readKey(file) {
  return fs.readFileAsync(path.resolve(file));
}

Server.prototype._getKeys = function () {
  return Promise.bind(this).then(function () {
    _check.call(this, 'ssd');
    var _this = this;
    var keys  = KEYS.map(function (key) {
      return readKey(_this.ssd[key]);
    });
    return Promise.settle(keys)
      .then(function (results) {
        var errs;
        var dict = {};
        var i = 0;
        results.forEach(function (r) {
          if (r.isFulfilled()) {
            dict[KEYS[i]] = r.value();
          } else {
            if (!errs) {
              errs = new Promise.AggregateError();
            }
            var err = r.reason().cause;
            err.message = KEYS[i] + ' config error: ' + err.message;
            errs.push(err);
          }
          i += 1;
        });
        if (errs) {
          throw errs;
        } else {
          return dict;
        }
      });
  });
};

Server.prototype.getDocker = function () {
  if (!this.docker) {
    return Promise.bind(this)
      .then(function () { return this.getConfig('ssd'); })
      .then(function () { return this._getKeys(); })
      .then(function (keys) {
        var match = /^(\w+):\/\/([\w\.]+):(\d+)$/.exec(this.ssd['connection']);
        if (!match) throw new Error('ssd config does not have correct "connection" value');
        this.docker = new Docker({
          protocol: match[1],
          host: match[2],
          port: match[3],
          ca:   keys.ca,
          cert: keys.cert,
          key:  keys.key,
          timeout: 5000
        });
        return this.docker;
      });
  } else {
    return Promise.resolve(this.docker);
  }
};

Server.prototype.getImages = function () {
  return Promise.bind(this)
    .then(function () {
      _check.call(this, 'docker', 'meta');
      var matcher = getMatcher(this.meta.repo);

      return this.docker.listImagesAsync()
        .then(function (images) {
          return _(images)
            .filter(function (image) {
              for (var i = 0; i < image.RepoTags.length; i++) {
                var m = matcher(image.RepoTags[i]);
                if (m !== undefined && semver.valid(m.version) &&
                    (!image.version || semver.lt(m.version, image.version))) {
                  image.tag     = m.tag;
                  image.repo    = m.repo;
                  image.version = m.version;
                }
              }
              return image.tag; // truthy value
            })
            .sort(function (a, b) {
              if (semver.gt(a.version, b.version)) {
                return -1;
              } else {
                return 1;
              }
            });
        });
    })
    .then(function (_images) { this.images = _images.value(); });
};

Server.prototype.getContainers = function () {
  return Promise.bind(this)
    .then(function () {
      _check.call(this, 'docker', 'meta');
      var matcher = getMatcher(this.meta.repo);

      return this.docker.listContainersAsync({all: true})
        .then(function (containers) {
          return _(containers)
            .filter(function (container) {
              var m = matcher(container.Image);
              if (m && semver.valid(m.version)) {
                container.tag     = m.tag;
                container.repo    = m.repo;
                container.version = m.version;
                return true;
              }
            })
            .sort(function (a, b) {
              if (semver.gt(a.version, b.version)) {
                return -1;
              } else if (semver.gt(b.version, a.version)) {
                return 1;
              } else {
                var aUp = /^Up/.test(a.Status);
                var bUp = /^Up/.test(b.Status);
                if (aUp && !bUp) {
                  return -1;
                } else if (!aUp && bUp) {
                  return 1;
                } else {
                  return 0;
                }
              }
            });
        });
    })
    .then(function (_containers) { this.containers = _containers.value(); });
};

Server.prototype.status = function () {
  return Promise.bind(this)
    .then(function () { return this.getDocker(); })
    .then(function () { return this.getConfig('meta'); })
    .then(function () { return this.getImages(); })
    .then(function () { return this.getContainers(); });
};

Server.prototype._makeTmpDir = function () {
  return fs.mkdirAsync('./.tmp-ssd').error(function (err) {
    if (err && err.cause.code !== 'EEXIST') {
      throw err;
    }
  });
};

Server.prototype.build = function (opts) {
  return Promise.bind(this)
    .then(function () {
      return Promise.join(this.getConfig('meta'), this.getDocker(), this._makeTmpDir());
    })
    .then(function () { return makeTar('./source', './.tmp-ssd'); })
    .then(function (tarPath) {
      return this.docker.buildImageAsync(tarPath, {
        t: this.meta['repo'] + ':' + this.meta['version'],
        nocache: !opts.cache
      });
    });
};

/**
 * Dedicated to consume response stream returned by `docker.buildImage`
 *   messages will be emitted on Server instance.
 * @param  {Stream} response
 * @return {Promise}
 */
Server.prototype._handleBuildResponse = function (response) {
  var _this = this;
  return new Promise(function (resolve, reject) {
    response.setTimeout(60000);
    var logging = response.pipe(new ParseJSONResponse())
      .pipe(through2.obj(function (msg, enc, cb) {
        var obj;
        if (msg['stream']) {
          _this.emit('info', {
            info: msg['stream'].trimRight()
          });
          if (msg['progress'] || msg['progressDetail']) {
            _this.emit('progress', {
              id: msg['id'],
              progress: msg['progress'],
              progressDetail: msg['progressDetail']
            });
          }
          cb();
        } else if (msg['error'] || msg['errorDetail']) {
          var err = new Error(msg['error']);
          Error.captureStackTrace(this, Error);
          err.errorDetail = msg['errorDetail'];
          err.code = 'BUILDERROR';
          _this.emit('error', err);
          cb(err);
        } else {
          console.error('Uncaught response --> ', msg);
        }
      }))
      .on('finish', resolve)
      .on('error', reject);
  });
};

Server.prototype._getImage = function (opts) {
  return Promise.bind(this)
    .then(function () { _check.call(this, 'docker', 'meta'); })
    .then(function () { return this.getImages(); })
    .then(function () {
      if (this.images.length === 0 ||
          semver.gt(this.meta.version, this.images[0].version)) {
        return this.build(opts);
      } else {
        throw this.images[0];
      }
    })
    .then(function (response) { return this._handleBuildResponse(response); })
    .then(function () { return this.getImages(); })
    .then(function () { throw this.images[0]; })
    .catch(
      function isImage(obj) { return obj.Id !== undefined; },
      function (image) { this.image = image; }
    );
};

Server.prototype._getContainer = function () {
  return Promise.bind(this)
    .then(function () { _check.call(this, 'image'); })
    .then(function () { return this.getContainers(); })
    .then(function () {
      if (this.containers.length && this.containers[0].tag === this.image.tag) {
        this.container = this.containers[0];
      }
    });
};

Server.prototype._cleanUpContainers = function () {
  return Promise.bind(this)
    .then(function () {
      return _.filter(this.containers, function (container) {
        return !(this.container && this.container.Id === container.Id);
      }, this);
    })
    .then(function (containers) {
      var _this = this;
      return async.eachAsync(containers, function (containerData, cb) {
        return Promise.try(function () {
            return _this.docker.getContainer(containerData.Id);
          })
          .tap(function (container) {
            if (/^Up/.test(containerData.Status)) {
              return container.stopAsync();
            }
          })
          .then(function (container) {
            return container.removeAsync().return(null);
          })
          .then(cb, cb);
      });
    });
};

Server.prototype._startContainer = function () {
  return Promise.bind(this)
    .then(function () {
      if (this.container !== undefined) {
        if (/^Up/.test(this.container.Status)) {
          throw this.container;
        } else {
          return this.docker.getContainer(this.container.Id);
        }
      } else {
        return this.docker.createContainerAsync(parseMeta(this.meta));
      }
    })
    .then(function (container) {  return container.startAsync(); })
    .then(function () { return this.getContainers(); })
    .then(function () { throw this.containers[0]; })
    .catch(
      function isContainer(obj) { return obj.Id !== undefined; },
      function (container) { this.container = container; }
    );
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
 * @return {Promise}
 */
Server.prototype.up = function (opts) {
  return Promise.bind(this)
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
  return Promise.bind(this)
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
  return Promise.bind(this)
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
  "AttachStdout": true,
  "AttachStderr": true,
  "Tty": false
};

Server.prototype.exec = function (cmds) {
  return Promise.bind(this)
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
