'use strict';

var Writable = require('stream').Writable;
var getLogger = require('./get-logger');

var writable = new Writable({objectMode: true});

writable._write = function (obj, encoding, cb) {
  if (this._loggers === undefined) {
    this._loggers = {
      debug: getLogger('server'),
      error: getLogger('error')
    };
  }

  this._loggers[obj.flag](obj.content);

  cb(null);
};

module.exports = function (logger) {
  return Object.create(writable);
};
