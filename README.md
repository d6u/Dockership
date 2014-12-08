[![Build Status](https://travis-ci.org/daiweilu/ssd.svg?branch=master)](https://travis-ci.org/daiweilu/ssd)

# Simple Server Deployment (Single Server of Dockers)

__SSD__ wants to automate the process of deploying simple hobby and test web apps, make it easier so you can focus on the fun part.

## Heads Up

**SSD uses [__Docker__](https://www.docker.com/) to deploy and build isolated environment on your server. Thus, some Docker knowledge is expected.**

Docker made it possible to run your apps in isolations on the same server. You don't have to worry about instaling different versions of softwares and dependencies.

SSD requires to setup Docker with HTTPS connections, it may sound hassle at the beginning. But I got a bash script to set it up for you. You do have to copy files from your remote machine to you computer though. However, I only have scripts for Ubuntu 14.04 for AWS. You are welcome to add more setup scripts here.

## Prepare Remote Server

First you have to install Docker on your server and make Docker accept HTTPS connection. I created a simple bash script to help you do this.

Copy `setup-docker.sh` in this repo to your remote machine. And run:

```bash
bash setup-docker.sh <you.host.name> <passphrase>
```

`you.host.name` is a public domain that associated with your server's IP. Unfortunately, generating certificate for HTTPS requires a domain name to do so (EC2 instance always come with a domain name). `passphrase` is a password you choose for your keys.

This script will first install Docker, generate ca certificate and keys in `$HOME/.docker` dir, then change the docker config to enable HTTPS connection. At the end restart Docker daemon.

You need to copy `ca.pem`, `cert.pem` and `key.pem` from `$HOME/.docker` to your local machine for SSD client to connect to docker. Once you have all the keys, you can test it using on your local machine (assuming you have docker installed on your local, OSX users refer to [boot2docker]( https://docs.docker.com/installation/mac/)):

```bash
docker --tlsverify --tlscacert=ca.pem --tlscert=cert.pem --tlskey=key.pem -H=<your.host.name>:2376 version
```

## Prepare Local Config

Local projects should follow a specific directory structure:

```
source/
    meta.json
    Dockerfile
    <...app files...>
stage/
    production/
        ssd.json
    <...more stages.../>
```

- `source` contains source code and the information to build and run the app.
- `stage` contains stages. You can consider each stage as a remote machine.
- `meta.json` contains information to build and run Docker container.
- `Dockerfile` used to build Docker image.
- `ssd.json` used to define connection information for a remote machine belongs to current stage.

## Usage

### Install

```bash
npm install -g ssd
```

### CLI

```
ssd <action> [-s stage-name]

    actions:
        status    Checkout the information of image and container
        up        Build the image and start container
        start     Start container
        stop      Stop container
        restart   Stop then start container
        exec      Execute a command inside the container
```

### API

You can also include ssd in your own build process.

```javascript
var ssd = require('ssd');

ssd.status('<stage name>').then(function (status) {
  // status.images
  // status.containers
});

ssd.up('<stage name>').then(function (eventEmitter) {
  eventEmitter.on('info', function (msg) {
    console.info(msg);
  });

  eventEmitter.on('error', function (err) {
    throw err;
  });

  eventEmitter.on('end', function () {
    process.exit(0);
  });
});
```

## TODO

- Provide scaffold
- Support multiple images and containers
- Support dependencies among containers
- Support logging progress information in CLI when pulling baseimages while building image
