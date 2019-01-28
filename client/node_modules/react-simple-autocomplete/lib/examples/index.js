'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _Autocomplete = require('../Autocomplete');

var _Autocomplete2 = _interopRequireDefault(_Autocomplete);

var _App = require('./css/App.css');

var _App2 = _interopRequireDefault(_App);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var App = function (_Component) {
  _inherits(App, _Component);

  function App() {
    _classCallCheck(this, App);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(App).apply(this, arguments));
  }

  _createClass(App, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: _App2.default.container },
        _react2.default.createElement(
          'div',
          { className: _App2.default.header },
          'React Simple Autocomplete'
        ),
        _react2.default.createElement(
          'div',
          { className: _App2.default.title },
          'Simple Example'
        ),
        _react2.default.createElement(_Autocomplete2.default, {
          className: _App2.default.simple,
          items: ['one', 'two', 'three'] }),
        _react2.default.createElement(
          'code',
          { className: _App2.default.code },
          '\n          <Autocomplete items={[\'one\', \'two\', \'three\']} />\n        '
        ),
        _react2.default.createElement(
          'div',
          { className: _App2.default.title },
          'Custom Menu'
        ),
        _react2.default.createElement(
          _Autocomplete2.default,
          {
            className: _App2.default.menu,
            items: ['Row', 'Row', 'Row your boat'],
            renderMenu: function renderMenu(_ref) {
              var items = _ref.items;
              return _react2.default.createElement(
                'div',
                { className: _App2.default.renderMenu },
                items,
                _react2.default.createElement(
                  'div',
                  { className: _App2.default.stream },
                  'Gently down the stream!'
                )
              );
            },
            renderItem: function renderItem(_ref2) {
              var item = _ref2.item;
              var highlighted = _ref2.highlighted;
              return _react2.default.createElement(
                'div',
                { className: highlighted ? _App2.default.activeItem : _App2.default.item },
                item,
                '!'
              );
            } },
          _react2.default.createElement('input', { placeholder: 'Ahoy, captain!' })
        ),
        _react2.default.createElement(
          'code',
          { className: _App2.default.code },
          '<Autocomplete',
          _react2.default.createElement('br', null),
          '  ',
          'items={[\'Row\', \'Row\', \'Row your boat\']}',
          _react2.default.createElement('br', null),
          '  ',
          'renderMenu={({items}) =>',
          _react2.default.createElement('br', null),
          '    ',
          '<div className=\'menu\'>{items}<div>Gently down the stream!</div></div>}',
          _react2.default.createElement('br', null),
          '  ',
          'renderItem={({item, highlighted}) =>',
          _react2.default.createElement('br', null),
          '    ',
          '<div className={highlighted ? \'active-item\' : \'item\'}>{item}!</div>} />',
          _react2.default.createElement('br', null),
          '  ',
          '<input placeholder="Ahoy, captain!" />',
          _react2.default.createElement('br', null),
          '</Autocomplete>'
        )
      );
    }
  }]);

  return App;
}(_react.Component);

(0, _reactDom.render)(_react2.default.createElement(App, null), document.getElementById('app'));