#!/bin/sh
mkdir 7DTD-Discord
cp config.json 7DTD-Discord
cp package.json 7DTD-Discord
cp index.js 7DTD-Discord
cp run.sh 7DTD-Discord
cp run_silent.sh 7DTD-Discord
cp README.md 7DTD-Discord
cp lib 7DTD-Discord/lib -r
tar -zcvf 7DTD-Discord.tar.gz 7DTD-Discord
