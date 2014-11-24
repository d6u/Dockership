#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var ssd = require('../index');
var log = require('../lib/get-logger')('local');

switch (argv['_'][0]) {
  case 'status':
    ssd.status().then(function (containers) {
      log(containers);
    });
    break;
  case 'build':
    ssd.build();
    break;
  default:

}
