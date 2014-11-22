'use strict';

var join = require('path').join;
var configPath = join(
  process.cwd(), 'stage', process.env.NODE_ENV || 'development', 'ssd.json');
module.exports = require(configPath);
