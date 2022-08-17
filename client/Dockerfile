FROM node:16

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
CMD node scripts/server.js

EXPOSE 3000
