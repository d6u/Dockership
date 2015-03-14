# Dockership

Scriptable docker management tool build upon Docker remote API.

## Usage

### 1. Get Start

```javascript
var Dockership = require('dockership');

var dockerConfig = {
  ca:   'path/to/ca', // Can also be a Buffer of ca.pem
  cert: 'path/to/cert',
  key:  'path/to/key',
  host: '0.0.0.0',
  port: 2376
};

var ship = new Dockership({
  docker: dockerConfig, // Config obj used to construct docker remote client
  buildContext: 'path/to/dockerfile/parent/dir', // Absolute, or relative to cwd
  meta: metaConfig // Information describing docker images and how to run containers
});
```

### 2. API

**Dockership** use [dockerode](https://github.com/apocas/dockerode) and [bluebird](https://github.com/petkaantonov/bluebird) internally. All API calls will return a bluebird promise.

#### `images` method

Resolve with remote images specified by `metaConfig`.

```javascript
ship.images().then(function (images) {
  console.log(images); // JSON
});
```

#### `containers` method

```javascript
ship.containers().then(function (containers) {
  console.log(containers); // JSON
});
```

#### `build` method

```javascript
ship.build().then(function (image) {
  console.log(image); // JSON
});
```

`ship` instance is an EventEmitter instance. You can listen to events emitted during build process.

```javascript
ship.on('buildMessage', function (obj) {
  // Log something
});
```

Dockership comes with logger helper to help log `buildMessage` to console.

```javascript
var logger = Dockership.makeLogger();
ship.on('buildMessage', logger);
```

`logger` can be customized by passing a modifier function:

```javascript
var logger = Dockership.makeLogger(function (str) {
  return 'Prefix ' + str;
});

ship.on('buildMessage', logger); // Prepend "Prefix " to every line of message
```

#### `start` method

```javascript
ship.start().then(function (container) {
  console.log(container); // JSON
});
```

By default, `start` will start stopped container or create container from image specified in `metaConfig`. If such container or image cannot be found, `start` will reject.

#### `stop` method

Stop will stop all containers match the description in `metaConfig`.

```javascript
ship.stop().then(function (containers) {
  console.log(containers); // JSON
});
```

#### `exec` method

Execute command inside container. Reject if running container cannot be found.

```javascript
ship.exec().then(function () {
  // No argument
});
```

#### `this` context

All promise callback have `this` refer to current `ship` instance.

```javascript
ship
  .build()
  .then(function (image) {
    return this.start();
  })
  .then(function (container) {

  });
```

## TODO

- Improve event emitting, especially error emitting.
