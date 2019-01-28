'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scryByType = exports.findByType = exports.scryByTag = exports.findByTag = exports.render = exports.RTU = exports.expect = exports.assert = exports.sinonChai = exports.sinon = exports.chai = exports.React = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsTestUtils = require('react-addons-test-utils');

var _reactAddonsTestUtils2 = _interopRequireDefault(_reactAddonsTestUtils);

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _sinonChai = require('sinon-chai');

var _sinonChai2 = _interopRequireDefault(_sinonChai);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_chai2.default.use(_sinonChai2.default);
var assert = _chai2.default.assert;
var expect = _chai2.default.expect;
var render = _reactAddonsTestUtils2.default.renderIntoDocument;
var findByTag = _reactAddonsTestUtils2.default.findRenderedDOMComponentWithTag;
var scryByTag = _reactAddonsTestUtils2.default.scryRenderedDOMComponentsWithTag;
var findByType = _reactAddonsTestUtils2.default.findRenderedComponentWithType;
var scryByType = _reactAddonsTestUtils2.default.scryRenderedComponentsWithType;
exports.React = _react2.default;
exports.chai = _chai2.default;
exports.sinon = _sinon2.default;
exports.sinonChai = _sinonChai2.default;
exports.assert = assert;
exports.expect = expect;
exports.RTU = _reactAddonsTestUtils2.default;
exports.render = render;
exports.findByTag = findByTag;
exports.scryByTag = scryByTag;
exports.findByType = findByType;
exports.scryByType = scryByType;