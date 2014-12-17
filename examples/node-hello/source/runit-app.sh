#!/bin/bash

cd /root/app
exec npm start >>/var/log/app.log 2>> /var/log/app-err.log
