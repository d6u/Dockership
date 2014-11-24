'use strict';

var Writable = require('stream').Writable;
var getLogger = require('./get-logger');

var writable = new Writable();

writable._write = function (chunk, encoding, cb) {
  if (this._store === undefined) this._store = '';
  if (this._preStatus === undefined) this._preStatus = 'debug';
  if (this._logger === undefined) this._logger = getLogger('server');
  if (this._logger === undefined) this._errLogger = getLogger('error');

  var log = this._logger;
  var error = this._errLogger;

  if (chunk.status === this._preStatus) {
    this._store += chunk;
    var lines = this._store.split(/[\r\n]+/);
    for (var i = 0; i < lines.length - 1; i++) {
      if (chunk.status === 'debug') {
        log(lines[i]);
      } else {
        error(lines[i]);
      }
    }
    this._store = lines[lines.length - 1];
  } else {

    if (this._preStatus === 'debug') {
      log(this._store);
    } else {
      error(this._store);
    }

    this._preStatus = chunk.status;

    this._store = chunk;

    var lines = this._store.split(/[\r\n]+/);
    for (var i = 0; i < lines.length - 1; i++) {
      if (chunk.status === 'debug') {
        log(lines[i]);
      } else {
        error(lines[i]);
      }
    }
    this._store = lines[lines.length - 1];
  }

  cb(null);
};

module.exports = function (logger) {
  var stream = Object.create(writable);

  stream.on('finish', function () {
    this._logger(this._store);
  });

  return stream;
};
