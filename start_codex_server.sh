#!/bin/bash

eval "$(/root/miniconda3/bin/conda shell.bash hook)"
conda activate codex
python /home/codex/server/codex.py
