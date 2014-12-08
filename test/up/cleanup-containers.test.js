var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');
var async   = require('../../lib/async-promisified');

var containersMock = require('../fixture/cleanup-containers-containers.json');

describe('cleanupContainers', function () {

  it('should stop and remove containers other than `this.container`', function (done) {
    var spyEachAsync = sinon.spy(async, 'eachAsync');

    var cleanupContainers = proxyquire('../../lib/up/cleanup-containers', {
      '../async-promisified': async
    });

    var spyStopAsync = sinon.spy(function () {
      return Promise.resolve();
    });

    var sypRemoveAsync = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyGetContainer = sinon.spy(function () {
      return {
        stopAsync:   spyStopAsync,
        removeAsync: sypRemoveAsync
      };
    });

    Promise.bind({
      docker:    { getContainer: spyGetContainer },
      containers:  containersMock,
      container: { Id: containersMock[0].Id }
    })
      .then(cleanupContainers)
      .then(function () {
        expect(spyEachAsync.callCount).eql(1);
        expect(spyEachAsync.firstCall.args[0]).eql(containersMock.slice(1));
        expect(spyGetContainer.callCount).eql(2);
        expect(spyStopAsync.callCount).eql(1);
        expect(sypRemoveAsync.callCount).eql(2);

        done();
      })
      .catch(done);
  });
});
