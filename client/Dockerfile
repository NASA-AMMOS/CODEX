FROM node:16 AS builder

RUN mkdir -p /home/codex/client
WORKDIR /home/codex/client

RUN apt-get update
RUN apt-get install -y libxi-dev libgl-dev

# Install dependencies
COPY package.json /home/codex/client
RUN npm i

# Build frontend
COPY . /home/codex/client

RUN npm run build

FROM node:16-alpine
RUN mkdir -p /home/codex/client/dist
RUN mkdir /home/codex/client/scripts
WORKDIR /home/codex/client
COPY --from=builder /home/codex/client/dist/* /home/codex/client/dist
COPY scripts/* /home/codex/client/scripts
RUN npm i express
CMD node scripts/server.js

EXPOSE 3000
