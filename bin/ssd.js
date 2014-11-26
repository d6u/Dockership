#!/usr/bin/env node

var argv          = require('minimist')(process.argv.slice(2));
var Promise       = require('bluebird');
var semver        = require('semver');
var ssd           = require('../index');
var getConfig     = require('../lib/get-config');
var getLogger     = require('../lib/get-logger');
var parseMeta     = require('../lib/parse-meta');
var PerLineStream = require('../lib/per-line-stream');
var LogStream     = require('../lib/log-stream');

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
  var $meta;

  Promise.all([ getConfig('meta'), ssd.getImage() ])
    .spread(function (meta, images) {
      $meta = meta;
      if (images.length === 0 || semver.gt(meta.version, images[0].version)) {
        return ssd.build();
      } else {
        throw new Error();
      }
    })
    .then(function (response) {
      return new Promise(function (resolve, reject) {
        response
          .pipe(new PerLineStream())
          .pipe(new LogStream())
          .on('finish', resolve);
      });
    });
}
