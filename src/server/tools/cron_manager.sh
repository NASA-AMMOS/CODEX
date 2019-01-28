#!/bin/bash
###############################################################
# Author: Jack Lightholder                                    #
#                                                             #
# Breif : Used with cron, checks if already running,          #
#			else starts program                               #
#                                                             #
# Date: 3/3/2018                                              #
#                                                             #
# Notes:                                                      #
#      Adapted from https://stackoverflow.com/questions/      #
#		2366693/run-cron-job-only-if-it-isnt-already-running  #
#                                                             #
# Inputs:                                                     #
#    $1 - Full path to /src/server/.  Becomes CODEX_ROOT      #
#                                                             #
###############################################################
mkdir -p "$1/tmp"
PIDFILE="$1/tmp/myprogram.pid"

if [ -e "${PIDFILE}" ] && (ps -u $(whoami) -opid= |
                           grep -P "^\s*$(cat ${PIDFILE})$" &> /dev/null); then
  echo "Already running."
  exit 99
fi

export CODEX_ROOT=$1
cd $1 && npm start
python $1/codex.py

echo $! > "${PIDFILE}"
chmod 644 "${PIDFILE}"
