var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');

describe('startContainer', function () {

  it('should do nothing if `this.container` is already Up', function (done) {
    var spyGetContainers = sinon.spy();

    var startContainer = proxyquire('../../lib/up/start-container', {
      '../get-containers': spyGetContainers
    });

    Promise.bind({
      container: {
        Id: 'abc',
        Status: 'Up 7 hours'
      }
    })
      .then(startContainer)
      .then(function () {
        expect(this.container.Id).eql('abc');
        expect(spyGetContainers.callCount).eql(0);
        done();
      })
      .catch(done);
  });

  it('should start container if `this.container` is not Up', function (done) {
    var spyGetContainers = sinon.spy(function () {
      return Promise.resolve([{
        Id: 'abc',
        Status: 'Up 7 hours'
      }]);
    });

    var startContainer = proxyquire('../../lib/up/start-container', {
      '../get-containers': spyGetContainers
    });

    var spyStartAsync = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyGetContainer = sinon.spy(function () {
      return {
        startAsync: spyStartAsync
      };
    });

    Promise.bind({
      container: {
        Id: 'abc',
        Status: 'Exited (0) 34 hours ago'
      },
      docker: {
        getContainer: spyGetContainer
      }
    })
      .then(startContainer())
      .then(function () {
        expect(spyGetContainer.callCount).eql(1);
        expect(spyGetContainer.args[0][0]).eql('abc');
        expect(spyStartAsync.callCount).eql(1);
        expect(spyGetContainers.callCount).eql(1);

        expect(this.container).eql({
          Id: 'abc',
          Status: 'Up 7 hours'
        });

        done();
      })
      .catch(done);
  });

  it('should create and start container if `this.container` is undefined', function (done) {
    var spyGetContainers = sinon.spy(function () {
      return Promise.resolve([{
        Id: 'abc',
        Status: 'Up 7 hours'
      }]);
    });

    var startContainer = proxyquire('../../lib/up/start-container', {
      '../get-containers': spyGetContainers,
      '../parse-meta': function () {}
    });

    var spyStartAsync = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyGetContainer = sinon.spy();

    var spyCreateContainerAsync = sinon.spy(function () {
      return {
        startAsync: spyStartAsync
      };
    });

    Promise.bind({
      docker: {
        getContainer:         spyGetContainer,
        createContainerAsync: spyCreateContainerAsync
      }
    })
      .then(startContainer())
      .then(function () {
        expect(spyGetContainer.callCount).eql(0);
        expect(spyCreateContainerAsync.callCount).eql(1);
        expect(spyStartAsync.callCount).eql(1);
        expect(spyGetContainers.callCount).eql(1);

        expect(this.container).eql({
          Id: 'abc',
          Status: 'Up 7 hours'
        });

        done();
      })
      .catch(done);
  });
});
