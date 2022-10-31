FROM sitespeedio/node:ubuntu-20.04-nodejs-12.14.1

# Install NGINX
RUN apt-get update
RUN apt-get install -y nginx
RUN apt-get install -y curl
RUN apt-get install -y software-properties-common gcc
RUN apt-get update && apt-get install -y python3.6 python3-distutils python3-pip python3-apt

# Install miniconda
WORKDIR /tmp
RUN curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
RUN echo "78f39f9bae971ec1ae7969f0516017f2413f17796670f7040725dd83fcff5689 Miniconda3-latest-Linux-x86_64.sh" | sha256sum -c
RUN sh Miniconda3-latest-Linux-x86_64.sh -b

# Install server and dependencies
COPY ./server/envs/ /home/codex/server/envs/
RUN /root/miniconda3/bin/conda env create -f /home/codex/server/envs/docker_environment.yml
ENV CODEX_ROOT /home/codex/server/
COPY ./server /home/codex/server

# Copy server run files
COPY start_codex_server.sh /home/codex/server
RUN mkdir -p /etc/service/server
COPY server.runit /etc/service/server/run
RUN python3 -m pip install tornado numpy pebble zmq h5py sklearn psutil msgpack termcolor matplotlib fastdtw pandas pyaml

# Copy and set up NGINX proxy
RUN rm -rf /etc/nginx/sites-enabled/default
RUN mkdir -p /etc/service/nginx
COPY nginx.runit /etc/service/nginx/run
RUN mkdir -p /home/codex/client
COPY server.conf /home/codex

# Install Node
#RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
#RUN apt-get -yq install nodejs

# Install client dependencies
RUN apt-get update
RUN apt-get install -y pkg-config libxtst6
COPY client/package.json /home/codex/client/
COPY client/package-lock.json /home/codex/client/
WORKDIR /home/codex/client

# Build client
COPY client/ /home/codex/client/

WORKDIR /home/codex/client
RUN npm install -g node-gyp
RUN npm i
RUN npm i react@18 react-dom@18 @types/react@18 @types/react-dom@18
RUN npm run build

CMD [ "npm", "start" ]