'use strict';

var ValueBag = require('./value-bag');
var ejs = require('ejs');

function ConfigTemplate(template, valueDef) {
  this.templateStr = JSON.stringify(template);
  this.valueBag = new ValueBag(valueDef);
  this.config = null;
}

ConfigTemplate.prototype.get = function () {
  if (!this.config) {
    this.config = JSON.parse(ejs.render(this.templateStr, this.valueBag.get()));
  }
  return this.config;
};

ConfigTemplate.prototype.new = function () {
  this.config = JSON.parse(ejs.render(this.templateStr, this.valueBag.get()));
  return this.config;
};

module.exports = ConfigTemplate;
