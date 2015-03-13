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

    response
      .pipe(new ParseJSONResponse())
      .pipe(through2.obj(function (msg, enc, cb) {
        self.emit('buildMessage', msg);
        cb();
      }))
      .on('finish', function () {
        self.emit('buildMessage', 'end');
        resolve();
      })
      .on('error', function (err) {
        self.emit('buildMessage', 'end');
        reject(err);
      });
  });
};
