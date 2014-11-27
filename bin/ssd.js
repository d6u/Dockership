#!/usr/bin/env node

var argv          = require('minimist')(process.argv.slice(2));
var Promise       = require('bluebird');
var semver        = require('semver');
var _             = require('lodash');
var async         = require('async');
var ssd           = require('../index');
var getConfig     = require('../lib/get-config');
var getLogger     = require('../lib/get-logger');
var parseMeta     = require('../lib/parse-meta');
var PerLineStream = require('../lib/per-line-stream');
var LogStream     = require('../lib/log-stream');
var getDocker     = require('../lib/get-docker');

var log   = getLogger('ssd');
var error = getLogger('error');

switch (argv['_'][0]) {
  case 'status':
    Promise.join(ssd.getImage(), ssd.getContainer(), function (images, containers) {
      getLogger('Images')(JSON.stringify(images, null, 2));
      getLogger('Containers')(JSON.stringify(containers, null, 2));
    });
    break;
  case 'up':
    up();
    break;
  default:
}

function up() {
  getImage()
    .then(function (image) {
      this.image = image;
      return ssd.getContainer();
    })
    .then(function (containers) {
      this.containers = containers;
      return _.find(containers, function (container) {
        return this.image.RepoTags.indexOf(container.Image) > -1;
      }, this);
    })
    .then(function (container) {
      if (!container || !container.Status.match(/^Up/)) {
        this.container = container;
        return getDocker();
      } else {
        log(container);
        throw new Error('container already running');
      }
    })
    .then(function (docker) {
      var _this = this;
      removeContainerExcept(this.containers, this.container);
      if (this.container === undefined) {
        return docker.createContainerAsync(parseMeta(this.meta))
          .then(function (container) {
            return new Promise(function (resolve, reject) {
              container.start(function (err) {
                if (err) return reject(err);
                resolve(container);
              });
            });
          });
      } else {
        return new Promise(function (resolve, reject) {
          docker.getContainer(this.container.Id).start(function (err) {
            if (err) return reject(err);
            resolve(_this.container);
          });
        });
      }
    })
    .then(function (container) {
      log('container up and running');
      log(container);
    })
    .catch(function (err) {
      error(err.message);
    });
}

function getImage() {
  return getConfig('meta').bind({})
    .then(function (meta) {
      this.meta = meta;
      return ssd.getImage();
    })
    .then(function (images) {
      this.images = images;
      if (images.length === 0 || semver.gt(this.meta.version, images[0].version)) {
        return buildImage();
      } else {
        return images[0];
      }
    });
}

function buildImage() {
  return ssd.build()
    .then(function (response) {
      return new Promise(function (resolve, reject) {
        var logging = response
          .pipe(new PerLineStream())
          .pipe(new LogStream());

        logging
          .on('finish', resolve)
          .on('error', reject);
      });
    })
    .then(function () {
      return ssd.getImage();
    })
    .then(function (images) {
      this.images = images;
      return images[0];
    });
}

function removeContainerExcept(containers, container) {
  return getDocker()
    .then(function (docker) {
      return new Promise(function (resolve, reject) {
        async.each(containers, function (c, cb) {
          if (!container || c.Id !== container.Id) {
            var target = docker.getContainer(c.Id);
            if (c.Status.match(/^Up/)) {
              target.stop(function (err) {
                if (err) return cb(err);
                target.remove(function (err) {
                  if (err) return cb(err);
                  cb();
                });
              });
            } else {
              target.remove(function (err) {
                if (err) return cb(err);
                cb();
              });
            }
          } else {
            cb();
          }
        }, function (err) {
          if (err) return reject(err);
          resolve(err);
        });
      });
    });
}
