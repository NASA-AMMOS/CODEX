FROM node:16 AS builder

RUN mkdir -p /home/codex/client
WORKDIR /home/codex/client

# Update package lists with proper cleanup
RUN apt-get clean && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
        libxi-dev \
        libgl-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json /home/codex/client
RUN npm i

# Build frontend
COPY . /home/codex/client

RUN npm run build

FROM node:16-alpine
WORKDIR /home/codex/client

COPY --from=builder /home/codex/client/dist /home/codex/client/dist
COPY scripts /home/codex/client/scripts
RUN npm i express
CMD node scripts/server.js

EXPOSE 3000
