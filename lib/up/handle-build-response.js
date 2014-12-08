var Promise  = require('bluebird');
var Writable = require('stream').Writable;

var PerLineStream = require('./per-line-stream');

module.exports = function (emitter) {
  return function (response) {
    return new Promise(function (resolve, reject) {
      var writable = new Writable({objectMode: true});

      writable._write = function (obj, encoding, cb) {
        if (obj.flag === 'error') {
          var err = new Error(obj.content);
          err.code = 'BUILDERROR';
          emitter.emit('error', err);
          // this.emit('error', err); // cause Possibly unhandled Error
        } else {
          emitter.emit(obj.flag, obj.content);
        }
        cb(null);
      };

      var logging = response
        .pipe(new PerLineStream())
        .pipe(writable);

      logging
        .on('finish', resolve)
        .on('error', reject);
    });
  };
};
