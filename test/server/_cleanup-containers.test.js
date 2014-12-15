var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');
var async   = require('../../lib/async-promisified');

var containersMock = require('../fixture/cleanup-containers-containers.json');

describe('Server', function () {
  describe('_cleanUpContainers', function () {

    it('should stop and remove containers other than `this.container`', function (done) {
      var spyEachAsync = sinon.spy(async, 'eachAsync');
      var Server = proxyquire('../../index', {
        './lib/async-promisified': async
      });
      this.server = new Server('testing');
      this.server.containers = containersMock;
      var spyStopAsync = sinon.spy(function () {
        return Promise.resolve();
      });
      var sypRemoveAsync = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server.docker = {
        getContainer: sinon.spy(function () {
          return {
            stopAsync:   spyStopAsync,
            removeAsync: sypRemoveAsync
          };
        }),

      };
      this.server.container = {
        Id: containersMock[0].Id
      };

      this.server._cleanUpContainers()
        .then(function () {
          expect(spyEachAsync.callCount).eq(1);
          expect(spyEachAsync.firstCall.args[0]).eql(containersMock.slice(1));
          expect(this.docker.getContainer.callCount).eq(2);
          expect(spyStopAsync.callCount).eq(1);
          expect(sypRemoveAsync.callCount).eq(2);

          done();
        })
        .catch(done);
    });

  });
});
