var expect         = require('chai').expect;
var proxyquire     = require('proxyquire').noPreserveCache().noCallThru();

var Promise        = require('bluebird');

var containersMock = require('./fixture/get-containers-containers.json');
var meta100        = require('./fixture/meta-1-0-0.json');

describe('getContainers', function () {

  it('should resolve with only related containers data ordered by version and status', function (done) {

    var getContainers = proxyquire('../lib/get-containers', {
      './get-config': function () {
        return Promise.resolve(meta100);
      },
      './get-docker': function () {
        return Promise.resolve({
          listContainersAsync: function () {
            return Promise.resolve(containersMock);
          }
        });
      }
    });

    getContainers()
      .then(function (containers) {
        expect(containers.length).eql(6);

        expect(containers[0].version).eql('0.9.15');
        expect(containers[1].version).eql('0.9.15');
        expect(containers[2].version).eql('0.9.15');
        expect(containers[3].version).eql('0.9.15');
        expect(containers[4].version).eql('0.9.14');
        expect(containers[5].version).eql('0.9.8');

        expect(containers[0].Status).match(/^Up/);
        expect(containers[1].Status).match(/^Up/);
        expect(containers[2].Status).not.match(/^Up/);
        expect(containers[3].Status).not.match(/^Up/);

        expect(containers[0].repo).eql('someone/baseimage');
        expect(containers[1].repo).eql('someone/baseimage');
        expect(containers[2].repo).eql('someone/baseimage');
        expect(containers[3].repo).eql('someone/baseimage');
        expect(containers[4].repo).eql('someone/baseimage');
        expect(containers[5].repo).eql('someone/baseimage');

        expect(containers[0].tag).eql('someone/baseimage:0.9.15');
        expect(containers[1].tag).eql('someone/baseimage:0.9.15');
        expect(containers[2].tag).eql('someone/baseimage:0.9.15');
        expect(containers[3].tag).eql('someone/baseimage:0.9.15');
        expect(containers[4].tag).eql('someone/baseimage:0.9.14');
        expect(containers[5].tag).eql('someone/baseimage:0.9.8');

        done();
      })
      .catch(done);
  });
});
