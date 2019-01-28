var path = require('path')
var express = require('express')
var webpack = require('webpack')
var config = require('./webpack.dev')

var app = express()
var compiler = webpack(config)

var HOST = process.env.HOST || '0.0.0.0'
var PORT = process.env.PORT || 3300

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}))

app.use(require('webpack-hot-middleware')(compiler))

app.use('/react-simple-autocomplete', express.static('./'))

app.get('/react-simple-autocomplete', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'dev.html'))
})

app.listen(PORT, HOST, function(err) {
  if (err) throw err

  console.log(`Listening at http://${HOST}:${PORT}`)
})
