'use strict';

var charm = require('charm')(process);

function Matrix() {
  this.lines = {};
  this.bottom = null;
}

Matrix.prototype.getReady = function (cb) {
  var self = this;
  charm.position(function (x, y) {
    self.bottom = y;
    cb();
  });
};

Matrix.prototype.addLine = function (id) {
  if (!(id in this.lines)) {
    this.lines[id] = new Line(this.bottom, id);
    this.write('\n');
  }
};

Matrix.prototype.writeToLine = function (id, str) {
  this.lines[id].write(str);
};

Matrix.prototype.write = function (str) {
  charm.position(0, this.bottom);
  charm.write(str.trimRight());
  if (this.bottom < process.stdout.rows) {
    this.bottom += 1;
  } else {
    var self = this;
    Object.keys(this.lines).forEach(function (id) {
      self.lines[id].y -= 1;
    });
  }
  charm.write('\n');
};

function Line(y, id) {
  this.y = y;
  this.id = id;
}

Line.prototype.write = function (str) {
  charm.position(0, this.y);
  charm.erase('line');
  charm.write(this.id + ': ' + str);
};

var Logger = function (log, modifier, cb) {
  var matrix = new Matrix();
  matrix.getReady(function () {
    cb(function (msg) {
      if ('stream' in msg) {
        matrix.write(msg.stream);
      } else if ('status' in msg) {
        if ('id' in msg) {
          matrix.addLine(msg.id);
          if ('progress' in msg) {
            matrix.writeToLine(msg.id, msg.status + ' ' + msg.progress);
          } else {
            matrix.writeToLine(msg.id, msg.status);
          }
        } else {
          matrix.write(msg.status);
        }
      }
    });
  });
};

var fs = require('fs');

fs.readFile('status.txt', {encoding: 'utf8'}, function (err, content) {
  if (err) throw err;

  Logger(null, null, function (logger) {
    var objs = content.split('<JSON> ')
      .map(function (json) {
        var trimmed = json.trim();
        if (trimmed) {
          return JSON.parse(trimmed);
        }
      })
      .filter(function (obj) {
        return obj;
      });

    var i = 0;
    (function say() {
      logger(objs[i]);
      i += 1;
      if (i < objs.length) {
        setTimeout(say, 10);
      }
    })();
  });
});

module.exports = Logger;
