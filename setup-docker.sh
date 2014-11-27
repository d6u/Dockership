# Usage
#   bash setup-docker.sh <host domain> <passphrase>

# Install Lastest Docker

curl -sSL https://get.docker.com/ubuntu/ | sudo sh

# Generate SSL Key

cd
mkdir .docker
cd .docker

echo 01 > ca.srl
echo "CN: $1, pass: $2"

openssl genrsa -passout pass:$2 -des3 -out ca-key.pem 2048
openssl req -new -x509 -days 365 -subj "/C=US/CN=$1" -key ca-key.pem -out ca.pem -passin pass:$2

openssl genrsa -des3 -passout pass:$2 -out server-key.pem 2048
openssl req -subj "/CN=$1" -new -key server-key.pem -out server.csr -passin pass:$2

openssl x509 -req -days 365 -in server.csr -CA ca.pem -CAkey ca-key.pem -out server-cert.pem -passin pass:$2
openssl genrsa -des3 -passout pass:$2 -out key.pem 2048
openssl req -subj "/CN=client" -new -key key.pem -out client.csr -passin pass:$2

echo extendedKeyUsage = clientAuth > extfile.cnf
openssl x509 -req -days 365 -in client.csr -CA ca.pem -CAkey ca-key.pem -out cert.pem -extfile extfile.cnf -passin pass:$2
openssl rsa -in server-key.pem -out server-key.pem -passin pass:$2
openssl rsa -in key.pem -out key.pem -passin pass:$2

# Update Docker Config

sudo sed -ri 's|(DOCKER_OPTS).+|\1="--tlsverify --tlscacert='"$HOME"'/.docker/ca.pem --tlscert='"$HOME"'/.docker/server-cert.pem --tlskey='"$HOME"'/.docker/server-key.pem -H=0.0.0.0:2376 -H unix:///var/run/docker.sock"|' /etc/init/docker.conf

# Reload Config

sudo service docker restart
