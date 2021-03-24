FROM phusion/baseimage:bionic-1.0.0

RUN apt-get update

# Install Conda
RUN apt-get install -y libgl1-mesa-glx libegl1-mesa libxrandr2 libxrandr2 libxss1 libxcursor1 libxcomposite1 libasound2 libxi6 libxtst6
WORKDIR /tmp
RUN curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
RUN echo "879457af6a0bf5b34b48c12de31d4df0ee2f06a8e68768e5758c3293b2daf688 Miniconda3-latest-Linux-x86_64.sh" | sha256sum --check
RUN sh Miniconda3-latest-Linux-x86_64.sh -b -p /usr/local/miniconda

# Set up CODEX environment
RUN mkdir -p /home/codex/server/envs
COPY envs/ /home/codex/server/envs/
RUN /usr/local/miniconda/bin/conda env create -f /home/codex/server/envs/docker_environment.yml
ENV CODEX_ROOT /home/codex/server/
COPY . /home/codex/server

# Copy service script
RUN mkdir -p /etc/service/backend
COPY backend.runit /etc/service/backend/run

EXPOSE 8888