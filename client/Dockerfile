FROM node:12
COPY . /home/codex/client
WORKDIR /home/codex/client
RUN npm install
RUN npm run build
CMD node scripts/server.js
