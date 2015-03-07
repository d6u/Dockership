'use strict';

var Bluebird = require('bluebird');
var archiver = require('archiver');

module.exports = function () {
  var self = this;
  return new Bluebird(function (resolve, reject) {
    var archive = archiver('tar');
    var bufs = [];

    archive
    .on('error', function (err) {
      reject(err);
    })
    .on('data', function (d) {
      bufs.push(d);
    })
    .on('end', function () {
      resolve(Buffer.concat(bufs));
    })
    .bulk([{expand: true, cwd: self.opts.dockerfileContext, src: ['**']}]);

    archive.finalize();
  });
};
