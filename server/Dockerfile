FROM continuumio/miniconda3
COPY ./envs/environment.yml /tmp
RUN conda env create -f /tmp/environment.yml
ENV CODEX_ROOT /home/codex/server/
CMD /bin/bash -c ". activate codex && python /home/codex/server/codex.py"