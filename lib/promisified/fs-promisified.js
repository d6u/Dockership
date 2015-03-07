'use strict';

var Bluebird = require('bluebird');

module.exports = Bluebird.promisifyAll(require('fs'));
