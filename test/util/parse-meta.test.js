var expect = require('chai').expect;
var sinon = require('sinon');

var parseMeta  = require('../../lib/util/parse-meta');

describe('parseMeta', function () {

  var sandbox = sinon.sandbox.create();

  before(function () {
    sandbox.stub(Date.prototype, 'toJSON', function () {
      return '2014-11-25T15:49:05.859Z';
    });
  });

  after(function () {
    sandbox.restore();
  });

  it('should parse correct meta', function () {
    var meta = {
      'repo': 'someone/baseimage',
      'version': '1.0.0',
      'publish': ['10000:80'],
      'volume': ['/host/log:/container/log']
    };

    expect(parseMeta(meta)).eql({
      'name': '2014-11-25T15_49_05.859Z',
      'Image': 'someone/baseimage:1.0.0',
      'Volumes': {
        '/container/log': {}
      },
      'ExposedPorts': {
        '80/tcp': {}
      },
      'HostConfig': {
        'Binds': ['/host/log:/container/log'],
        'PortBindings': {
          '80/tcp': [{
            'HostPort': '10000'
          }]
        }
      }
    });
  });

  it('should throw PropertyMissingError if `repo` is not defined', function (done) {
    var meta = {
      'version': '1.0.0'
    };

    try {
      parseMeta(meta);
      done(new Error('did not throw error'));
    } catch (err) {
      expect(err.name).eq('PropertyMissingError');
      expect(err.message).eq('"repo" is required but not defined');
      done();
    }
  });

  it('should throw FieldNotValidError if `publish` is not in valid format', function (done) {
    var meta = {
      'repo': 'someone/baseimage',
      'version': '1.0.0',
      'publish': ['12345:123:123'] // 12345 is not a IP addr
    };

    try {
      parseMeta(meta);
      done(new Error('did not throw error'));
    } catch (err) {
      expect(err.name).eq('FieldNotValidError');
      expect(err.message).eq('"publish" with value "12345:123:123" is not in valid format, it should match: /^(?!:)((<ip>:)?(<hostPort>)?:)?<containerPort>$/');
      done();
    }
  });

});
