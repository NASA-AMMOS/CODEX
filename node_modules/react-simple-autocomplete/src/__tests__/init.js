import jsdom from 'node-jsdom'
import 'babel-polyfill'

// setup the simplest document possible
const document = jsdom.jsdom('<!doctype html><html><body></body></html>')

// get the window object out of the document
const window = document.defaultView

// set globals for mocha that make access to document and window feel
// natural in the test environment
global.document = document
global.window = window

// take all properties of the window object and also attach it to the
// mocha global object
propagateToGlobal(window)

// from mocha-jsdom https://github.com/rstacruz/mocha-jsdom/blob/master/index.js#L80
function propagateToGlobal (window) {
  for (let key in window) {
    if (!window.hasOwnProperty(key)) continue
    if (key in global) continue

    global[key] = window[key]
  }
}
