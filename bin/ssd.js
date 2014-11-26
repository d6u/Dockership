#!/usr/bin/env node

var argv      = require('minimist')(process.argv.slice(2));
var Promise   = require('bluebird');
var ssd       = require('../index');
var getLogger = require('../lib/get-logger');
var log       = getLogger('local')
var getMeta   = require('../lib/get-config');
var parseMeta = require('../lib/parse-meta');

switch (argv['_'][0]) {
  case 'status':
    Promise.join(ssd.getImage(), ssd.getContainer(), function (images, containers) {
      getLogger('Images')(JSON.stringify(images, null, 4));
      getLogger('Containers')(JSON.stringify(containers, null, 4));
    });
    break;
  case 'build':
    ssd.build();
    break;
  case 'run':
    var meta = getMeta();
    var opt  = parseMeta(meta);
    ssd.stop(meta['image-tag'], meta['version'])
      .then(function () {
        return ssd.run(meta['image-tag'], meta['version'], opt);
      });
    break;
  default:

}
