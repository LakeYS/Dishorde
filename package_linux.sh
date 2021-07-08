#!/bin/sh
mkdir Dishorde
cp config.json Dishorde
cp package.json Dishorde
cp index.js Dishorde
cp run.sh Dishorde
cp run_silent.sh Dishorde
cp README.md Dishorde
cp lib Dishorde/lib -r
tar -zcvf Dishorde.tar.gz Dishorde
