'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect = require('chai').expect;

var EventEmitter = require('events').EventEmitter;
var Stream = require('stream');
var Bluebird = require('bluebird');
var path = require('path');
var fs = Bluebird.promisifyAll(require('fs'));


describe('_handleBuildResponse()', function () {

  var _handleBuildResponse, ee;

  beforeEach(function () {
    _handleBuildResponse = proxyquire('../lib/build/_handle-build-response', {});
    ee = new EventEmitter();
  });

  it('should finish if no error was emitted', function (done) {
    fs.readFileAsync(path.resolve('test/fixture/_handle-build-response/docker-response.txt'), {encoding: 'utf8'})
      .then(function (text) {
        var readable = new Stream.Readable();
        readable.setTimeout = function () {};
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
        ee.on('info', function () {
          expect(j).lte(i);
          j += 1;
        });

        _handleBuildResponse.bind(ee)(readable).then(done, done);
      });
  });

  it('should emit error', function (done) {
    fs.readFileAsync(path.resolve('test/fixture/_handle-build-response/docker-response-error.txt'), {encoding: 'utf8'})
      .then(function (text) {
        var readable = new Stream.Readable();
        readable.setTimeout = function () {};
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
        ee.on('info', function () {
          expect(j).lte(i);
          j += 1;
        });

        ee.on('error', function (err) {
          expect(err.message).eql('runit-app.sh: no such file or directory');
          expect(err.errorDetail).eql({message: 'runit-app.sh: no such file or directory'});
          expect(err.code).eql('BUILDERROR');
        });

        _handleBuildResponse.bind(ee)(readable)
          .then(function () {
            done(new Error('Did not throw error'));
          })
          .catch(function (err) {
            expect(err.code).eql('BUILDERROR');
            expect(err.message).eql('runit-app.sh: no such file or directory');
            expect(err.errorDetail).eql({message: 'runit-app.sh: no such file or directory'});
          })
          .then(done, done);
      });
  });

});
