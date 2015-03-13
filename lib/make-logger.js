'use strict';

var makeCharm = require('charm');
var charm = null;

function Line(y) {
  this.y = y;
}

Line.prototype.write = function (str) {
  charm.position(0, this.y);
  charm.erase('line');
  charm.write(str);
};

function Matrix() {
  if (charm) {
    throw new Error('Cannot make new logger before last one end');
  } else {
    charm = makeCharm(process);
  }
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
    this.lines[id] = new Line(this.bottom);
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

Matrix.prototype.end = function () {
  charm.end();
  charm = null;
};

var makeLogger = function (modifier) {
  modifier = modifier || function (str) { return str; };
  var queue = [];
  var matrix = new Matrix();

  function log(msg) {
    if (msg === 'end') {
      matrix.end();
    } else if ('stream' in msg) {
      matrix.write(modifier(msg.stream, 'stream'));
    } else if ('status' in msg) {
      if ('id' in msg) {
        matrix.addLine(msg.id);
        if ('progress' in msg) {
          matrix.writeToLine(msg.id, modifier(msg.id + ': ' + msg.status + ' ' + msg.progress, 'status:id:progress'));
        } else {
          matrix.writeToLine(msg.id, modifier(msg.id + ': ' + msg.status, 'status:id'));
        }
      } else {
        matrix.write(modifier(msg.status, 'status'));
      }
    } else if ('error' in msg) {
      matrix.write(modifier(msg.error, 'error'));
    } else {
      matrix.write(modifier(JSON.stringify(msg)));
    }
  }

  matrix.getReady(function () {
    for (var i = 0; i < queue.length; i++) {
      log(queue[i]);
    }
    queue = null;
  });

  return function (msg) {
    if (queue) {
      queue.push(msg);
    } else {
      log(msg);
    }
  };
};

module.exports = makeLogger;
