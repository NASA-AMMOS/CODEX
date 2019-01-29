# CODEX
COmplex Data EXplorer

## Local Setup

1. `git clone https://github.jpl.nasa.gov/jackal/CODEX.git`
1. Run `npm install` in this project's home directory. (you need [Node.js](https://nodejs.org/en/) installed)

1. Set a CODEX_ROOT environment variable to point into GIT/server/  
1. Install Python 3.6.3+ and [virtualenv](https://virtualenv.pypa.io/en/stable/), then run:
1. Ensure you have the codex conda enviornment set up on your machine.  Follow instructions [here](https://github.jpl.nasa.gov/jackal/CODEX/tree/development/server/envs/README.md) to do this for the first time.
1. Activate the conda enviornment, compile the client and start the server.  run_codex.sh will run both the client and server in a single terminal. If you would like to start each individually, as reccomended for debugging, see the note below.
'''
$ conda activate codex
$ GIT/bin/run_codex.sh
'''

Note:  To start the client and server in different terminal sessions, follow instructions below.
'''
Terminal 1:
cd GIT/client/
npm start

Terminal 2:
conda activate codex
cd $CODEX_ROOT
python codex.py
'''


## Volunteer Collaborators to Guide Interface Development
- Robert Hodyss
- Kiri Wagstaff
- Verma Rishi
- Jorge Pineda
- Julie Castillo-Rogez
- Rob Rosenberg

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
