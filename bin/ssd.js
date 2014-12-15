#!/usr/bin/env node

var Promise   = require('bluebird');
var argv      = require('minimist')(process.argv.slice(2));

var Server    = require('../index');
var getLogger = require('../lib/util/get-logger');

var info  = getLogger('info');
var error = getLogger('error');

argv['s'] = argv['s'] || 'testing';

var server = new Server(argv['s']);

switch (argv['_'][0]) {
  case 'status':
    server.status().then(function () {
      getLogger('Images')(JSON.stringify(server.images, null, 2));
      getLogger('Containers')(JSON.stringify(server.containers, null, 2));
    })
    .catch(function (err) {
      error(err.stack);
      process.exit(1);
    });
    break;
  case 'up':
    server.up().then(function (emitter) {
      emitter.on('info', info);

      emitter.on('error', function (err) {
        error(err.stack);
        throw err;
      });

      emitter.on('end', function () {
        process.exit(0);
      });
    });
    break;
  case 'start':
    server.start().then(function () {
      info('Started');
    });
    break;
  case 'stop':
    server.stop().then(function () {
      info('Stopped');
    });
    break;
  case 'restart':
    server.stop()
      .then(function () {
        info('Stopped');
        return server.start();
      })
      .then(function () {
        info('Started');
      });
    break;
  case 'exec':
    var cmds = argv['_'].slice(1);
    if (cmds.length) {
      server.exec(cmds)
        .then(function (response) {
          response.setEncoding('utf8');
          response.pipe(process.stdout);
        })
        .catch(function (err) {
          error(err.stack);
          process.exit(0);
        });
    }
  default:
}
