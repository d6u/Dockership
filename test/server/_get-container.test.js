var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');

describe('Server', function () {
  describe('_getContainer', function () {

    beforeEach(function () {
      var Server = proxyquire('../../index', {});
      this.server = new Server('testing');
    });

    it('should resolve with container that match target image', function (done) {
      this.server.getContainers = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server.containers = [{
        "Command": "/sbin/my_init",
        "Created": 1416929980,
        "Id": "0df6f8ecbfd9c6193d8271cb9adbbdf0494f631562d92e61b20d599ec6061c68",
        "Image": "someone/baseimage:0.9.15",
        "Names": [
          "/thirsty_brattain"
        ],
        "Ports": [],
        "Status": "Up 34 hours",
        "repo": "someone/baseimage",
        "tag": "someone/baseimage:0.9.15",
        "version": "0.9.15"
      }];
      this.server.image = {
        "Created": 1412332797,
        "Id": "cf39b476aeec4d2bd097945a14a147dc52e16bd88511ed931357a5cd6f6590de",
        "ParentId": "64463062ff222a46710cad76581befc2502cf9bf43663d398ab279ce5203778c",
        "RepoTags": [
          "someone/baseimage:0.9.15",
          "someone/baseimage:latest"
        ],
        "Size": 0,
        "VirtualSize": 288990123,
        "repo": "someone/baseimage",
        "tag": "someone/baseimage:0.9.15",
        "version": "0.9.15"
      };
      this.server.docker = {};

      this.server._getContainer()
        .then(function () {
          expect(this.container).eql({
            "Command": "/sbin/my_init",
            "Created": 1416929980,
            "Id": "0df6f8ecbfd9c6193d8271cb9adbbdf0494f631562d92e61b20d599ec6061c68",
            "Image": "someone/baseimage:0.9.15",
            "Names": [
              "/thirsty_brattain"
            ],
            "Ports": [],
            "Status": "Up 34 hours",
            "repo": "someone/baseimage",
            "tag": "someone/baseimage:0.9.15",
            "version": "0.9.15"
          });
          expect(this.getContainers.callCount).eq(1);

          done();
        })
        .catch(done);
    });

    it('should resolve with undefined if no container matching target image', function (done) {
      this.server.getContainers = sinon.spy(function () {
        return Promise.resolve();
      });
      this.server.containers = [{
        "Command": "/sbin/my_init",
        "Created": 1416929980,
        "Id": "0df6f8ecbfd9c6193d8271cb9adbbdf0494f631562d92e61b20d599ec6061c68",
        "Image": "someone/baseimage:0.9.15",
        "Names": [
          "/thirsty_brattain"
        ],
        "Ports": [],
        "Status": "Exited 34 hours",
        "repo": "someone/baseimage",
        "tag": "someone/baseimage:0.9.15",
        "version": "0.9.15"
      }];
      this.server.image = {
        "Created": 1412332797,
        "Id": "cf39b476aeec4d2bd097945a14a147dc52e16bd88511ed931357a5cd6f6590de",
        "ParentId": "64463062ff222a46710cad76581befc2502cf9bf43663d398ab279ce5203778c",
        "RepoTags": [
          "someone/baseimage:1.0.0",
          "someone/baseimage:latest"
        ],
        "Size": 0,
        "VirtualSize": 288990123,
        "repo": "someone/baseimage",
        "tag": "someone/baseimage:1.0.0",
        "version": "1.0.0"
      };
      this.server.docker = {};

      this.server._getContainer()
        .then(function () {
          expect(this.container).undefined;
          expect(this.getContainers.callCount).eq(1);

          done();
        })
        .catch(done);
    });

  });
});
