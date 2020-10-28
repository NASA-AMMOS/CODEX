FROM continuumio/miniconda3
COPY ./envs/ /home/codex/server/envs/
RUN conda env create -f /home/codex/server/envs/docker_environment.yml
ENV CODEX_ROOT /home/codex/server/
COPY . /home/codex/server
CMD /bin/bash -c ". activate codex && python /home/codex/server/codex.py"