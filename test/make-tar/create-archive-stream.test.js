'use strict';

var expect = require('chai').expect;

var fs = require('../../lib/fs-promisified');
var path = require('path');
var Stream = require('stream');

var createArchiveStream = require('../../lib/make-tar/create-archive-stream');

describe('makeTar', function () {

  describe('createArchiveStream', function () {

    before(function (done) {
      fs.mkdirAsync(path.join(process.cwd(), '.tmp-test'))
        .catch(function () {}) // prevent throw dir exist error
        .finally(done);
    });

    it('should resolve with archive stream if path is file', function (done) {
      var target = path.join(__dirname, '../fixture/make-tar-random-dir/random-file.txt');
      createArchiveStream(target)
        .then(function (archive) {
          expect(archive).instanceof(Stream);
          var stream = fs.createWriteStream(
            path.join(process.cwd(), '.tmp-test', 'sometarfile-file.tar'));
          archive.pipe(stream);
          stream.on('close', done);
        })
        .catch(done);
    });

    it('should resolve with archive stream if path is dir', function (done) {
      var target = path.join(__dirname, '../fixture/make-tar-random-dir');
      createArchiveStream(target)
      .then(function (archive) {
        expect(archive).instanceof(Stream);
        var stream = fs.createWriteStream(
          path.join(process.cwd(), '.tmp-test', 'sometarfile-dir.tar'));
        archive.pipe(stream);
        stream.on('close', done);
      })
      .catch(done);
    });

    it('should throw error if path not exist', function (done) {
      var target = path.join(process.cwd(), 'no-where');
      createArchiveStream(target)
        .then(function () {
          done(new Error('did not throw error'));
        })
        .catch(function (err) {
          expect(err.name).eql('OperationalError');
          done();
        })
        .catch(done);
    });
  });
});
