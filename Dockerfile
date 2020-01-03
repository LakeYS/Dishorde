FROM node:12-stretch-slim

WORKDIR /bot

ADD . /bot

RUN mkdir /data
RUN npm install

# /data/config comes from a file mount, replacing the default blank one in the container
CMD cp /data/config.json /bot/config.json && node ./index.js