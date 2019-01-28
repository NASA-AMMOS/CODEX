#! /bin/bash

depgraph graph ../src/index.js -o - 2> /dev/null | tee ../../../web/depgraph/output.json | ./parse_depgraph.py
