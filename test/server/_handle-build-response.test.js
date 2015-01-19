var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var EventEmitter = require('events').EventEmitter;
var Stream       = require('stream');
var Promise      = require('bluebird');
var path         = require('path');
var fs           = require('../../lib/fs-promisified');

describe('Server', function () {
  describe('_handleBuildResponse', function () {

    beforeEach(function () {
      var Server = proxyquire('../../index', {});
      this.server = new Server('testing');
    });

    it('should finish if no error was emitted', function (done) {
      var _this = this;
      this.server.emitter = new EventEmitter();

      fs.readFileAsync(path.resolve('test/fixture/docker-response.txt'), {encoding: 'utf8'})
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
          _this.server.emitter.on('info', function (str) {
            expect(j).lte(i);
            j += 1;
          });

          _this.server._handleBuildResponse(readable)
            .then(function () {
              done();
            })
            .catch(done);
        });
    });

    it('should emit error', function (done) {
      var server = this.server;

      fs.readFileAsync(path.resolve('test/fixture/docker-response-error.txt'), {encoding: 'utf8'})
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
          server.on('info', function (str) {
            expect(j).lte(i);
            j += 1;
          });

          server.on('error', function (err) {
            expect(err).eql({
              error: 'runit-app.sh: no such file or directory',
              errorDetail: {
                message: 'runit-app.sh: no such file or directory'
              }
            });
          });

          server._handleBuildResponse(readable)
            .then(function () {
              done(new Error('Did not throw error'));
            })
            .catch(function (err) {
              expect(err.code).eql('BUILDERROR');
              expect(err.message).eql('runit-app.sh: no such file or directory');
              expect(err.errorDetail).eql({message: 'runit-app.sh: no such file or directory'});
              done();
            })
            .catch(done);
        });
    });

  });
});
