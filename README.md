# CODEX

The COmplex Data EXplorer is a web-application that was developed to help scientists and operators at NASA JPL perform quick explorations of high-dimensional data-sets to find patterns or relationships in the data and prepare it for in-depth follow-on analysis.

## User Guide
The [user guide](docs/codex_user_guide/user_guide.md) is in the docs folder of this repo, in markdown format. It covers what to do once you get the web application up and running.

## Installing and Running CODEX
There are three options for installing and running CODEX:
- a local install using Docker containers
- a local install with npm and conda
- either of the above installations on a remote server so that someone else can manage it

These two main install options are covered below. 

Installation on a server is the same as for a local machine, with the additional step of opening up access to remote users and creating a DNS entry for ease-of-use. Remote-server installation is not covered here; it will be straightforward for someone who typically manages web servers.

### Running CODEX in Docker

A version of CODEX for development can be run in Docker for ease of setup. (You'll need to install [Docker](https://www.docker.com/]) on your system first.)

Note that CODEX requirest 4GB of RAM to run, the default Docker RAM allocation is smaller, so you will need to adjust this in the Docker container settings.  More information about how to do this can be found [here](https://forums.docker.com/t/how-to-increase-memory-size-that-is-available-for-a-docker-container/78483)

To start, run `docker-compose up` in the root directory of this repo. Docker will build two different images, one for the backend (using the `Dockerfile` in `server/`) and one with the web client (using the `Dockerfile` in `client/`). Note that the installation and build may take a while to complete.

The client will be available at http://localhost:8000. (port selection can be set in the `docker-compose.yaml` file.)

_Development note:_

The development build can be run by using the following command:
```
docker-compose -f docker-compose.dev.yml up
```


### Local Installation of CODEX

1. `git clone https://github.jpl.nasa.gov/jackal/CODEX.git`

1. Run `npm install` in `client/` directory. (you need [Node.js](https://nodejs.org/en/) installed)

1. Set a CODEX_ROOT environment variable to point into GIT/server/
e.g., in bash something like
`export CODEX_ROOT="/Users/myname/Documents/Projects/github/CODEX/server/"`

1. Ensure you have the codex conda enviornment set up on your machine. Follow instructions [here](https://github.jpl.nasa.gov/jackal/CODEX/tree/develop/server/envs/README.md) to do this for the first time.

1. Activate the conda environment, compile the client and start the server. run_codex.sh will run both the client and server in a single terminal. If you would like to start each individually, as reccomended for debugging, see the note below.

in `server/` run  
`conda env update -f envs/environment.yml`

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

