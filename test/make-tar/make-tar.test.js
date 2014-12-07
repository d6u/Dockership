'use strict';

var expect  = require('chai').expect;

var Promise = require('bluebird');
var path    = require('path');
var fs      = require('../../lib/fs-promisified');

var makeTar = require('../../lib/make-tar');

describe('makeTar', function () {

  var dest1 = path.resolve('.tmp-test', 'make-tar-file.tar');
  var dest2 = path.resolve('.tmp-test');

  before(function (done) {
    Promise.join(
      fs.mkdirAsync(path.join(process.cwd(), '.tmp-test'))
        .catch(function () {}), // prevent throw dir exist error

      fs.unlinkAsync(dest1)
        .catch(function () {}),

      fs.unlinkAsync(path.resolve(dest2, 'make-tar-random-dir.tar'))
        .catch(function () {})
    )
    .finally(done);
  });

  it('should create tarball if dest path is file', function (done) {
    var src = path.resolve('test', 'fixture', 'make-tar-random-dir');

    makeTar(src, dest1) // dest1 does not exist yet
      .then(function (destPath) {
        expect(destPath).eql(dest1);
        return makeTar(src, dest1); // repeat with dest1 as an existing file
      })
      .then(function (destPath) {
        expect(destPath).eql(dest1);
        done();
      })
      .catch(done);
  });

  it('should create tarball if dest path is dir', function (done) {
    var src = path.resolve('test', 'fixture', 'make-tar-random-dir');

    makeTar(src, dest2)
      .then(function (destPath) {
        expect(destPath).eql(path.resolve(dest2, 'make-tar-random-dir.tar'));
        done();
      })
      .catch(done);
  });
});
