/*eslint dot-notation:0*/

'use strict';

var Bluebird = require('bluebird');
var through2 = require('through2');
var BuildError = require('../errors/build-error');

/**
 * Consume response stream returned by `docker.buildImage`
 *
 * @param  {Stream} response
 * @return {Bluebird}
 */
module.exports = function (response) {
  var self = this;
  return new Bluebird(function (resolve, reject) {
    response.setTimeout(60000);

    response
      .on('error', reject)
      .pipe(through2.obj(function (chunk, enc, cb) {
        var str = chunk.toString();
        if (str === '') return cb();
        try {
          this.push(JSON.parse(str));
          cb();
        } catch (err) {
          cb(err);
        }
      }))
      .on('error', reject)
      .pipe(through2.obj(function (msg, enc, cb) {
        if ('error' in msg) {
          reject(new BuildError(msg.error, msg.errorDetail && msg.errorDetail.message));
        } else {
          self.emit('buildMessage', msg);
          cb();
        }
      }))
      .on('end', function () {
        self.emit('buildMessage', 'end');
        resolve();
      });
  });
};
