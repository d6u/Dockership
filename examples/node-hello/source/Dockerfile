FROM phusion/baseimage:0.9.15

ENV HOME /root

RUN /etc/my_init.d/00_regen_ssh_host_keys.sh

CMD ["/sbin/my_init"]

ENV DEBIAN_FRONTEND noninteractive

# ------------------------------
# Install Node.js and npm
#
RUN curl -sL https://deb.nodesource.com/setup | sudo bash -
RUN apt-get install -y nodejs

# ------------------------------
# Config Services

# Add runit service for Node.js app and MongoDB
RUN mkdir /etc/service/node-app
COPY runit-app.sh /etc/service/node-app/run
RUN chmod +x /etc/service/node-app/run

# ------------------------------
# Copy Project Files
RUN mkdir -p /root/app
COPY app.js /root/app/
COPY package.json /root/app/

WORKDIR /root/app
RUN npm install

# ------------------------------
# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
