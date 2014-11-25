# Simple Server Deployment (Single Server of Dockers)

__SSD__ wants to make deploying simple hobby and test web apps on a single remote machine easy and automated.

It uses [__Docker__](https://www.docker.com/) to build and run your app on server in isolation, so you don't have to worry about putting more than one app in a single machine with different software versions and dependencies.

## Heads Up

**SSD uses Docker to deploy and build isolated environment on your server. Thus, some Docker knowledge is expected.**

SSD also requires to setup Docker with HTTPS connections, there may be some hassle. You do have to copy files and run shell scripts on your remote machine, and I only have scripts for Ubuntu 14.04 for AWS. You are welcome to contribute more setup scripts here.

## Prepare Remote Server

In order to use this tool, first you have to install Docker on your server and make Docker accept HTTPS connection. I created a simple bash script to help you do this.

Copy `setup-docker.sh` in this repo to your remote machine. And run `bash setup-docker.sh <you.host.name> <passphrase>`. `you.host.name` is a public domain that point to your server's IP. Unfortunately, generating certificate for HTTPS requires a domain name to do so (EC2 always come with a domain name). Passphrase is simple a password you choose for your keys.

This script will first install Docker, generate ca certificate and keys in `~/.docker` dir, then change the docker config to enable HTTPS connection. At last restart Docker daemon.

You need to copy `ca.pem`, `cert.pem` and `key.pem` to your local machine for SSD client to connect to docker. Once you have all the keys, you can test it using on your local machine (assuming you have docker installed on your local):

```shell
docker --tlsverify --tlscacert=ca.pem --tlscert=cert.pem --tlskey=key.pem -H=<your host name>:2376 version
```

## Prepare Local Config

Local projects should follow a specific directory structure:

```
source/
    meta.json
    Dockerfile
    <...app files...>
stage/
    development/
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

```shell
npm install -g ssd
```

### CLI

```
ssd <action> [-s stage-name]

    actions:
        status    Checkout the status of image and container
        up        Build the image and start container
        start     Start container
        stop      Stop container
        restart   Stop then start container
        dispatch  Execute a command inside the container
```

## TODO

- Support multiple images and containers
- Support logging progress information when building images
- Provide scaffold
