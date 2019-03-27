FROM continuumio/miniconda3
COPY ./envs/codex-env.yml /tmp
RUN conda env create -f /tmp/codex-env.yml
ENV CODEX_ROOT /home/codex/server/
CMD /bin/bash -c ". activate codex && python /home/codex/server/codex.py"