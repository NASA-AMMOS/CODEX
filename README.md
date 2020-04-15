# CODEX

COmplex Data EXplorer

## Local Setup

1. `git clone https://github.jpl.nasa.gov/jackal/CODEX.git`

1. Run `npm install` in this project's home directory. (you need [Node.js](https://nodejs.org/en/) installed)

1. Set a CODEX_ROOT environment variable to point into GIT/server/

1. Ensure you have the codex conda enviornment set up on your machine. Follow instructions [here](https://github.jpl.nasa.gov/jackal/CODEX/tree/development/server/envs/README.md) to do this for the first time.

1. Activate the conda enviornment, compile the client and start the server. run_codex.sh will run both the client and server in a single terminal. If you would like to start each individually, as reccomended for debugging, see the note below.

```
$ conda activate codex
$ GIT/bin/run_codex.sh
```

Note: To start the client and server in different terminal sessions, follow instructions below.

```
Terminal 1:
$ cd GIT/client/
$ npm start

Terminal 2:
$ conda activate codex
$ cd $CODEX_ROOT
$ python codex.py
```

## Running CODEX in Docker

A version of CODEX for development can be run in Docker for ease of setup. (You'll need to install [Docker](https://www.docker.com/]) on your system first.)

To start, run `docker-compose up` in the root directory of this repo. Docker will build two different images, one for the backend (using the `Dockerfile` in `server/`) and one with the web client (using the `Dockerfile` in `client/`). Note that the installation and build may take a while to complete.

The client will be available at http://localhost:3000. (port selection can be set in the `docker-compose.yaml` file.)

_Development note:_

For most code changes (i.e., development or pulling the latest branch), the client will automatically rebuild. However, it may be necessary to re-run `docker-compose up` if the server code or client dependencies have changed.

If server code dependencies have changed, run `docker-compose up --build` to force Docker to rebuild the server container with those new dependencies.
