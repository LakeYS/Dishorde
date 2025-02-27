FROM node:gallium-bullseye-slim

WORKDIR /bot
RUN apt update && apt install -y jq
COPY . /bot
RUN npm install
CMD export $(env | grep SD_ | cut -d= -f1 | xargs); bash entrypoint.sh
