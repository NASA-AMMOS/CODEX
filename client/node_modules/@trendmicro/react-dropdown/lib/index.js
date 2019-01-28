/*! react-dropdown v1.3.0 | (c) 2018 Trend Micro Inc. | MIT | https://github.com/trendmicro-frontend/react-dropdown */
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 16);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("prop-types");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("react");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("classnames");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin
module.exports = {"dropdown":"dropdown---dropdown---1yvIZ","dropdown-toggle":"dropdown---dropdown-toggle---vMtjL","dropdownToggle":"dropdown---dropdown-toggle---vMtjL","caret":"dropdown---caret---3CkEt","dropup":"dropdown---dropup---30DnN","btn-link":"dropdown---btn-link---1xwS4","btnLink":"dropdown---btn-link---1xwS4","empty":"dropdown---empty---zMmdA","dropdown-menu":"dropdown---dropdown-menu---1fkH0","dropdownMenu":"dropdown---dropdown-menu---1fkH0","pull-right":"dropdown---pull-right---2juGH","pullRight":"dropdown---pull-right---2juGH","header":"dropdown---header---3pfXo","divider":"dropdown---divider---13uxG","menu-item-wrapper":"dropdown---menu-item-wrapper---3uAM0","menuItemWrapper":"dropdown---menu-item-wrapper---3uAM0","menu-item":"dropdown---menu-item---1LjoL","menuItem":"dropdown---menu-item---1LjoL","dropdown-submenu":"dropdown---dropdown-submenu---11C1M","dropdownSubmenu":"dropdown---dropdown-submenu---11C1M","disabled":"dropdown---disabled---eCY9b","selected":"dropdown---selected---1EK3y","active":"dropdown---active---2-a32","open":"dropdown---open---1ju75","dropdown-menu-wrapper":"dropdown---dropdown-menu-wrapper---3gX-X","dropdownMenuWrapper":"dropdown---dropdown-menu-wrapper---3gX-X","pull-left":"dropdown---pull-left---176QY","pullLeft":"dropdown---pull-left---176QY"};

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("chained-function");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp2;

var _chainedFunction = __webpack_require__(4);

var _chainedFunction2 = _interopRequireDefault(_chainedFunction);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _propTypes = __webpack_require__(0);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

var _MenuItem = __webpack_require__(14);

var _MenuItem2 = _interopRequireDefault(_MenuItem);

var _RootCloseWrapper = __webpack_require__(15);

var _RootCloseWrapper2 = _interopRequireDefault(_RootCloseWrapper);

var _matchComponent = __webpack_require__(6);

var _matchComponent2 = _interopRequireDefault(_matchComponent);

var _index = __webpack_require__(3);

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DropdownMenu = (_temp2 = _class = function (_PureComponent) {
    _inherits(DropdownMenu, _PureComponent);

    function DropdownMenu() {
        var _temp, _this, _ret;

        _classCallCheck(this, DropdownMenu);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _PureComponent.call.apply(_PureComponent, [this].concat(args))), _this), _this.isMenuItem = (0, _matchComponent2.default)(_MenuItem2.default), _this.handleKeyDown = function (event) {
            if (event.keyCode === 40) {
                // Down
                _this.focusNext();
                event.preventDefault();
                return;
            }

            if (event.keyCode === 38) {
                // up
                _this.focusPrevious();
                event.preventDefault();
                return;
            }

            if (event.keyCode === 27 || event.keyCode === 9) {
                // esc or tab
                _this.props.onClose(event);
                return;
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    DropdownMenu.prototype.getItemsAndActiveIndex = function getItemsAndActiveIndex() {
        var items = this.getFocusableMenuItems();
        var activeIndex = items.indexOf(document.activeElement);

        return { items: items, activeIndex: activeIndex };
    };

    DropdownMenu.prototype.getFocusableMenuItems = function getFocusableMenuItems() {
        var node = _reactDom2.default.findDOMNode(this);
        if (!node) {
            return [];
        }

        return Array.from(node.querySelectorAll('[tabIndex="-1"]:not([disabled])'));
    };

    DropdownMenu.prototype.focusNext = function focusNext() {
        var _getItemsAndActiveInd = this.getItemsAndActiveIndex(),
            items = _getItemsAndActiveInd.items,
            activeIndex = _getItemsAndActiveInd.activeIndex;

        if (items.length === 0) {
            return;
        }

        var nextIndex = activeIndex >= items.length - 1 ? 0 : activeIndex + 1;
        items[nextIndex].focus();
    };

    DropdownMenu.prototype.focusPrevious = function focusPrevious() {
        var _getItemsAndActiveInd2 = this.getItemsAndActiveIndex(),
            items = _getItemsAndActiveInd2.items,
            activeIndex = _getItemsAndActiveInd2.activeIndex;

        if (items.length === 0) {
            return;
        }

        var prevIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
        items[prevIndex].focus();
    };

    DropdownMenu.prototype.render = function render() {
        var _this2 = this,
            _cx;

        var _props = this.props,
            componentType = _props.componentType,
            Component = _props.componentClass,
            open = _props.open,
            pullRight = _props.pullRight,
            onClose = _props.onClose,
            onSelect = _props.onSelect,
            rootCloseEvent = _props.rootCloseEvent,
            className = _props.className,
            _props$style = _props.style,
            style = _props$style === undefined ? {} : _props$style,
            children = _props.children,
            props = _objectWithoutProperties(_props, ['componentType', 'componentClass', 'open', 'pullRight', 'onClose', 'onSelect', 'rootCloseEvent', 'className', 'style', 'children']);

        var activeMenuItems = _react2.default.Children.toArray(children).filter(function (child) {
            return _react2.default.isValidElement(child) && _this2.isMenuItem(child) && child.props.active;
        });

        return _react2.default.createElement(
            _RootCloseWrapper2.default,
            {
                disabled: !open,
                onRootClose: onClose,
                event: rootCloseEvent
            },
            _react2.default.createElement(
                Component,
                _extends({}, props, {
                    role: 'menu',
                    className: (0, _classnames2.default)(className, (_cx = {}, _cx[_index2.default.dropdownMenu] = true, _cx[_index2.default.selected] = activeMenuItems.length > 0, _cx[_index2.default.pullRight] = !!pullRight, _cx)),
                    style: style
                }),
                _react2.default.Children.map(children, function (child) {
                    if (_react2.default.isValidElement(child) && _this2.isMenuItem(child)) {
                        return (0, _react.cloneElement)(child, {
                            onKeyDown: (0, _chainedFunction2.default)(child.props.onKeyDown, _this2.handleKeyDown),
                            onSelect: (0, _chainedFunction2.default)(child.props.onSelect, onSelect)
                        });
                    }

                    return child;
                })
            )
        );
    };

    return DropdownMenu;
}(_react.PureComponent), _class.propTypes = {
    componentType: _propTypes2.default.any,

    // A custom element for this component.
    componentClass: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.func]),

    // Dropdown
    open: _propTypes2.default.bool,
    pullRight: _propTypes2.default.bool,
    onClose: _propTypes2.default.func,
    onSelect: _propTypes2.default.func,
    rootCloseEvent: _propTypes2.default.oneOf(['click', 'mousedown'])
}, _class.defaultProps = {
    componentClass: 'div'
}, _temp2);

// For component matching

DropdownMenu.defaultProps.componentType = DropdownMenu;

exports.default = DropdownMenu;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var matchComponent = function matchComponent(Component) {
    return function (c) {
        // React Component
        if (c.type === Component) {
            return true;
        }

        // Matching componentType
        if (c.props && c.props.componentType === Component) {
            return true;
        }

        return false;
    };
};

exports.default = matchComponent;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("react-dom");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("@trendmicro/react-buttons");

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp2;

var _chainedFunction = __webpack_require__(4);

var _chainedFunction2 = _interopRequireDefault(_chainedFunction);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _activeElement = __webpack_require__(17);

var _activeElement2 = _interopRequireDefault(_activeElement);

var _contains = __webpack_require__(10);

var _contains2 = _interopRequireDefault(_contains);

var _propTypes = __webpack_require__(0);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

var _uncontrollable = __webpack_require__(18);

var _uncontrollable2 = _interopRequireDefault(_uncontrollable);

var _warning = __webpack_require__(11);

var _warning2 = _interopRequireDefault(_warning);

var _reactButtons = __webpack_require__(8);

var _DropdownToggle = __webpack_require__(12);

var _DropdownToggle2 = _interopRequireDefault(_DropdownToggle);

var _DropdownMenuWrapper = __webpack_require__(13);

var _DropdownMenuWrapper2 = _interopRequireDefault(_DropdownMenuWrapper);

var _DropdownMenu = __webpack_require__(5);

var _DropdownMenu2 = _interopRequireDefault(_DropdownMenu);

var _matchComponent = __webpack_require__(6);

var _matchComponent2 = _interopRequireDefault(_matchComponent);

var _index = __webpack_require__(3);

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Dropdown = (_temp2 = _class = function (_PureComponent) {
    _inherits(Dropdown, _PureComponent);

    function Dropdown() {
        var _temp, _this, _ret;

        _classCallCheck(this, Dropdown);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _PureComponent.call.apply(_PureComponent, [this].concat(args))), _this), _this.menu = null, _this.toggle = null, _this._focusInDropdown = false, _this.lastOpenEventType = null, _this.isDropdownToggle = (0, _matchComponent2.default)(_DropdownToggle2.default), _this.isDropdownMenu = (0, _matchComponent2.default)(_DropdownMenu2.default), _this.isDropdownMenuWrapper = (0, _matchComponent2.default)(_DropdownMenuWrapper2.default), _this.handleToggleClick = function (event) {
            if (_this.props.disabled) {
                return;
            }

            _this.toggleDropdown('click');
        }, _this.handleToggleKeyDown = function (event) {
            if (_this.props.disabled) {
                return;
            }

            if (event.keyCode === 38) {
                // up
                if (!_this.props.open) {
                    _this.toggleDropdown('keyup');
                } else if (_this.menu.focusPrevious) {
                    _this.menu.focusPrevious();
                }
                event.preventDefault();
                return;
            }

            if (event.keyCode === 40) {
                // down
                if (!_this.props.open) {
                    _this.toggleDropdown('keydown');
                } else if (_this.menu.focusNext) {
                    _this.menu.focusNext();
                }
                event.preventDefault();
                return;
            }

            if (event.keyCode === 27 || event.keyCode === 9) {
                // esc or tab
                _this.closeDropdown();
                return;
            }
        }, _this.handleMouseEnter = function (event) {
            var _this$props = _this.props,
                autoOpen = _this$props.autoOpen,
                onToggle = _this$props.onToggle;


            if (autoOpen && typeof onToggle === 'function') {
                onToggle(true);
            }
        }, _this.handleMouseLeave = function (event) {
            var _this$props2 = _this.props,
                autoOpen = _this$props2.autoOpen,
                onToggle = _this$props2.onToggle;


            if (autoOpen && typeof onToggle === 'function') {
                onToggle(false);
            }
        }, _this.closeDropdown = function () {
            var _this$props3 = _this.props,
                open = _this$props3.open,
                autoOpen = _this$props3.autoOpen,
                onToggle = _this$props3.onToggle;


            if (open) {
                _this.toggleDropdown(null);
                return;
            }

            if (autoOpen && typeof onToggle === 'function') {
                onToggle(false);
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    } // <DropdownMenu ref={c => this.menu = c} />
    // <DropdownToggle ref={c => this.toggle = c} />


    Dropdown.prototype.componentDidMount = function componentDidMount() {
        this.focusOnOpen();
    };

    Dropdown.prototype.componentWillUpdate = function componentWillUpdate(nextProps) {
        if (!nextProps.open && this.props.open) {
            this._focusInDropdown = this.menu && (0, _contains2.default)(_reactDom2.default.findDOMNode(this.menu), (0, _activeElement2.default)(document));
        }
    };

    Dropdown.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
        var open = this.props.open;

        var prevOpen = prevProps.open;

        if (open && !prevOpen) {
            this.focusOnOpen();
        }

        if (!open && prevOpen) {
            // if focus hasn't already moved from the menu lets return it to the toggle
            if (this._focusInDropdown) {
                this._focusInDropdown = false;
                this.focus();
            }
        }
    };

    Dropdown.prototype.toggleDropdown = function toggleDropdown(eventType) {
        var _props = this.props,
            open = _props.open,
            onToggle = _props.onToggle;

        var shouldOpen = !open;

        if (shouldOpen) {
            this.lastOpenEventType = eventType;
        }

        if (typeof onToggle === 'function') {
            onToggle(shouldOpen);
        }
    };

    Dropdown.prototype.focusOnOpen = function focusOnOpen() {
        var menu = this.menu;

        if (this.lastOpenEventType === 'keydown' || this.props.role === 'menuitem') {
            menu.focusNext && menu.focusNext();
            return;
        }

        if (this.lastOpenEventType === 'keyup') {
            menu.focusPrevious && menu.focusPrevious();
            return;
        }
    };

    Dropdown.prototype.focus = function focus() {
        var toggle = _reactDom2.default.findDOMNode(this.toggle);

        if (toggle && toggle.focus) {
            toggle.focus();
        }
    };

    Dropdown.prototype.renderToggle = function renderToggle(child, props) {
        var _this2 = this;

        var ref = function ref(c) {
            _this2.toggle = c;
        };

        if (typeof child.ref === 'string') {
            (0, _warning2.default)(false, 'String refs are not supported on `<Dropdown.Toggle>` components. ' + 'To apply a ref to the component use the callback signature:\n\n ' + 'https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute');
        } else {
            ref = (0, _chainedFunction2.default)(child.ref, ref);
        }

        return (0, _react.cloneElement)(child, _extends({}, props, {
            ref: ref,
            onClick: (0, _chainedFunction2.default)(child.props.onClick, this.handleToggleClick),
            onKeyDown: (0, _chainedFunction2.default)(child.props.onKeyDown, this.handleToggleKeyDown)
        }));
    };

    Dropdown.prototype.renderMenu = function renderMenu(child, _ref) {
        var _this3 = this;

        var id = _ref.id,
            onClose = _ref.onClose,
            onSelect = _ref.onSelect,
            rootCloseEvent = _ref.rootCloseEvent,
            props = _objectWithoutProperties(_ref, ['id', 'onClose', 'onSelect', 'rootCloseEvent']);

        var ref = function ref(c) {
            _this3.menu = c;
        };

        if (typeof child.ref === 'string') {
            (0, _warning2.default)(false, 'String refs are not supported on `<Dropdown.Menu>` components. ' + 'To apply a ref to the component use the callback signature:\n\n ' + 'https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute');
        } else {
            ref = (0, _chainedFunction2.default)(child.ref, ref);
        }

        return (0, _react.cloneElement)(child, _extends({}, props, {
            ref: ref,
            onClose: (0, _chainedFunction2.default)(child.props.onClose, onClose, this.closeDropdown),
            onSelect: (0, _chainedFunction2.default)(child.props.onSelect, onSelect, this.closeDropdown),
            rootCloseEvent: rootCloseEvent
        }));
    };

    Dropdown.prototype.render = function render() {
        var _cx,
            _this4 = this;

        var _props2 = this.props,
            componentType = _props2.componentType,
            Component = _props2.componentClass,
            dropup = _props2.dropup,
            disabled = _props2.disabled,
            pullRight = _props2.pullRight,
            open = _props2.open,
            autoOpen = _props2.autoOpen,
            onClose = _props2.onClose,
            onSelect = _props2.onSelect,
            className = _props2.className,
            rootCloseEvent = _props2.rootCloseEvent,
            onMouseEnter = _props2.onMouseEnter,
            onMouseLeave = _props2.onMouseLeave,
            onToggle = _props2.onToggle,
            children = _props2.children,
            props = _objectWithoutProperties(_props2, ['componentType', 'componentClass', 'dropup', 'disabled', 'pullRight', 'open', 'autoOpen', 'onClose', 'onSelect', 'className', 'rootCloseEvent', 'onMouseEnter', 'onMouseLeave', 'onToggle', 'children']);

        if (Component === _reactButtons.ButtonGroup) {
            props.dropdownOpen = open;
        }

        return _react2.default.createElement(
            Component,
            _extends({}, props, {
                onMouseEnter: (0, _chainedFunction2.default)(onMouseEnter, this.handleMouseEnter),
                onMouseLeave: (0, _chainedFunction2.default)(onMouseLeave, this.handleMouseLeave),
                className: (0, _classnames2.default)(className, _index2.default.dropdown, (_cx = {}, _cx[_index2.default.open] = open, _cx[_index2.default.disabled] = disabled, _cx[_index2.default.dropup] = dropup, _cx))
            }),
            _react2.default.Children.map(children, function (child) {
                if (!_react2.default.isValidElement(child)) {
                    return child;
                }

                if (_this4.isDropdownToggle(child)) {
                    return _this4.renderToggle(child, {
                        disabled: disabled, open: open
                    });
                }

                if (_this4.isDropdownMenu(child) || _this4.isDropdownMenuWrapper(child)) {
                    return _this4.renderMenu(child, {
                        open: open,
                        pullRight: pullRight,
                        onClose: onClose,
                        onSelect: onSelect,
                        rootCloseEvent: rootCloseEvent
                    });
                }

                return child;
            })
        );
    };

    return Dropdown;
}(_react.PureComponent), _class.propTypes = {
    componentType: _propTypes2.default.any,

    // A custom element for this component.
    componentClass: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.func]),

    // The menu will open above the dropdown button, instead of below it.
    dropup: _propTypes2.default.bool,

    // Whether or not component is disabled.
    disabled: _propTypes2.default.bool,

    // Whether or not the dropdown is visible.
    open: _propTypes2.default.bool,

    // Whether to open the dropdown on mouse over.
    autoOpen: _propTypes2.default.bool,

    // Align the menu to the right side of the dropdown toggle.
    pullRight: _propTypes2.default.bool,

    // A callback fired when the dropdown closes.
    onClose: _propTypes2.default.func,

    // A callback fired when the dropdown wishes to change visibility. Called with the requested
    // `open` value.
    //
    // ```js
    // function(Boolean isOpen) {}
    // ```
    onToggle: _propTypes2.default.func,

    // A callback fired when a menu item is selected.
    //
    // ```js
    // (eventKey: any, event: Object) => any
    // ```
    onSelect: _propTypes2.default.func,

    // If `'menuitem'`, causes the dropdown to behave like a menu item rather than a menu button.
    role: _propTypes2.default.string,

    // Which event when fired outside the component will cause it to be closed.
    rootCloseEvent: _propTypes2.default.oneOf(['click', 'mousedown']),

    onMouseEnter: _propTypes2.default.func,
    onMouseLeave: _propTypes2.default.func
}, _class.defaultProps = {
    componentClass: _reactButtons.ButtonGroup,
    dropup: false,
    disabled: false,
    pullRight: false,
    open: false
}, _temp2);

// For component matching

Dropdown.defaultProps.componentType = Dropdown;

var UncontrollableDropdown = (0, _uncontrollable2.default)(Dropdown, {
    // Define the pairs of prop/handlers you want to be uncontrollable
    open: 'onToggle'
});

UncontrollableDropdown.Toggle = _DropdownToggle2.default;
UncontrollableDropdown.Menu = _DropdownMenu2.default;
UncontrollableDropdown.MenuWrapper = _DropdownMenuWrapper2.default;

exports.default = UncontrollableDropdown;

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("dom-helpers/query/contains");

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("warning");

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp;

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _propTypes = __webpack_require__(0);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _reactButtons = __webpack_require__(8);

var _index = __webpack_require__(3);

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DropdownToggle = (_temp = _class = function (_PureComponent) {
    _inherits(DropdownToggle, _PureComponent);

    function DropdownToggle() {
        _classCallCheck(this, DropdownToggle);

        return _possibleConstructorReturn(this, _PureComponent.apply(this, arguments));
    }

    DropdownToggle.prototype.render = function render() {
        var _cx;

        var _props = this.props,
            componentType = _props.componentType,
            Component = _props.componentClass,
            noCaret = _props.noCaret,
            open = _props.open,
            className = _props.className,
            children = _props.children,
            props = _objectWithoutProperties(_props, ['componentType', 'componentClass', 'noCaret', 'open', 'className', 'children']);

        if (Component === _reactButtons.Button) {
            props.btnStyle = props.btnStyle || 'flat';
            props.btnSize = props.btnSize || _reactButtons.Button.defaultProps.btnSize;
            props.dropdownToggle = true;
        }

        var useCaret = !noCaret;
        var empty = !children && !props.title;

        return _react2.default.createElement(
            Component,
            _extends({}, props, {
                'aria-haspopup': true,
                'aria-expanded': open,
                role: 'button',
                className: (0, _classnames2.default)(className, (_cx = {}, _cx[_index2.default.dropdownToggle] = true, _cx[_index2.default.btnLink] = props.btnStyle === 'link', _cx[_index2.default.btnLg] = props.btnSize === 'lg' || props.btnSize === 'large', _cx[_index2.default.btnMd] = props.btnSize === 'md' || props.btnSize === 'medium', _cx[_index2.default.btnSm] = props.btnSize === 'sm' || props.btnSize === 'small', _cx[_index2.default.btnXs] = props.btnSize === 'xs' || props.btnSize === 'extra-small', _cx[_index2.default.empty] = empty, _cx))
            }),
            children || props.title,
            useCaret && _react2.default.createElement('span', { className: _index2.default.caret })
        );
    };

    return DropdownToggle;
}(_react.PureComponent), _class.propTypes = {
    componentType: _propTypes2.default.any,

    // A custom element for this component.
    componentClass: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.func]),

    // One of: 'lg', 'md', 'sm', 'xs'
    btnSize: _reactButtons.Button.propTypes.btnSize,

    // One of: 'default', 'primary', 'emphasis', 'flat', 'link'
    btnStyle: _reactButtons.Button.propTypes.btnStyle,

    // Whether to prevent a caret from being rendered next to the title.
    noCaret: _propTypes2.default.bool,

    // Title content.
    title: _propTypes2.default.string,

    // Dropdown
    disabled: _propTypes2.default.bool,
    open: _propTypes2.default.bool
}, _class.defaultProps = {
    componentClass: _reactButtons.Button,
    noCaret: false,

    // Dropdown
    disabled: false,
    open: false
}, _temp);

// For component matching

DropdownToggle.defaultProps.componentType = DropdownToggle;

exports.default = DropdownToggle;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp2;

var _chainedFunction = __webpack_require__(4);

var _chainedFunction2 = _interopRequireDefault(_chainedFunction);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _propTypes = __webpack_require__(0);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _warning = __webpack_require__(11);

var _warning2 = _interopRequireDefault(_warning);

var _DropdownMenu = __webpack_require__(5);

var _DropdownMenu2 = _interopRequireDefault(_DropdownMenu);

var _RootCloseWrapper = __webpack_require__(15);

var _RootCloseWrapper2 = _interopRequireDefault(_RootCloseWrapper);

var _matchComponent = __webpack_require__(6);

var _matchComponent2 = _interopRequireDefault(_matchComponent);

var _index = __webpack_require__(3);

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DropdownMenuWrapper = (_temp2 = _class = function (_PureComponent) {
    _inherits(DropdownMenuWrapper, _PureComponent);

    function DropdownMenuWrapper() {
        var _temp, _this, _ret;

        _classCallCheck(this, DropdownMenuWrapper);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _PureComponent.call.apply(_PureComponent, [this].concat(args))), _this), _this.menu = null, _this.isDropdownMenu = (0, _matchComponent2.default)(_DropdownMenu2.default), _temp), _possibleConstructorReturn(_this, _ret);
    } // <DropdownMenu ref={c => this.menu = c} />

    DropdownMenuWrapper.prototype.focusNext = function focusNext() {
        this.menu && this.menu.focusNext && this.menu.focusNext();
    };

    DropdownMenuWrapper.prototype.focusPrevious = function focusPrevious() {
        this.menu && this.menu.focusPrevious && this.menu.focusPrevious();
    };

    DropdownMenuWrapper.prototype.renderMenu = function renderMenu(child, props) {
        var _this2 = this;

        var ref = function ref(c) {
            _this2.menu = c;
        };

        if (typeof child.ref === 'string') {
            (0, _warning2.default)(false, 'String refs are not supported on `<Dropdown.Menu>` components. ' + 'To apply a ref to the component use the callback signature:\n\n ' + 'https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute');
        } else {
            ref = (0, _chainedFunction2.default)(child.ref, ref);
        }

        return (0, _react.cloneElement)(child, _extends({}, props, {
            ref: ref
        }));
    };

    DropdownMenuWrapper.prototype.render = function render() {
        var _cx,
            _this3 = this;

        var _props = this.props,
            componentType = _props.componentType,
            Component = _props.componentClass,
            open = _props.open,
            pullRight = _props.pullRight,
            onClose = _props.onClose,
            onSelect = _props.onSelect,
            rootCloseEvent = _props.rootCloseEvent,
            children = _props.children,
            className = _props.className,
            props = _objectWithoutProperties(_props, ['componentType', 'componentClass', 'open', 'pullRight', 'onClose', 'onSelect', 'rootCloseEvent', 'children', 'className']);

        return _react2.default.createElement(
            _RootCloseWrapper2.default,
            {
                disabled: !open,
                onRootClose: onClose,
                event: rootCloseEvent
            },
            _react2.default.createElement(
                Component,
                _extends({}, props, {
                    className: (0, _classnames2.default)(className, (_cx = {}, _cx[_index2.default.dropdownMenuWrapper] = true, _cx[_index2.default.pullRight] = !!pullRight, _cx))
                }),
                _react2.default.Children.map(children, function (child) {
                    if (!_react2.default.isValidElement(child)) {
                        return child;
                    }

                    if (_this3.isDropdownMenu(child)) {
                        return _this3.renderMenu(child, {
                            // Do not pass onClose and rootCloseEvent to the dropdown menu
                            open: open,
                            pullRight: pullRight,
                            onSelect: onSelect
                        });
                    }

                    return child;
                })
            )
        );
    };

    return DropdownMenuWrapper;
}(_react.PureComponent), _class.propTypes = {
    componentType: _propTypes2.default.any,

    // A custom element for this component.
    componentClass: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.func]),

    // Dropdown
    open: _propTypes2.default.bool,
    pullRight: _propTypes2.default.bool,
    onClose: _propTypes2.default.func,
    onSelect: _propTypes2.default.func,
    rootCloseEvent: _propTypes2.default.oneOf(['click', 'mousedown'])
}, _class.defaultProps = {
    componentClass: 'div'
}, _temp2);

// For component matching

DropdownMenuWrapper.defaultProps.componentType = DropdownMenuWrapper;

exports.default = DropdownMenuWrapper;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp2;

var _chainedFunction = __webpack_require__(4);

var _chainedFunction2 = _interopRequireDefault(_chainedFunction);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _propTypes = __webpack_require__(0);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _matchComponent = __webpack_require__(6);

var _matchComponent2 = _interopRequireDefault(_matchComponent);

var _DropdownMenu = __webpack_require__(5);

var _DropdownMenu2 = _interopRequireDefault(_DropdownMenu);

var _index = __webpack_require__(3);

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MenuItem = (_temp2 = _class = function (_Component) {
    _inherits(MenuItem, _Component);

    function MenuItem() {
        var _temp, _this, _ret;

        _classCallCheck(this, MenuItem);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.isMenuItem = (0, _matchComponent2.default)(MenuItem), _this.handleClick = function (event) {
            var _this$props = _this.props,
                disabled = _this$props.disabled,
                onSelect = _this$props.onSelect,
                eventKey = _this$props.eventKey;


            if (disabled) {
                event.preventDefault();
            }

            if (disabled) {
                return;
            }

            if (onSelect) {
                onSelect(eventKey, event);
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    MenuItem.prototype.render = function render() {
        var _this2 = this,
            _cx;

        var _props = this.props,
            componentType = _props.componentType,
            Component = _props.componentClass,
            active = _props.active,
            disabled = _props.disabled,
            divider = _props.divider,
            eventKey = _props.eventKey,
            header = _props.header,
            onClick = _props.onClick,
            open = _props.open,
            pullRight = _props.pullRight,
            onClose = _props.onClose,
            onSelect = _props.onSelect,
            rootCloseEvent = _props.rootCloseEvent,
            className = _props.className,
            style = _props.style,
            children = _props.children,
            props = _objectWithoutProperties(_props, ['componentType', 'componentClass', 'active', 'disabled', 'divider', 'eventKey', 'header', 'onClick', 'open', 'pullRight', 'onClose', 'onSelect', 'rootCloseEvent', 'className', 'style', 'children']);

        if (divider) {
            // Forcibly blank out the children; separators shouldn't render any.
            props.children = undefined;

            return _react2.default.createElement(
                Component,
                _extends({}, props, {
                    role: 'separator',
                    className: (0, _classnames2.default)(className, _index2.default.divider),
                    style: style
                }),
                children
            );
        }

        if (header) {
            return _react2.default.createElement(
                Component,
                _extends({}, props, {
                    role: 'heading',
                    className: (0, _classnames2.default)(className, _index2.default.header),
                    style: style
                }),
                children
            );
        }

        var menuItems = _react2.default.Children.toArray(children).filter(function (child) {
            return _react2.default.isValidElement(child) && _this2.isMenuItem(child);
        });

        var others = _react2.default.Children.toArray(children).filter(function (child) {
            return !(_react2.default.isValidElement(child) && _this2.isMenuItem(child));
        });

        return _react2.default.createElement(
            Component,
            {
                role: 'presentation',
                className: (0, _classnames2.default)(className, _index2.default.menuItemWrapper, (_cx = {}, _cx[_index2.default.active] = active, _cx[_index2.default.disabled] = disabled, _cx[_index2.default.dropdownSubmenu] = menuItems.length > 0, _cx[_index2.default.open] = open, _cx)),
                style: style
            },
            _react2.default.createElement(
                'div',
                _extends({}, props, {
                    className: _index2.default.menuItem,
                    disabled: disabled,
                    role: 'menuitem',
                    tabIndex: '-1',
                    onClick: (0, _chainedFunction2.default)(onClick, this.handleClick)
                }),
                others
            ),
            menuItems.length > 0 && _react2.default.createElement(
                _DropdownMenu2.default,
                {
                    open: open,
                    pullRight: pullRight,
                    onClose: onClose,
                    onSelect: onSelect,
                    rootCloseEvent: rootCloseEvent
                },
                menuItems
            )
        );
    };

    return MenuItem;
}(_react.Component), _class.propTypes = {
    componentType: _propTypes2.default.any,

    // A custom element for this component.
    componentClass: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.func]),

    // Highlight the menu item as active.
    active: _propTypes2.default.bool,

    // Disable the menu item, making it unselectable.
    disabled: _propTypes2.default.bool,

    // Style the menu item as a horizontal rule, providing visual separation between groups of menu items.
    divider: _propTypes2.default.bool,

    // Value passed to the `onSelect` handler, useful for identifying the selected menu item.
    eventKey: _propTypes2.default.any,

    // Style the menu item as a header label, useful for describing a group of menu items.
    header: _propTypes2.default.bool,

    // Callback fired when the menu item is clicked, even if it is disabled.
    onClick: _propTypes2.default.func,

    // Dropdown
    open: _propTypes2.default.bool,
    pullRight: _propTypes2.default.bool,
    onClose: _propTypes2.default.func,
    onSelect: _propTypes2.default.func,
    rootCloseEvent: _propTypes2.default.oneOf(['click', 'mousedown'])
}, _class.defaultProps = {
    componentClass: 'div',
    active: false,
    disabled: false,
    divider: false,
    header: false,

    // DropdownMenu
    open: false,
    pullRight: false
}, _temp2);

// For component matching

MenuItem.defaultProps.componentType = MenuItem;

exports.default = MenuItem;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _class, _temp;

var _contains = __webpack_require__(10);

var _contains2 = _interopRequireDefault(_contains);

var _on = __webpack_require__(19);

var _on2 = _interopRequireDefault(_on);

var _off = __webpack_require__(20);

var _off2 = _interopRequireDefault(_off);

var _propTypes = __webpack_require__(0);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var escapeKeyCode = 27;

var ownerDocument = function ownerDocument(node) {
    return node && node.ownerDocument || document;
};

var isLeftClickEvent = function isLeftClickEvent(event) {
    return event.button === 0;
};

var isModifiedEvent = function isModifiedEvent(event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
};

// The `<RootCloseWrapper/>` component registers your callback on the document
// when rendered. Powers the `<Overlay/>` component. This is used achieve modal
// style behavior where your callback is triggered when the user tries to
// interact with the rest of the document or hits the `esc` key.
var RootCloseWrapper = (_temp = _class = function (_React$Component) {
    _inherits(RootCloseWrapper, _React$Component);

    function RootCloseWrapper(props, context) {
        _classCallCheck(this, RootCloseWrapper);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this, props, context));

        _this.handleMouseCapture = function (e) {
            _this.preventMouseRootClose = isModifiedEvent(e) || !isLeftClickEvent(e) || (0, _contains2.default)(_reactDom2.default.findDOMNode(_this), e.target);
        };

        _this.handleMouse = function (e) {
            if (!_this.preventMouseRootClose && _this.props.onRootClose) {
                _this.props.onRootClose(e);
            }
        };

        _this.handleKeyUp = function (e) {
            if (e.keyCode === escapeKeyCode && _this.props.onRootClose) {
                _this.props.onRootClose(e);
            }
        };

        _this.preventMouseRootClose = false;
        return _this;
    }

    RootCloseWrapper.prototype.componentDidMount = function componentDidMount() {
        if (!this.props.disabled) {
            this.addEventListeners();
        }
    };

    RootCloseWrapper.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
        if (!this.props.disabled && prevProps.disabled) {
            this.addEventListeners();
        } else if (this.props.disabled && !prevProps.disabled) {
            this.removeEventListeners();
        }
    };

    RootCloseWrapper.prototype.componentWillUnmount = function componentWillUnmount() {
        if (!this.props.disabled) {
            this.removeEventListeners();
        }
    };

    RootCloseWrapper.prototype.addEventListeners = function addEventListeners() {
        var event = this.props.event;

        var doc = ownerDocument(_reactDom2.default.findDOMNode(this));

        // Use capture for this listener so it fires before React's listener, to
        // avoid false positives in the contains() check below if the target DOM
        // element is removed in the React mouse callback.
        (0, _on2.default)(doc, event, this.handleMouseCapture, true);
        (0, _on2.default)(doc, event, this.handleMouse);
        (0, _on2.default)(doc, 'keyup', this.handleKeyUp);
    };

    RootCloseWrapper.prototype.removeEventListeners = function removeEventListeners() {
        var event = this.props.event;

        var doc = ownerDocument(_reactDom2.default.findDOMNode(this));

        (0, _off2.default)(doc, event, this.handleMouseCapture, true);
        (0, _off2.default)(doc, event, this.handleMouse);
        (0, _off2.default)(doc, 'keyup', this.handleKeyUp);
    };

    RootCloseWrapper.prototype.render = function render() {
        return this.props.children;
    };

    return RootCloseWrapper;
}(_react2.default.Component), _class.propTypes = {
    // Callback fired after click or mousedown. Also triggers when user hits `esc`.
    onRootClose: _propTypes2.default.func,

    // Children to render.
    children: _propTypes2.default.element,

    // Disable the the RootCloseWrapper, preventing it from triggering `onRootClose`.
    disabled: _propTypes2.default.bool,

    // Choose which document mouse event to bind to.
    event: _propTypes2.default.oneOf(['click', 'mousedown'])
}, _class.defaultProps = {
    event: 'click'
}, _temp);
exports.default = RootCloseWrapper;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.MenuItem = exports.DropdownMenu = exports.DropdownMenuWrapper = exports.DropdownToggle = exports.DropdownButton = undefined;

var _Dropdown = __webpack_require__(9);

var _Dropdown2 = _interopRequireDefault(_Dropdown);

var _DropdownButton2 = __webpack_require__(21);

var _DropdownButton3 = _interopRequireDefault(_DropdownButton2);

var _DropdownToggle2 = __webpack_require__(12);

var _DropdownToggle3 = _interopRequireDefault(_DropdownToggle2);

var _DropdownMenuWrapper2 = __webpack_require__(13);

var _DropdownMenuWrapper3 = _interopRequireDefault(_DropdownMenuWrapper2);

var _DropdownMenu2 = __webpack_require__(5);

var _DropdownMenu3 = _interopRequireDefault(_DropdownMenu2);

var _MenuItem2 = __webpack_require__(14);

var _MenuItem3 = _interopRequireDefault(_MenuItem2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.DropdownButton = _DropdownButton3.default;
exports.DropdownToggle = _DropdownToggle3.default;
exports.DropdownMenuWrapper = _DropdownMenuWrapper3.default;
exports.DropdownMenu = _DropdownMenu3.default;
exports.MenuItem = _MenuItem3.default;
exports.default = _Dropdown2.default;

/***/ }),
/* 17 */
/***/ (function(module, exports) {

module.exports = require("dom-helpers/activeElement");

/***/ }),
/* 18 */
/***/ (function(module, exports) {

module.exports = require("uncontrollable");

/***/ }),
/* 19 */
/***/ (function(module, exports) {

module.exports = require("dom-helpers/events/on");

/***/ }),
/* 20 */
/***/ (function(module, exports) {

module.exports = require("dom-helpers/events/off");

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp;

var _reactButtons = __webpack_require__(8);

var _propTypes = __webpack_require__(0);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _Dropdown = __webpack_require__(9);

var _Dropdown2 = _interopRequireDefault(_Dropdown);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DropdownButton = (_temp = _class = function (_PureComponent) {
    _inherits(DropdownButton, _PureComponent);

    function DropdownButton() {
        _classCallCheck(this, DropdownButton);

        return _possibleConstructorReturn(this, _PureComponent.apply(this, arguments));
    }

    DropdownButton.prototype.render = function render() {
        var _props = this.props,
            btnSize = _props.btnSize,
            btnStyle = _props.btnStyle,
            title = _props.title,
            children = _props.children,
            props = _objectWithoutProperties(_props, ['btnSize', 'btnStyle', 'title', 'children']);

        // Split component props


        var dropdownProps = {};
        var toggleProps = {};
        Object.keys(props).forEach(function (propName) {
            var propValue = props[propName];
            if (_Dropdown2.default.ControlledComponent.propTypes[propName]) {
                dropdownProps[propName] = propValue;
            } else {
                toggleProps[propName] = propValue;
            }
        });

        return _react2.default.createElement(
            _Dropdown2.default,
            _extends({}, dropdownProps, {
                btnSize: btnSize
            }),
            _react2.default.createElement(
                _Dropdown2.default.Toggle,
                _extends({}, toggleProps, {
                    btnStyle: btnStyle
                }),
                title
            ),
            _react2.default.createElement(
                _Dropdown2.default.Menu,
                null,
                children
            )
        );
    };

    return DropdownButton;
}(_react.PureComponent), _class.propTypes = _extends({}, _Dropdown2.default.propTypes, {

    // One of: 'lg', 'md', 'sm', 'xs'
    btnSize: _reactButtons.Button.propTypes.btnSize,

    // One of: 'default', 'primary', 'emphasis', 'flat', 'link'
    btnStyle: _reactButtons.Button.propTypes.btnStyle,

    // Title content.
    title: _propTypes2.default.node.isRequired,

    // Whether to prevent a caret from being rendered next to the title.
    noCaret: _propTypes2.default.bool
}), _class.defaultProps = {
    btnStyle: 'flat'
}, _temp);
exports.default = DropdownButton;

/***/ })
/******/ ]);
//# sourceMappingURL=index.js.map