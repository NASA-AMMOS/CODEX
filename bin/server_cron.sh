#!/bin/bash
for pid in $(pidof -x server_cron.sh); do
    if [ $pid != $$ ]; then
        exit 1
    fi 
done
./server_run.sh
