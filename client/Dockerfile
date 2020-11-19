FROM node:14

RUN mkdir -p /home/codex/client
WORKDIR /home/codex/client

# Install dependencies
COPY package.json /home/codex/client
RUN npm i

# Build frontend
COPY . /home/codex/client
RUN npm run build
CMD node scripts/server.js

EXPOSE 3000
