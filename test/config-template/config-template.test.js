'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect = require('chai').expect;
var ValueBag = require('../../lib/config-template/value-bag');

describe('ConfigTemplate', function () {

  var ConfigTemplate, portFunction, template, configTemplate;

  beforeEach(function () {
    ConfigTemplate = proxyquire('../../lib/config-template', {});

    portFunction = function (existing) {
      if (existing.length) {
        return existing[existing.length - 1] + 1;
      } else {
        return 9000;
      }
    };

    template = {publish: '<%= port %>:<%= port + 1 %>'};

    configTemplate = new ConfigTemplate(template, {port: portFunction});
  });

  it('should create configTemplate instance', function () {
    expect(configTemplate.templateStr).equal(JSON.stringify(template));
    expect(configTemplate.valueBag).instanceof(ValueBag);
    expect(configTemplate.config).equal(null);
  });

  describe('get()', function () {
    it('should render config', function () {
      expect(configTemplate.get()).eql({publish: '9000:9001'});
      expect(configTemplate.get()).eql({publish: '9000:9001'});
    });
  });

  describe('new()', function () {
    it('should render new config', function () {
      expect(configTemplate.get()).eql({publish: '9000:9001'});
      expect(configTemplate.new()).eql({publish: '9001:9002'});
      expect(configTemplate.get()).eql({publish: '9001:9002'});
    });
  });

});
