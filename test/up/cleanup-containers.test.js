var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');

var async = require('../../lib/async-promisified');

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
        stopAsync: spyStopAsync,
        removeAsync: sypRemoveAsync
      };
    });

    Promise.bind({
      docker: {
        getContainer: spyGetContainer
      },
      containers: [
        {
          "Command": "/sbin/my_init",
          "Created": 1416929980,
          "Id": "0df6f8ecbfd9c6193d8271cb9adbbdf0494f631562d92e61b20d599ec6061c68",
          "Image": "someone/baseimage:0.9.15",
          "Names": [
            "/thirsty_brattain"
          ],
          "Ports": [],
          "Status": "Exited (0) 34 hours ago"
        },
        {
          "Command": "/sbin/my_init",
          "Created": 1416930034,
          "Id": "96eb453b7eaa19d77f43ed453a428eba0623273f605b532a7a6e29e19072c96e",
          "Image": "someone/baseimage:0.9.15",
          "Names": [
            "/hungry_elion"
          ],
          "Ports": [
            {
              "IP": "0.0.0.0",
              "PrivatePort": 10000,
              "PublicPort": 80,
              "Type": "tcp"
            }
          ],
          "Status": "Up 7 hours"
        }
      ],
      container: {
        Id: '0df6f8ecbfd9c6193d8271cb9adbbdf0494f631562d92e61b20d599ec6061c68'
      }
    })
      .then(cleanupContainers)
      .then(function () {

        expect(spyEachAsync.callCount).eql(1);
        expect(spyEachAsync.firstCall.args[0]).eql([{
          "Command": "/sbin/my_init",
          "Created": 1416930034,
          "Id": "96eb453b7eaa19d77f43ed453a428eba0623273f605b532a7a6e29e19072c96e",
          "Image": "someone/baseimage:0.9.15",
          "Names": [
            "/hungry_elion"
          ],
          "Ports": [
            {
              "IP": "0.0.0.0",
              "PrivatePort": 10000,
              "PublicPort": 80,
              "Type": "tcp"
            }
          ],
          "Status": "Up 7 hours"
        }]);

        expect(spyGetContainer.callCount).eql(1);
        expect(spyStopAsync.callCount).eql(1);
        expect(sypRemoveAsync.callCount).eql(1);

        done();
      })
      .catch(done);
  });
});
