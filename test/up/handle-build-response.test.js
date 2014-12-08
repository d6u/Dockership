var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var EventEmitter = require('events').EventEmitter;
var Stream       = require('stream');
var Promise      = require('bluebird');
var fs           = require('../../lib/fs-promisified');
var path         = require('path');

var handleBuildResponse = require('../../lib/up/handle-build-response');

describe('handleBuildResponse', function () {

  it('should finish if no error was emitted', function (done) {
    var emitter = new EventEmitter();
    var handler = handleBuildResponse(emitter);

    fs.readFileAsync(path.resolve('test/fixture/docker-response.txt'), {encoding: 'utf8'})
      .then(function (text) {
        var readable = new Stream.Readable();
        var pieces = text.split('<CHUNK-END>');
        var i = 0;
        readable._read = function () {
          readable.push(pieces[i]);
          i += 1;
          if (i === pieces.length) {
            readable.push(null);
          }
        };

        var j = 0;
        emitter.on('info', function (str) {
          expect(j).lte(i);
          j += 1;
        });

        handler(readable)
          .then(function () {
            done();
          })
          .catch(done);
      });
  });

  it('should emit error', function (done) {
    var emitter = new EventEmitter();
    var handler = handleBuildResponse(emitter);

    fs.readFileAsync(path.resolve('test/fixture/docker-response-error.txt'), {encoding: 'utf8'})
      .then(function (text) {
        var readable = new Stream.Readable();
        var pieces = text.split('<CHUNK-END>');
        var i = 0;
        readable._read = function () {
          readable.push(pieces[i]);
          i += 1;
          if (i === pieces.length) {
            readable.push(null);
          }
        };

        var j = 0;
        emitter.on('info', function (str) {
          expect(j).lte(i);
          j += 1;
        });

        emitter.on('error', function (err) {
          expect(err.code).eql('BUILDERROR');
          expect(err.message).eql('runit-app.sh: no such file or directory');
        });

        handler(readable)
          .then(function () {
            done(new Error('should not execute'));
          })
          .catch(function (err) {
            expect(err.code).eql('BUILDERROR');
            expect(err.message).eql('runit-app.sh: no such file or directory');
            done();
          })
          .catch(done);
      });
  });
});
