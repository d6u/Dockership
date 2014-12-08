#!/usr/bin/env node

var argv      = require('minimist')(process.argv.slice(2));
var ssd       = require('../index');
var getLogger = require('../lib/util/get-logger');

var log   = getLogger('ssd');
var error = getLogger('error');

if (argv['s'] === undefined) {
  argv['s'] = 'development';
}

switch (argv['_'][0]) {
  case 'status':
    ssd.status(argv['s'])
      .then(function (status) {
        getLogger('Images')(JSON.stringify(status.images, null, 2));
        getLogger('Containers')(JSON.stringify(status.containers, null, 2));
      });
    break;
  case 'up':
    ssd.up(argv['s']);
    break;
  default:
}
