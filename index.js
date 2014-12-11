var path         = require('path');
var EventEmitter = require('events').EventEmitter;
var Promise      = require('bluebird');
var _            = require('lodash');
var semver       = require('semver');
var Stream       = require('stream');
var Writable     = Stream.Writable;
var Docker       = require('./lib/docker-promisified');
var fs           = require('./lib/fs-promisified');
var async        = require('./lib/async-promisified');

var PropertyMissingError = require('./lib/property-missing-error');
var readJSON             = require('./lib/read-json');
var getMatcher           = require('./lib/util/get-matcher');
var makeTar              = require('./lib/make-tar');
var PerLineStream        = require('./lib/per-line-stream');
var parseMeta            = require('./lib/parse-meta');

var _hasOwn = {}.hasOwnProperty;

function _check() {
  for (var i = 0; i < arguments.length; i++) {
    if (!_hasOwn.call(this, arguments[i]) || typeof this[arguments[i]] === 'undefined') {
      throw new PropertyMissingError(arguments[i]);
    }
  }
}

function Server(stage) {
  this.stage = stage;
  _check.call(this, 'stage');
}

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
  if (!this[name]) {
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
  _check.call(this, 'docker', 'meta');
  return Promise.bind(this)
    .then(function () {
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
  _check.call(this, 'docker', 'meta');
  return Promise.bind(this)
    .then(function () {
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

function makeTmpDir() {
  return fs.mkdirAsync('./.tmp-ssd').catch(function (err) {
    if (err && err.cause.code !== 'EEXIST') {
      throw err;
    }
  });
}

Server.prototype.build = function () {
  return Promise.bind(this)
    .then(function () {
      return Promise.all([
        makeTar('./source', './.tmp-ssd'),
        this.getConfig('meta'),
        this.getDocker(),
        makeTmpDir()
      ]);
    })
    .spread(function (tarPath) {
      return this.docker.buildImageAsync(tarPath, {
        t: this.meta['repo'] + ':' + this.meta['version'],
        nocache: true
      });
    });
};

Server.prototype._getImage = function () {
  _check.call(this, 'docker', 'meta', 'emitter');
  var emitter = this.emitter;
  return Promise.bind(this)
    .then(function () { return this.getImages(); })
    .then(function () {
      if (this.images.length === 0 ||
          semver.gt(this.meta.version, this.images[0].version)) {
        return this.build();
      } else {
        throw this.images[0];
      }
    })
    .then(function (response) {
      return new Promise(function (resolve, reject) {
        var writable = new Writable({objectMode: true});
        writable._write = function (obj, encoding, cb) {
          if (obj.flag === 'error') {
            var err = new Error(obj.content);
            err.code = 'BUILDERROR';
            emitter.emit('error', err);
            this.emit('error', err);
          } else {
            emitter.emit(obj.flag, obj.content);
          }
          cb(null);
        };

        var logging = response
          .pipe(new PerLineStream())
          .pipe(writable);

        logging
          .on('finish', resolve)
          .on('error', reject);
      });
    })
    .then(function () { return this.getImages(); })
    .then(function () { throw this.images[0]; })
    .catch(
      function isImage(obj) { return obj.Id !== undefined; },
      function (image) { this.image = image; }
    );
};

Server.prototype._getContainer = function () {
  _check.call(this, 'docker', 'meta', 'image');
  return Promise.bind(this)
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
 * Up
 * @return {EventEmitter}
 */
Server.prototype.up = function () {
  this.emitter = new EventEmitter();

  Promise.bind(this)
    .then(function () { return this.getConfig('meta'); })
    .then(function () { return this.getDocker(); })
    .then(function () { return this._getImage(); })
    .then(function () { return this._getContainer(); })
    .then(function () { return this._cleanUpContainers(); })
    .then(function () { return this._startContainer(); })
    // .then() // remove other images
    .then(function () {
      this.emitter.emit('info', 'container up and running');
      this.emitter.emit('info', this.container);
    })
    .catch(function (err) {
      this.emitter.emit('error', err);
    })
    .finally(function () {
      this.emitter.emit('end');
    });

  return Promise.resolve(this.emitter);
};

module.exports = Server;
