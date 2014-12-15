var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');

describe('Server', function () {
  describe('_startContainer', function () {

    beforeEach(function () {
      var Server = proxyquire('../../index', {
        './lib/parse-meta': function () {}
      });
      this.server = new Server('testing');
    });

    it('should do nothing if `this.container` is already Up', function (done) {
      this.server.getContainers = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server.container = {
        Id: 'abc',
        Status: 'Up 7 hours'
      };

      this.server._startContainer()
        .then(function () {
          expect(this.container.Id).eql('abc');
          expect(this.getContainers.callCount).eq(0);
          done();
        })
        .catch(done);
    });

    it('should start container if `this.container` is not Up', function (done) {
      this.server.getContainers = sinon.spy(function () {
        this.containers = [{
          Id: 'abc',
          Status: 'Up 7 hours'
        }];
        return Promise.resolve();
      });
      this.server.container = {
        Id: 'abc',
        Status: 'Up 7 hours'
      };
      var spyStartAsync = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server.docker = {
        getContainer: sinon.spy(function () {
          return {
            startAsync: spyStartAsync
          };
        })
      };
      this.server.container = {
        Id: 'abc',
        Status: 'Exited (0) 34 hours ago'
      };

      this.server._startContainer()
        .then(function () {
          expect(this.docker.getContainer.callCount).eq(1);
          expect(this.docker.getContainer.args[0][0]).eq('abc');
          expect(spyStartAsync.callCount).eq(1);
          expect(this.getContainers.callCount).eq(1);

          expect(this.container).eql({
            Id: 'abc',
            Status: 'Up 7 hours'
          });

          done();
        })
        .catch(done);
    });

    it('should create and start container if `this.container` is undefined', function (done) {
      this.server.getContainers = sinon.spy(function () {
        this.containers = [{
          Id: 'abc',
          Status: 'Up 7 hours'
        }];
        return Promise.resolve();
      });
      var spyStartAsync = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server.docker = {
        getContainer: sinon.spy(function () {}),
        createContainerAsync: sinon.spy(function () {
          return Promise.resolve({
            startAsync: spyStartAsync
          });
        })
      };

      this.server._startContainer()
        .then(function () {
          expect(this.docker.getContainer.callCount).eq(0);
          expect(this.docker.createContainerAsync.callCount).eq(1);
          expect(spyStartAsync.callCount).eq(1);
          expect(this.getContainers.callCount).eq(1);
          expect(this.container).eql({
            Id: 'abc',
            Status: 'Up 7 hours'
          });

          done();
        })
        .catch(done);
    });

  });
});
