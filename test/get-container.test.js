var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');

describe('getContainer', function () {

  var containers = [
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
  ];

  it('should resolve with newest container from server if server has newest container and the container is already Up', function (done) {

    var spyGetContainers = sinon.spy(function () {
      return Promise.resolve([{
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
      }]);
    });

    var spyParseMeta = sinon.spy(function (meta) {
      return meta;
    });

    var getContainer = proxyquire('../lib/up/get-container', {
      '../get-containers': spyGetContainers,
      '../parse-meta':     spyParseMeta
    });

    Promise.bind({
      image: {
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
      },
      docker: {}
    })
      .then(getContainer)
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

        expect(spyGetContainers.callCount).eql(1);
        expect(spyParseMeta.callCount).eql(0);

        done();
      })
      .catch(done);
  });

  it('should resolve with newest container from server and start it if server has newest container and the container is not Up', function (done) {
    var i = 0;

    var spyGetContainers = sinon.spy(function () {
      if (i === 0) {
        i += 1;
        return Promise.resolve([{
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
        }]);
      } else {
        return Promise.resolve([{
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
        }]);
      }
    });

    var spyParseMeta = sinon.spy(function (meta) {
      return meta;
    });

    var getContainer = proxyquire('../lib/up/get-container', {
      '../get-containers': spyGetContainers,
      '../parse-meta':     spyParseMeta
    });

    var spyStartAsync = sinon.spy(function () {
      return Promise.resolve();
    });

    var spyDockerGetContainer = sinon.spy(function () {
      return {
        startAsync: spyStartAsync
      };
    });

    Promise.bind({
      image: {
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
      },
      docker: {
        getContainer: spyDockerGetContainer
      }
    })
      .then(getContainer)
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

        expect(spyGetContainers.callCount).eql(2);
        expect(spyParseMeta.callCount).eql(0);
        expect(spyDockerGetContainer.callCount).eql(1);
        expect(spyStartAsync.callCount).eql(1);

        done();
      })
      .catch(done);
  });

  it('should resolve with newest container build from target image and start it if server does not have currect container running', function (done) {
    var i = 0;

    var spyGetContainers = sinon.spy(function () {
      if (i === 0) {
        i += 1;
        return Promise.resolve([{
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
        }]);
      } else {
        return Promise.resolve([{
          "Command": "/sbin/my_init",
          "Created": 1416929980,
          "Id": "0df6f8ecbfd9c6193d8271cb9adbbdf0494f631562d92e61b20d599ec6061c68",
          "Image": "someone/baseimage:1.0.0",
          "Names": [
            "/thirsty_brattain"
          ],
          "Ports": [],
          "Status": "Up 34 hours",
          "repo": "someone/baseimage",
          "tag": "someone/baseimage:1.0.0",
          "version": "1.0.0"
        }]);
      }
    });

    var spyParseMeta = sinon.spy(function (meta) {
      return meta;
    });

    var getContainer = proxyquire('../lib/up/get-container', {
      '../get-containers': spyGetContainers,
      '../parse-meta':     spyParseMeta
    });

    var spyStartAsync = sinon.spy(function () {
      return Promise.resolve();
    });

    var sypCreateContainerAsync = sinon.spy(function () {
      return {
        startAsync: spyStartAsync
      };
    });

    Promise.bind({
      image: {
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
      },
      docker: {
        createContainerAsync: sypCreateContainerAsync
      }
    })
      .then(getContainer)
      .then(function () {

        expect(this.container).eql({
          "Command": "/sbin/my_init",
          "Created": 1416929980,
          "Id": "0df6f8ecbfd9c6193d8271cb9adbbdf0494f631562d92e61b20d599ec6061c68",
          "Image": "someone/baseimage:1.0.0",
          "Names": [
            "/thirsty_brattain"
          ],
          "Ports": [],
          "Status": "Up 34 hours",
          "repo": "someone/baseimage",
          "tag": "someone/baseimage:1.0.0",
          "version": "1.0.0"
        });

        expect(spyGetContainers.callCount).eql(2);
        expect(spyParseMeta.callCount).eql(1);
        expect(sypCreateContainerAsync.callCount).eql(1);
        expect(spyStartAsync.callCount).eql(1);

        done();
      })
      .catch(done);
  });
});
