/*eslint curly:0*/

'use strict';

var through2 = require('through2');

module.exports = function () {
  return through2.obj(function (chunk, enc, cb) {
    var str = chunk.toString();
    if (str === '') return cb();
    try {
      this.push(JSON.parse(str));
      cb();
    } catch (err) {
      cb(err);
    }
  });
};
