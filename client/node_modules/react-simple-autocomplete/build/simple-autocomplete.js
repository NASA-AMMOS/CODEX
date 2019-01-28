(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react"));
	else if(typeof define === 'function' && define.amd)
		define(["react"], factory);
	else if(typeof exports === 'object')
		exports["SimpleAutocomplete"] = factory(require("react"));
	else
		root["SimpleAutocomplete"] = factory(root["React"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/static/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(1);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _react = __webpack_require__(2);

	var _react2 = _interopRequireDefault(_react);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Autocomplete = function (_Component) {
	  _inherits(Autocomplete, _Component);

	  function Autocomplete() {
	    var _Object$getPrototypeO;

	    var _temp, _this, _ret;

	    _classCallCheck(this, Autocomplete);

	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Autocomplete)).call.apply(_Object$getPrototypeO, [this].concat(args))), _this), _this.state = {
	      open: false,
	      highlighted: -1
	    }, _this.open = function () {
	      _this.setState({ open: true });
	    }, _this.close = function () {
	      _this.setState({ open: false });
	    }, _this.handleMouseLeave = function (_event) {
	      _this.setState({ highlighted: -1 });
	    }, _this.handleMouseEnter = function (index) {
	      return function (_event) {
	        _this.setState({ highlighted: index });
	      };
	    }, _this.handleMouseDown = function () {
	      _this._blur = false;
	    }, _this.handleSelectItem = function (item) {
	      return function (event) {
	        var onSelectItem = _this.props.onSelectItem;
	        var input = _this.refs.input;

	        /**
	         * If there is no onSelectItem, just update the value
	         */

	        var selectHandler = onSelectItem ? onSelectItem(item, event) : input.value = item;

	        /**
	         * After updating the value, we need to trigger an onChange event.
	         * Can also trigger by returning true in onSelectItem
	         */
	        if (selectHandler) {
	          var changeEvent = new Event('input', { bubbles: true });
	          input.dispatchEvent(changeEvent);
	        }

	        /**
	         * Close the menu and allow blur events
	         * to continue,
	         */
	        setTimeout(function () {
	          input.focus();
	          _this._blur = true;
	          _this.close();
	        });
	      };
	    }, _this.handleFocus = function (event) {
	      var onFocus = _this.props.onFocus;

	      _this.open();
	      onFocus && onFocus(event);
	    }, _this.handleBlur = function (event) {
	      var onBlur = _this.props.onBlur;

	      if (!_this._blur) return;

	      _this.close();
	      onBlur && onBlur(event);
	    }, _this.handleKeyDown = function (event) {
	      var highlighted = _this.state.highlighted;

	      _this.open();

	      switch (event.key) {
	        case 'ArrowDown':
	          event.preventDefault();
	          var next = Math.min(highlighted + 1, _this.items.length - 1);
	          _this.setState({ highlighted: next });
	          return;

	        case 'ArrowUp':
	          event.preventDefault();
	          var prev = Math.max(highlighted - 1, -1);
	          _this.setState({ highlighted: prev });
	          return;

	        case 'Enter':
	          event.preventDefault();
	          if (highlighted > -1) {
	            _this.handleSelectItem(_this.items[highlighted])(event);
	          }
	          return;

	        case 'Escape':
	          _this.close();
	          return;

	        default:
	          // TODO: Add debounce
	          setTimeout(function () {
	            return _this.forceUpdate();
	          });
	          return;
	      }
	    }, _temp), _possibleConstructorReturn(_this, _ret);
	  }

	  _createClass(Autocomplete, [{
	    key: 'componentWillMount',
	    value: function componentWillMount() {
	      this._blur = true;
	    }

	    // menu

	    // item

	    // item

	    // item

	    // children
	    // children

	    // children

	    // children

	  }, {
	    key: 'render',
	    value: function render() {
	      var _this2 = this;

	      var _props = this.props;
	      var children = _props.children;
	      var items = _props.items;
	      var filter = _props.filter;
	      var sort = _props.sort;
	      var Menu = _props.renderMenu;
	      var Item = _props.renderItem;

	      var props = _objectWithoutProperties(_props, ['children', 'items', 'filter', 'sort', 'renderMenu', 'renderItem']);

	      var renderedItems = this.items.map(function (item, index) {
	        var highlighted = _this2.state.highlighted === index;
	        return _react2.default.cloneElement(Item({ item: item, index: index, highlighted: highlighted }), {
	          onMouseEnter: _this2.handleMouseEnter(index),
	          onMouseDown: _this2.handleMouseDown,
	          onClick: _this2.handleSelectItem(item),
	          key: '' + index + item.substr(0, 3)
	        });
	      });

	      var renderedMenu = _react2.default.cloneElement(Menu({ items: renderedItems }), {
	        onMouseLeave: this.handleMouseLeave
	      });

	      return _react2.default.createElement(
	        'div',
	        props,
	        _react2.default.cloneElement(children, {
	          onKeyDown: this.handleKeyDown,
	          onFocus: this.handleFocus,
	          onBlur: this.handleBlur,
	          ref: 'input'
	        }),
	        this.state.open && renderedMenu
	      );
	    }
	  }, {
	    key: 'input',
	    get: function get() {
	      return this.refs.input;
	    }
	  }, {
	    key: 'items',
	    get: function get() {
	      var _props2 = this.props;
	      var items = _props2.items;
	      var filter = _props2.filter;
	      var sort = _props2.sort;
	      var limit = _props2.limit;

	      var _ref = this.refs.input || {};

	      var _ref$value = _ref.value;
	      var value = _ref$value === undefined ? '' : _ref$value;

	      return items.filter(function (item) {
	        return filter(item, value);
	      }).sort(sort).slice(0, limit);
	    }
	  }]);

	  return Autocomplete;
	}(_react.Component);

	Autocomplete.propTypes = {
	  items: _react.PropTypes.array,
	  filter: _react.PropTypes.func,
	  sort: _react.PropTypes.any,
	  limit: _react.PropTypes.number,
	  renderMenu: _react.PropTypes.func,
	  renderItem: _react.PropTypes.func,
	  onSelectItem: _react.PropTypes.func,
	  onFocus: _react.PropTypes.func,
	  onBlur: _react.PropTypes.func,
	  children: _react.PropTypes.element
	};
	Autocomplete.defaultProps = {
	  items: [],
	  filter: function filter(item, query) {
	    return item.toLowerCase().includes(query.toLowerCase());
	  },
	  sort: function sort() {},
	  renderMenu: function renderMenu(_ref2) {
	    var items = _ref2.items;
	    return _react2.default.createElement(
	      'ul',
	      null,
	      items
	    );
	  },
	  renderItem: function renderItem(_ref3) {
	    var item = _ref3.item;
	    var highlighted = _ref3.highlighted;
	    return highlighted ? _react2.default.createElement(
	      'em',
	      null,
	      _react2.default.createElement(
	        'li',
	        null,
	        item
	      )
	    ) : _react2.default.createElement(
	      'li',
	      null,
	      item
	    );
	  },
	  children: _react2.default.createElement('input', { type: 'text' })
	};
	exports.default = Autocomplete;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }
/******/ ])
});
;