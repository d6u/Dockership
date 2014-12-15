var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');

var rightConfig = require('../fixture/right-ssd-config.json');
var wrongConfig = require('../fixture/wrong-ssd-connection-config.json');

describe('Server', function () {
  describe('getDocker', function () {

    beforeEach(function () {
      this.sandbox = sinon.sandbox.create();
      this.FakeDocker = this.sandbox.spy();
      var Server = proxyquire('../../index', {
        './lib/docker-promisified': this.FakeDocker
      });
      this.server = new Server('testing');
      this.server.getConfig = function () {
        return Promise.resolve();
      };
    });

    afterEach(function () {
      this.sandbox.restore();
    });

    it('should fail with wrong connection config', function (done) {
      var _this = this;
      this.server._getKeys = function () {
        return Promise.resolve();
      };
      this.server.ssd = wrongConfig;
      this.server.getDocker()
        .then(function () {
          done(new Error('did not throw error'));
        })
        .catch(function (err) {
          expect(err.message).eq('ssd config does not have correct "connection" value');
          expect(_this.FakeDocker.callCount).eql(0);
          done();
        })
        .catch(done);
    });

    it('should success - return Docker instance and cached it', function (done) {
      var _this = this;
      var ca    = new Buffer('ca\n');
      var cert  = new Buffer('cert\n');
      var key   = new Buffer('key\n');
      this.server._getKeys = function () {
        return Promise.resolve({ca: ca, cert: cert, key: key});
      };
      this.server.ssd = rightConfig;

      this.server.getDocker()
        .then(function (docker) {
          expect(docker).instanceof(_this.FakeDocker);
          expect(_this.FakeDocker.calledWithNew()).true;
          expect(_this.FakeDocker.callCount).eq(1);
          expect(_this.FakeDocker.firstCall.args[0]).eql({
            protocol: 'protocol',
            host: 'some.random.host',
            port: '12345',
            ca: ca,
            cert: cert,
            key: key,
            timeout: 5000
          });

          return _this.server.getDocker().then(function (docker2) {
            expect(docker2).eq(docker);
            done();
          });
        })
        .catch(done);
    });

  });
});
