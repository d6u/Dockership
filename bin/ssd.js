#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));

if (argv['h']) {
  [
    "ssd [-s stage-name] <action> [action options]",
    "",
    "    -s testing",
    "",
    "    actions:",
    "        init                Scaffold current project",
    "        status              Checkout the information of image and container",
    "        up  [-c false]      Build the image and start container",
    "                                with `-c` flag, we will build using cache",
    "        start               Start container",
    "        stop                Stop container",
    "        restart             Stop then start container",
    "        exec [commands...]  Execute a command inside the container"
  ].forEach(function (line) {
    console.log(line);
  });
  process.exit(0);
}

var path = require('path');
var Promise = require('bluebird');
var Server = require('../index');
var fs = require('../lib/fs-promisified');
var getLogger = require('../lib/util/get-logger');
var info = getLogger.info;
var error = getLogger.error;

argv['s'] = argv['s'] || 'testing';

var server = new Server(argv['s']);

/**
 * @param  {String} dirPath - relative path without starting "./"
 * @return {Promise}
 */
function mkdir(dirPath) {
  info('Making directory "' + dirPath + '"');
  return fs.mkdirAsync(path.resolve('./' + dirPath));
}

function cpFile(fromPath, toPath) {
  info('Making template file "' + toPath.replace('./', '') + '"');
  return new Promise(function (resolve, reject) {
    var rs = fs.createReadStream(fromPath);
    var ws = fs.createWriteStream(toPath);
    rs.pipe(ws).on('finish', resolve).on('error', reject);
  });
}

switch (argv['_'][0]) {
  case 'init':
    mkdir('source')
      .then(function () { return mkdir('stage'); })
      .then(function () { return mkdir('stage/test'); })
      .then(function () { return mkdir('stage/production'); })
      .then(function () { return cpFile(path.join(__dirname, '..', 'scaffold', 'meta.json'), './source/meta.json'); })
      .then(function () { return cpFile(path.join(__dirname, '..', 'scaffold', 'ssd.json'), './stage/test/ssd.json'); })
      .then(function () { return cpFile(path.join(__dirname, '..', 'scaffold', 'ssd.json'), './stage/production/ssd.json'); })
      .error(function (err) {
        if (err.cause.errno === 47) {
          error('"' + err.cause.path + '" already exists');
        } else {
          error(err.cause);
        }
        process.exit(1);
      });
    break;
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
    server.up({cache: argv['c']})
      .then(function (emitter) {
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
      server.exec(cmds.map(String))
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
