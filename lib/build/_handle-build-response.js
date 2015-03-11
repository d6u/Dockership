/*eslint dot-notation:0*/

'use strict';

var Bluebird = require('bluebird');
var through2 = require('through2');
var ParseJSONResponse = require('../util/parse-json-response');

/**
 * Dedicated to consume response stream returned by `docker.buildImage`
 *   messages will be emitted on Server instance.
 * @param  {Stream} response
 * @return {Bluebird}
 */
module.exports = function (response) {
  var self = this;
  return new Bluebird(function (resolve, reject) {
    response.setTimeout(60000);

    response.pipe(new ParseJSONResponse())
    .pipe(through2.obj(function (msg, enc, cb) {
      if (msg['stream']) {
        self.emit('info', {
          info: msg['stream'].trimRight()
        });
        if (msg['progress'] || msg['progressDetail']) {
          self.emit('progress', {
            id: msg['id'],
            progress: msg['progress'],
            progressDetail: msg['progressDetail']
          });
        }
        cb();
      } else if (msg['error'] || msg['errorDetail']) {
        var err = new Error(msg['error']);
        Error.captureStackTrace(self, Error);
        err.errorDetail = msg['errorDetail'];
        err.code = 'BUILDERROR';
        self.emit('error', err);
        cb(err);
      } else {
        self.emit('UncaughtResponse', msg);
      }
    }))
    .on('finish', resolve)
    .on('error', reject);
  });
};
