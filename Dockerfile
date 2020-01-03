FROM node:12-stretch-slim

WORKDIR /bot

ADD . /bot

ENV CONFIG_FILE /bot/config.json

RUN npm install

CMD node ./index.js -configFile $CONFIG_FILE