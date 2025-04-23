# 22-alpine
FROM docker.io/node@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944 as build

WORKDIR /app
COPY package.json .
COPY package-lock.json .

RUN npm install

# 22-alpine
FROM docker.io/node@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944

WORKDIR /app
COPY . .
COPY --from=build /app/node_modules ./node_modules

CMD ["node", "index.js"]