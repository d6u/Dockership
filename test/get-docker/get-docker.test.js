'use strict';

var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise    = require('bluebird');

var rightConfig = require('../fixture/right-ssd-config.json');
var wrongConfig = require('../fixture/wrong-ssd-connection-config.json');

describe('getDocker', function () {

  it('should successfully return Docker instance with correct config', function (done) {
    var FakeDocker = sinon.spy();
    var ca   = new Buffer('ca\n');
    var cert = new Buffer('cert\n');
    var key  = new Buffer('key\n');

    var getDocker = proxyquire('../../lib/get-docker', {
      './docker-promisified': FakeDocker,
      '../get-config': function () {
        return Promise.resolve(rightConfig);
      },
      './get-keys': function () {
        return Promise.resolve({ca: ca, cert: cert, key: key});
      }
    });

    getDocker().then(function (docker) {
      expect(docker).instanceof(FakeDocker);

      expect(FakeDocker.calledWithNew()).true;
      expect(FakeDocker.callCount).eql(1);

      expect(FakeDocker.firstCall.args[0]).eql({
        protocol: 'protocol',
        host: 'some.random.host',
        port: '12345',
        ca: ca,
        cert: cert,
        key: key
      });

      done();
    })
    .catch(done);
  });

  it('should fail to resolve with keys', function (done) {
    var FakeDocker = sinon.spy();
    var getDocker = proxyquire('../../lib/get-docker', {
      './docker-promisified': FakeDocker,
      '../get-config': function () {
        return Promise.resolve(wrongConfig);
      },
      './get-keys': function () {
        return Promise.resolve();
      }
    });

    getDocker()
      .then(function () {
        done(new Error('did not throw error'));
      })
      .catch(function (err) {
        expect(err.message).eql('ssd config does not have correct "connection" value');
        expect(FakeDocker.callCount).eql(0);
        done();
      })
      .catch(done);
  });
});
