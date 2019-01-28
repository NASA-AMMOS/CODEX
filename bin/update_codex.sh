DATE=$(date +%d-%m-%s-%Y)

mkdir -p /web/codex/html/OLD &&
mkdir /web/codex/html/OLD/$DATE &&
mkdir /web/codex/html/OLD/$DATE/GIT &&
mv /web/codex/html/GIT /web/codex/html/OLD/$DATE/GIT &&
git clone https://github-fn.jpl.nasa.gov/CODEX/CODEX /web/codex/html/GIT &&
cd /web/codex/html/GIT &&
npm install &&
npm run build &&
mkdir /web/codex/html/GIT/build/static/css/static &&
mv /web/codex/html/GIT/build/static/media /web/codex/html/GIT/build/static/css/static &&
mkdir /web/codex/html/OLD/$DATE/BUILD &&
mv /web/codex/html/*.{map,js,json,ico,png,html} /web/codex/html/OLD/$DATE/BUILD &&
mv /web/codex/html/static /web/codex/html/OLD/$DATE/BUILD &&
cp -r /web/codex/html/GIT/build/* /web/codex/html &&
export NODE_ENV=production &&
export CODEX_ROOT=/web/codex/html/GIT/src/server &&
echo "CODEX updated! Serving on https://codex.jpl.nasa.gov/" &&
echo "Run the back-end with /usr/local/anaconda3/bin/python /web/codex/html/GIT/src/server/codex.py -ssl"
