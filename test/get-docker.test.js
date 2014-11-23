'use strict';

var expect = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');

var Promise = require('bluebird');

describe('getDocker', function () {

  it('should successfully return Docker instance with correct config', function (done) {
    var rightConfig = require('./fixture/right-ssd-config.json');
    var FakeDocker = sinon.spy();
    var ca = new Buffer('ca\n');
    var cert = new Buffer('cert\n');
    var key = new Buffer('key\n');

    var getDocker = proxyquire('../lib/get-docker', {
      './ssd-config': rightConfig,
      './docker-promisified': FakeDocker,
      './get-keys': function () {
        return new Promise(function (resolve, reject) {
          return resolve([ca, cert, key]);
        });
      }
    });

    getDocker().then(function (docker) {
      expect(docker).instanceof(FakeDocker);

      expect(FakeDocker.firstCall.args[0]).eql({
        protocol: 'protocol',
        host: 'some.random.host',
        port: '12345',
        ca: ca,
        cert: cert,
        key: key
      });

      expect(FakeDocker.calledWithNew()).true;
      expect(FakeDocker.callCount).eql(1);

      done();
    })
    .catch(done);
  });

  it('should fail to resolve with keys', function (done) {
    var wrongConfig = require('./fixture/wrong-ssd-connection-config.json');

    var getDocker = proxyquire('../lib/get-docker', {
      './ssd-config': wrongConfig,
      './docker-promisified': function () {},
      './get-keys': function () {
        return new Promise(function (resolve, reject) {
          return resolve();
        });
      }
    });

    getDocker().then(function () {
      done(new Error('did not throw error'));
    })
    .catch(function (err) {
      expect(err.message).eql('ssd config does not have correct "connection" value');
      done();
    })
    .catch(done);
  });
});
