var expect = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');

var Promise = require('bluebird');

describe('dockerPromisified', function () {

  var sandbox;

  before(function () {
    sandbox = sinon.sandbox.create();
  });

  after(function () {
    sandbox.restore();
  });

  it('should promisify container instance', function () {
    function FakeDocker() {}
    function FakeContainer() {}
    FakeContainer.prototype.start = function () {};
    FakeDocker.prototype.getContainer = function () {
      return new FakeContainer();
    };

    var spy = sandbox.spy(Promise, 'promisifyAll');

    var Docker = proxyquire('../../lib/get-docker/docker-promisified', {
      'bluebird':  Promise,
      'dockerode': FakeDocker
    });

    var d = new Docker();
    expect(d.getContainerAsync).not.undefined;

    var c = d.getContainer();
    expect(c.startAsync).not.undefined;

    expect(spy.callCount).eql(2);
    d.getContainer()
    expect(spy.callCount).eql(2);
  });
});
