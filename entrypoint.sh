#!/bin/bash

if [[ ! -z $SD_IP ]]; then
  jq --arg IP $SD_IP  -r '.ip |= $IP' /bot/config.json > /bot/config_tmp.json
  mv /bot/config_tmp.json /bot/config.json
fi

if [[ ! -z $SD_PASSWORD ]]; then
  jq --arg PASSWORD $SD_PASSWORD  -r '.password |= $PASSWORD' /bot/config.json > /bot/config_tmp.json
  mv /bot/config_tmp.json /bot/config.json
fi

if [[ ! -z $SD_TOKEN ]]; then
  jq --arg TOKEN $SD_TOKEN  -r '.token |= $TOKEN' /bot/config.json > /bot/config_tmp.json
  mv /bot/config_tmp.json /bot/config.json
fi

if [[ ! -z $SD_CHANNEL ]]; then
  jq --arg CHANNEL $SD_CHANNEL  -r '.channel |= $CHANNEL' /bot/config.json > /bot/config_tmp.json
  mv /bot/config_tmp.json /bot/config.json
fi

if [[ ! -z $SD_PORT ]]; then
  jq --arg PORT $SD_PORT  -r '.port |= $PORT' /bot/config.json > /bot/config_tmp.json
  mv /bot/config_tmp.json /bot/config.json
fi

# Auto restart
until node index.js; do
  echo "Application closed with exit code $?. Restarting in 5s, press Ctrl+C to cancel." >&2
  sleep 5
done
