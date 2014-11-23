'use strict';

var isFileAsync = require('./is-file-async');
var archiver = require('archiver');
var path = require('path');
var fs = require('../fs-promisified');

/**
 * @param  {String}  srcPath - absolute path
 * @return {Promise} resolve into a tarball stream
 */
module.exports = function (srcPath) {

  return isFileAsync(srcPath)
    .then(function (isFile) {
      var archive = archiver('tar');
      archive.on('error', function (err) {
        throw err;
      });

      if (isFile) {
        archive.file(srcPath, {name: path.basename(srcPath)});
      } else {
        archive.bulk([{expand: true, cwd: srcPath, src: ['**']}]);
      }

      archive.finalize();
      return archive;
    });
};
