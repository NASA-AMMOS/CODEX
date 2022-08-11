FROM node:14

RUN mkdir -p /home/codex/client
WORKDIR /home/codex/client

RUN apt-get update
RUN apt-get install -y libxi-dev libgl-dev

# Install dependencies
COPY package.json /home/codex/client
RUN npm install -g node-gyp
RUN npm i

# Build frontend
COPY . /home/codex/client

# package-lock.json that is generated from 'npm i' wont't work, so we have to overwrite it with 
# the one located at the root of the repo
COPY ./package-lock.json /home/codex/client/package-lock.json
RUN npm run build
CMD node scripts/server.js

EXPOSE 3000
