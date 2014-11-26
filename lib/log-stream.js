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

  if (obj.flag === 'error') {
    var err = new Error(obj.content);
    err.code = 'BUILDERROR';
    this.emit('error', err);
  }

  cb(null);
};

module.exports = function (logger) {
  return Object.create(writable);
};
