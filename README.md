# CODEX
COmplex Data EXplorer

## Local Setup

1. `git clone https://github.jpl.nasa.gov/jackal/CODEX.git`
1. Run `npm install` in this project's home directory. (you need [Node.js](https://nodejs.org/en/) installed)

1. Set a CODEX_ROOT environment variable to point into codex/src/server/  
1. Install Python 3.6.3+ and [virtualenv](https://virtualenv.pypa.io/en/stable/), then run:

```
$ virtualenv env_codex -p python3
$ source env_codex/bin/activate
$ pip install -r requirements.txt
```

_Note that this installs Matplotlib using PyQT5 as the [backend](https://matplotlib.org/tutorials/introductory/usage.html#what-is-a-backend), so that it can run in a virtualenv. If you want to override this, you can either edit `src/server/matplotlibrc` or add a system level `matplotlibrc` according to [this page](https://matplotlib.org/tutorials/introductory/customizing.html#the-matplotlibrc-file)._

1. Run `run_codex.sh` in the project's home directory

*Note:* `run3_codex.sh` just uses `python3` instead of `python`

## Volunteer Collaborators to Guide Interface Development
- Robert Hodyss
- Kiri Wagstaff
- Verma Rishi
- Jorge Pineda
- Julie Castillo-Rogez
- Rob Rosenberg

## Facts about OCO-2 data files

* L2/RetrievalHeader/sounding_id is the key unique index for all observations (just time in YYYYMMDDHHMMSSFF)
* Last number of sounding_id is not actually 0.01 seconds, but the "footprint number" 1-8
* L2/RetrievalResults/xco2 is the main target-of-interest, the retrieved estimate of CO2 in the atmosphere
* Latitude & Longitude are also provided in the file, though the data is 1D (lat & lon are functions of time only)


# Lukas’s Rules for the Research Road
All problems and criticisms should be accompanied by a proposed solution.

The cleaner your graph, the more you’ve said; turn off everything you don’t critically need. 

Share insights, progress, problem solutions, and clever ideas frequently in email.

Don’t expect others to use (Slack, IM, phone calls). Email is the lingua franca.

Regular check-in meetings are vital as long as kept succinct; be succinct.	

Make sure you’re talking with team members directly, not just the PI.

Label your axes meaningfully, with units, every time.

If the details don’t matter, don’t go into them.

If the details do matter, go into only the ones that do.

New ideas are to be first explored without criticism, then see the First Rule.

If you feel lost, frustrated, disengaged, discouraged, or disliked… tell me immediately.

Have/share an opinion on everything the team’s doing; your voice is needed.

Don’t be afraid of anything new; give them a sincere try first.

Treat every team member as a person you’re trying to impress.

Be honest with your time estimates and availability.

Offer help whenever you realize you actually can.

We’re developing in Python 3.x. Period.

Keep scope small, achieve the goal, then go beyond.

Challenge yourself to grow: learn better coding, explore new tools.

If you do something twice, make it a proper script. You’ll do it again.

If a function is used in two programs, it needs to be a library. Today.

If you’re swamped and can’t complete something, tell the team right away.

Write your code for other people to use; you’ll need it just as much down the road.

Utilize unit tests and good comments even in research code; it speeds you up in the end.

Make regular slides to document progress, organize your thoughts, and communicate clearly.

If you’re stuck, try to solve it yourself. If you’re still stuck after ~30 minutes, ask for help.

If you disagree with any of these rules, see the First Rule.
