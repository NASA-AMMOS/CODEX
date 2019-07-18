#! /bin/zsh

set -e
cd $CODEX_ROOT
for i (**/*.py) python "$i" 

