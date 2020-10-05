# CODEX

COmplex Data EXplorer

## Local Setup

1. `git clone https://github.jpl.nasa.gov/jackal/CODEX.git`

1. Run `npm install` in `client/` direcotry. (you need [Node.js](https://nodejs.org/en/) installed)

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

Note that CODEX requirest 4GB of RAM to run, the default Docker RAM allocation is smaller, so you will need to adjust this in the Docker container settings.  More information about how to do this can be found [here](https://forums.docker.com/t/how-to-increase-memory-size-that-is-available-for-a-docker-container/78483)

To start, run `docker-compose up` in the root directory of this repo. Docker will build two different images, one for the backend (using the `Dockerfile` in `server/`) and one with the web client (using the `Dockerfile` in `client/`). Note that the installation and build may take a while to complete.

The client will be available at http://localhost:3000. (port selection can be set in the `docker-compose.yaml` file.)

_Development note:_

The development build can be run by using the following command:
```
docker-compose -f docker-compose.dev.yml up
```
