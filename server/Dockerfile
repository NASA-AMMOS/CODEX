FROM continuumio/miniconda3:latest

# Update package lists with retry logic and cleanup
RUN apt-get clean && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
        libgl1-mesa-glx \
        libegl1-mesa \
        libxrandr2 \
        libxss1 \
        libxcursor1 \
        libxcomposite1 \
        libasound2 \
        libxi6 \
        libxtst6 \
        build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up CODEX environment
RUN mkdir -p /home/codex/server/envs
COPY envs/ /home/codex/server/envs/
RUN conda env create -f /home/codex/server/envs/docker_environment.yml
ENV CODEX_ROOT /home/codex/server/
COPY . /home/codex/server

# Copy service script
RUN mkdir -p /etc/service/backend
COPY backend.runit /etc/service/backend/run
ENV PYTHONUNBUFFERED 1
EXPOSE 8888
WORKDIR /home/codex/server
CMD ["conda", "run", "--no-capture-output", "-n", "codex", "python", "-u", "/home/codex/server/codex.py"]