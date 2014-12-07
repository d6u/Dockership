'use strict';

var Promise = require('bluebird');
var path = require('path');
var fs = require('../fs-promisified');
var isFileAsync = require('./is-file-async');
var createArchiveStream = require('./create-archive-stream');


/**
 * create a tarbar at dest path
 * @param  {String} src  - if is a dir, put its content into the root of tarball
 * @param  {String} dest
 * @return {String} a absolute path of tarball that just created
 */
module.exports = function (src, dest) {

  var srcPath  = path.resolve(src);
  var destPath = path.resolve(dest);

  return isFileAsync(destPath)
    .then(function (isFile) {
      if (!isFile) {
        var basename = path.basename(srcPath) + '.tar';
        destPath = path.join(destPath, basename);
      }
      throw null;
    })
    .catch(function () {
      return fs.createWriteStream(destPath); // dest path is a file that doesn't exist yet
    })
    .then(function (output) {
      return [output, createArchiveStream(srcPath)];
    })
    .spread(function (output, archive) {
      return new Promise(function (resolve, reject) {
        output.on('close', function () {
          resolve(destPath);
        });
        archive.pipe(output);
      });
    });
};
