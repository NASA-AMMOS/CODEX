FROM phusion/baseimage:bionic-1.0.0

# Install NGINX
RUN apt-get update
RUN apt-get install -y nginx 

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

# Copy and set up NGINX proxy
RUN rm -rf /etc/nginx/sites-enabled/default
RUN mkdir -p /etc/service/nginx
COPY nginx.runit /etc/service/nginx/run
RUN mkdir -p /home/codex/client
COPY server.conf /home/codex

# Install Node
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get -yq install nodejs

# Install client dependencies
RUN apt-get update
RUN apt-get install -y pkg-config libxtst6
COPY client/package.json /home/codex/client/
WORKDIR /home/codex/client
RUN npm i

# Build client
COPY client/ /home/codex/client/

WORKDIR /home/codex/client
RUN npm run build
