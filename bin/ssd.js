#!/usr/bin/env node

var argv      = require('minimist')(process.argv.slice(2));
var ssd       = require('../index');
var log       = require('../lib/get-logger')('local');
var getMeta   = require('./get-meta');
var parseMeta = require('./parse-meta');

switch (argv['_'][0]) {
  case 'status':
    ssd.status().then(function (containers) {
      log(containers);
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
