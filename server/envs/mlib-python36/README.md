# mlib
A library of useful data manipulation, plotting, loading/saving, and other tools for "flatfile"-type time series data.


## Creating the conda environment
The subdirectory `envs` has yaml files for creating a conda environment for running mlib.

### Installing and Updating Anaconda
Instructions on installing Anaconda are here: https://docs.anaconda.com/anaconda/install/.  Make sure Anaconda's `bin` directory is on your path.

If Anaconda is already installed, but is not up to date, you can update it with the following command:
```bash
$ conda update anaconda
```

Assuming you have an up-to-date version of anaconda installed, you can install or update the environments with the commands below.

#### Initial Install
```bash
$ conda env create -f envs/mlib27-env.yml
```

#### Update
```bash
$ conda env update -f envs/mlib27-env.yml  # this is where the update magic happens
```

#### Activating an Environment
On `bash` systems, the following command should always activate an environment (assuming that the `anaconda/bin` directory is on your path):
```bash
$ source activate mlib27
```

However, the `conda` command can be used to activate environments as well.  This will work on both `bash` and `csh` systems, but requires a specific script to be sourced first (e.g. in your `.cshrc` or `.bashrc` file).  The script is located at `.../anaconda/etc/profile.d/`.  Use the script appropriate for your environment.  Then, the command to activate the environment is:
```bash
$ conda activate mlib27
```
