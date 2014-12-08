'use strict';

var expect = require('chai').expect;
// var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
// var sinon = require('sinon');

var isFileAsync = require('../../lib/make-tar/is-file-async');
var path = require('path');

describe('makeTar', function () {

  describe('isFileAsync', function () {

    it('should resolve with true if path is a file', function (done) {
      var target = path.join(__dirname, '../fixture/make-tar-random-dir/random-file.txt');
      isFileAsync(target)
      .then(function (isFile) {
        expect(isFile).true;
        done();
      })
      .catch(done);
    });

    it('should resolve with false if path is a dir', function (done) {
      var target = path.join(__dirname, '../fixture/make-tar-random-dir');
      isFileAsync(target)
      .then(function (isFile) {
        expect(isFile).false;
        done();
      })
      .catch(done);
    });

    it('should throw error is dir is not a file or dir', function (done) {
      var target = path.join(__dirname, '../fixture/make-tar-random-dir/random-link');
      isFileAsync(target)
      .then(function () {
        done(new Error('did not throw error'));
      })
      .catch(function (err) {
        expect(err.message).contain(' is not a dir or file.');
        done();
      })
      .catch(done);
    });

    it('should throw error if path not exist', function (done) {
      var target = path.join(__dirname, '../no-where');
      isFileAsync(target)
      .then(function () {
        done(new Error('did not throw error'));
      })
      .catch(function (err) {
        expect(err.name).eql('OperationalError')
        done();
      })
      .catch(done);
    });
  });
});
