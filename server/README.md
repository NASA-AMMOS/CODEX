# CODEX
COmplex Data EXplorer

## CODEX Development Server

CODEX can be found on the JPL network at https://codex.jpl.nasa.gov

The web server for this site can be found on the machine analysis@jpl.nasa.gov under /web/codex/html/

Permissions for modifying this directory are controlled by a deployment account.  To access this account, follow these instructions:

```
$ ssh jackal@analysis
$ <enter LDAP credentials>
$ ssh deploy@analysis
```

The preceeding commands will place you in the deployer account on analysis.  

bin/update_codex.sh is intended to update the internals of /web/codex/html.  The script checks out the newest repo version, moves a copy of the previous build into OLD, rebuilds the static HTML and provides instructions for running the development server.  This script likely needs significant modifications and path updates after the github re-org.


Note: Run the following commands before doing the required 'conda activate codex' to set up conda on analysis.
```bash
$ export PATH=/usr/local/anaconda3/bin:$PATH
$ source /usr/local/anaconda3/etc/profile.d/conda.sh
```
