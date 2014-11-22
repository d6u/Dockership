'use strict';

var expect = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');

describe('getDocker', function () {

  it('should successfully return Docker instance with correct config', function (done) {
    var rightConfig = require('./fixture/right-ssd-config.json');
    rightConfig['@runtimeGlobal'] = true;

    var FakeDocker = sinon.spy();

    var getDocker = proxyquire('../lib/get-docker', {
      './ssd-config': rightConfig,
      './docker-promisified': FakeDocker
    });

    getDocker().then(function (docker) {
      expect(docker).instanceof(FakeDocker);

      expect(FakeDocker.firstCall.args[0]).eql({
        protocol: 'protocol',
        host: 'some.random.host',
        port: '12345',
        ca: new Buffer('ca\n'),
        cert: new Buffer('cert\n'),
        key: new Buffer('key\n')
      });

      expect(FakeDocker.calledWithNew()).true;
      expect(FakeDocker.callCount).eql(1);

      done();
    })
    .catch(done);
  });

  it('should fail to resolve with keys', function (done) {
    var wrongConfig = require('./fixture/wrong-ssd-connection-config.json');
    wrongConfig['@runtimeGlobal'] = true;

    var getDocker = proxyquire('../lib/get-docker', {
      './ssd-config': wrongConfig
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
