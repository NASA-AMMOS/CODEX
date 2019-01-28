#! /bin/bash

depgraph track $1 ../src/index.js --internal=true | ./parse_usage.py
