'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect = require('chai').expect;

var EventEmitter = require('events').EventEmitter;
var Stream = require('stream');
var Readable = Stream.Readable;
var Bluebird = require('bluebird');
var path = require('path');
var fs = Bluebird.promisifyAll(require('fs'));
var BuildError = require('../../lib/errors/build-error');

function createReadable(_read) {
  var response = new Readable();
  response._read = _read;
  response.setTimeout = function () {};
  return response;
}

function createResponse(fileName) {
  var fixturePath = path.join(__dirname, '..', 'fixture', '_handle-build-response', fileName);
  return fs
    .readFileAsync(fixturePath, {encoding: 'utf8'})
    .then(function (text) {
      var pieces = text.split('<CHUNK-END>');
      return createReadable(function () {
        this.push(pieces.shift());
      });
    });
}

describe('_handleBuildResponse()', function () {
  var _handleBuildResponse, ee, emitEnd;

  beforeEach(function () {
    emitEnd = false;
    ee = new EventEmitter();
    ee.on('buildMessage', function (msg) {
      if (msg === 'end') {
        emitEnd = true;
      }
    });
    _handleBuildResponse = proxyquire('../../lib/build/_handle-build-response', {})
      .bind(ee);
  });

  it('should end', function (done) {
    createResponse('docker-response.txt')
      .then(function (response) {
        return _handleBuildResponse(response);
      })
      .then(function () {
        expect(emitEnd).equal(true);
      })
      .then(done, done);
  });

  it('should reject if response error', function (done) {
    var response = createReadable(function () {});

    _handleBuildResponse(response)
      .then(function () {
        done(new Error('Did not throw error'));
      })
      .catch(Error, function (err) {
        expect(err.message).equal('random error');
        expect(emitEnd).equal(true);
      })
      .then(done, done);

    response.emit('error', new Error('random error'));
  });

  it('should reject if JSON syntax error', function (done) {
    var response = createReadable(function () {
      this.push('not valid json }{');
    });

    _handleBuildResponse(response)
      .then(function () {
        done(new Error('Did not throw error'));
      })
      .catch(SyntaxError, function (err) {
        expect(err.message).contains('Unexpected token');
        expect(emitEnd).equal(true);
      })
      .then(done, done);
  });

  it('should reject when BuildError', function (done) {
    createResponse('docker-response-error.txt')
      .then(function (response) {
        return _handleBuildResponse(response);
      })
      .then(function () {
        done(new Error('Did not throw error'));
      })
      .catch(BuildError, function (err) {
        expect(err.message).equal('runit-app.sh: no such file or directory');
        expect(err.details).equal('runit-app.sh: no such file or directory');
        expect(emitEnd).equal(true);
      })
      .then(done, done);
  });

});
