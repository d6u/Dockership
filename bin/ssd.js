#!/usr/bin/env node

var argv          = require('minimist')(process.argv.slice(2));
var Promise       = require('bluebird');
var semver        = require('semver');
var _             = require('lodash');
var async         = require('async');
var ssd           = require('../index');
var getLogger     = require('../lib/get-logger');

var log   = getLogger('ssd');
var error = getLogger('error');

switch (argv['_'][0]) {
  case 'status':
    Promise.join(ssd.getImages(), ssd.getContainers(), function (images, containers) {
      getLogger('Images')(JSON.stringify(images, null, 2));
      getLogger('Containers')(JSON.stringify(containers, null, 2));
    });
    break;
  case 'up':
    ssd.up();
    break;
  default:
}
