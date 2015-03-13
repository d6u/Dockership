# Dockership

Scriptable docker management tool build upon Docker remote API.

## Usage

### 1. Get Start

```javascript
var Dockership = require('dockership');

var ship = new Dockership({
  docker: dockerConfig, // Config obj used to construct docker remote client
  buildContext: 'path/to/dockerfile/parent/dir', // Absolute, or relative to cwd
  meta: metaConfig // Infor describing docker images and how to run containers
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
ship
  .on('info', function (msg) {
    // JSON
  })
  .on('progress', function (msg) {

  })
  .on('error', function (msg) {

  })
  .on('end', function () {
    // No message
  })
  .on('UncaughtResponse', function (msg) {

  });
```

#### `start` method

```javascript
ship.start().then(function (container) {
  console.log(container); // JSON
});
```

By default, `start` will start with image or stop container specified in `metaConfig`. If such image or stop container cannot be found, `start` will reject.

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

- Support multiple images and containers
- Support dependencies/link among containers
- Improve event emitting
