FROM continuumio/miniconda3

RUN apt-get update

# Set up CODEX environment
RUN apt-get install -y libgl1-mesa-glx libegl1-mesa libxrandr2 libxrandr2 libxss1 libxcursor1 libxcomposite1 libasound2 libxi6 libxtst6 build-essential
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