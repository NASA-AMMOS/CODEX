'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-disable */

var defaultSelectInputComponent = function defaultSelectInputComponent(props) {
  return _react2.default.createElement('input', {
    type: props.selectType || 'checkbox',
    checked: props.checked,
    onClick: function onClick(e) {
      var shiftKey = e.shiftKey;

      e.stopPropagation();
      props.onClick(props.id, shiftKey, props.row);
    },
    onChange: function onChange() {}
  });
};

exports.default = function (Component) {
  var wrapper = function (_React$Component) {
    _inherits(RTSelectTable, _React$Component);

    function RTSelectTable(props) {
      _classCallCheck(this, RTSelectTable);

      return _possibleConstructorReturn(this, (RTSelectTable.__proto__ || Object.getPrototypeOf(RTSelectTable)).call(this, props));
    }

    _createClass(RTSelectTable, [{
      key: 'rowSelector',
      value: function rowSelector(row) {
        if (!row || !row.hasOwnProperty(this.props.keyField)) return null;
        var _props = this.props,
            toggleSelection = _props.toggleSelection,
            selectType = _props.selectType,
            keyField = _props.keyField;

        var checked = this.props.isSelected(row[this.props.keyField]);
        var inputProps = {
          checked: checked,
          onClick: toggleSelection,
          selectType: selectType,
          id: row[keyField],
          row: row
        };
        return _react2.default.createElement(this.props.SelectInputComponent, inputProps);
      }
    }, {
      key: 'headSelector',
      value: function headSelector(row) {
        var selectType = this.props.selectType;

        if (selectType === 'radio') return null;

        var _props2 = this.props,
            toggleAll = _props2.toggleAll,
            checked = _props2.selectAll,
            SelectAllInputComponent = _props2.SelectAllInputComponent;

        var inputProps = {
          checked: checked,
          onClick: toggleAll,
          selectType: selectType
        };

        return _react2.default.createElement(SelectAllInputComponent, inputProps);
      }

      // this is so we can expose the underlying ReactTable to get at the sortedData for selectAll

    }, {
      key: 'getWrappedInstance',
      value: function getWrappedInstance() {
        if (!this.wrappedInstance) console.warn('RTSelectTable - No wrapped instance');
        if (this.wrappedInstance.getWrappedInstance) return this.wrappedInstance.getWrappedInstance();else return this.wrappedInstance;
      }
    }, {
      key: 'render',
      value: function render() {
        var _this2 = this;

        var _props3 = this.props,
            originalCols = _props3.columns,
            isSelected = _props3.isSelected,
            toggleSelection = _props3.toggleSelection,
            toggleAll = _props3.toggleAll,
            keyField = _props3.keyField,
            selectAll = _props3.selectAll,
            selectType = _props3.selectType,
            selectWidth = _props3.selectWidth,
            SelectAllInputComponent = _props3.SelectAllInputComponent,
            SelectInputComponent = _props3.SelectInputComponent,
            rest = _objectWithoutProperties(_props3, ['columns', 'isSelected', 'toggleSelection', 'toggleAll', 'keyField', 'selectAll', 'selectType', 'selectWidth', 'SelectAllInputComponent', 'SelectInputComponent']);

        var select = {
          id: '_selector',
          accessor: function accessor() {
            return 'x';
          }, // this value is not important
          Header: this.headSelector.bind(this),
          Cell: function Cell(ci) {
            return _this2.rowSelector.bind(_this2)(ci.original);
          },
          width: selectWidth || 30,
          filterable: false,
          sortable: false,
          resizable: false,
          style: { textAlign: 'center' }
        };
        var columns = [select].concat(_toConsumableArray(originalCols));
        var extra = {
          columns: columns
        };
        return _react2.default.createElement(Component, _extends({}, rest, extra, { ref: function ref(r) {
            return _this2.wrappedInstance = r;
          } }));
      }
    }]);

    return RTSelectTable;
  }(_react2.default.Component);

  wrapper.displayName = 'RTSelectTable';
  wrapper.defaultProps = {
    keyField: '_id',
    isSelected: function isSelected(key) {
      console.log('No isSelected handler provided:', { key: key });
    },
    selectAll: false,
    toggleSelection: function toggleSelection(key, shift, row) {
      console.log('No toggleSelection handler provided:', { key: key, shift: shift, row: row });
    },
    toggleAll: function toggleAll() {
      console.log('No toggleAll handler provided.');
    },
    selectType: 'check',
    SelectInputComponent: defaultSelectInputComponent,
    SelectAllInputComponent: defaultSelectInputComponent
  };

  return wrapper;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9ob2Mvc2VsZWN0VGFibGUvaW5kZXguanMiXSwibmFtZXMiOlsiZGVmYXVsdFNlbGVjdElucHV0Q29tcG9uZW50IiwicHJvcHMiLCJzZWxlY3RUeXBlIiwiY2hlY2tlZCIsInNoaWZ0S2V5IiwiZSIsInN0b3BQcm9wYWdhdGlvbiIsIm9uQ2xpY2siLCJpZCIsInJvdyIsIndyYXBwZXIiLCJoYXNPd25Qcm9wZXJ0eSIsImtleUZpZWxkIiwidG9nZ2xlU2VsZWN0aW9uIiwiaXNTZWxlY3RlZCIsImlucHV0UHJvcHMiLCJjcmVhdGVFbGVtZW50IiwiU2VsZWN0SW5wdXRDb21wb25lbnQiLCJ0b2dnbGVBbGwiLCJzZWxlY3RBbGwiLCJTZWxlY3RBbGxJbnB1dENvbXBvbmVudCIsIndyYXBwZWRJbnN0YW5jZSIsImNvbnNvbGUiLCJ3YXJuIiwiZ2V0V3JhcHBlZEluc3RhbmNlIiwib3JpZ2luYWxDb2xzIiwiY29sdW1ucyIsInNlbGVjdFdpZHRoIiwicmVzdCIsInNlbGVjdCIsImFjY2Vzc29yIiwiSGVhZGVyIiwiaGVhZFNlbGVjdG9yIiwiYmluZCIsIkNlbGwiLCJyb3dTZWxlY3RvciIsImNpIiwib3JpZ2luYWwiLCJ3aWR0aCIsImZpbHRlcmFibGUiLCJzb3J0YWJsZSIsInJlc2l6YWJsZSIsInN0eWxlIiwidGV4dEFsaWduIiwiZXh0cmEiLCJyIiwiQ29tcG9uZW50IiwiZGlzcGxheU5hbWUiLCJkZWZhdWx0UHJvcHMiLCJsb2ciLCJrZXkiLCJzaGlmdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUVBOzs7Ozs7Ozs7Ozs7OzsrZUFGQTs7QUFJQSxJQUFNQSw4QkFBOEIsU0FBOUJBLDJCQUE4QixRQUFTO0FBQzNDLFNBQ0U7QUFDRSxVQUFNQyxNQUFNQyxVQUFOLElBQW9CLFVBRDVCO0FBRUUsYUFBU0QsTUFBTUUsT0FGakI7QUFHRSxhQUFTLG9CQUFLO0FBQUEsVUFDSkMsUUFESSxHQUNTQyxDQURULENBQ0pELFFBREk7O0FBRVpD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LyogZXNsaW50LWRpc2FibGUgKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuXG5jb25zdCBkZWZhdWx0U2VsZWN0SW5wdXRDb21wb25lbnQgPSBwcm9wcyA9PiB7XG4gIHJldHVybiAoXG4gICAgPGlucHV0XG4gICAgICB0eXBlPXtwcm9wcy5zZWxlY3RUeXBlIHx8ICdjaGVja2JveCd9XG4gICAgICBjaGVja2VkPXtwcm9wcy5jaGVja2VkfVxuICAgICAgb25DbGljaz17ZSA9PiB7XG4gICAgICAgIGNvbnN0IHsgc2hpZnRLZXkgfSA9IGVcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBwcm9wcy5vbkNsaWNrKHByb3BzLmlkLCBzaGlmdEtleSwgcHJvcHMucm93KVxuICAgICAgfX1cbiAgICAgIG9uQ2hhbmdlPXsoKSA9PiB7fX1cbiAgICAvPlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudCA9PiB7XG4gIGNvbnN0IHdyYXBwZXIgPSBjbGFzcyBSVFNlbGVjdFRhYmxlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgc3VwZXIocHJvcHMpXG4gICAgfVxuXG4gICAgcm93U2VsZWN0b3Iocm93KSB7XG4gICAgICBpZiAoIXJvdyB8fCAhcm93Lmhhc093blByb3BlcnR5KHRoaXMucHJvcHMua2V5RmllbGQpKSByZXR1cm4gbnVsbFxuICAgICAgY29uc3QgeyB0b2dnbGVTZWxlY3Rpb24sIHNlbGVjdFR5cGUsIGtleUZpZWxkIH0gPSB0aGlzLnByb3BzXG4gICAgICBjb25zdCBjaGVja2VkID0gdGhpcy5wcm9wcy5pc1NlbGVjdGVkKHJvd1t0aGlzLnByb3BzLmtleUZpZWxkXSlcbiAgICAgIGNvbnN0IGlucHV0UHJvcHMgPSB7XG4gICAgICAgIGNoZWNrZWQsXG4gICAgICAgIG9uQ2xpY2s6IHRvZ2dsZVNlbGVjdGlvbixcbiAgICAgICAgc2VsZWN0VHlwZSxcbiAgICAgICAgaWQ6IHJvd1trZXlGaWVsZF0sXG4gICAgICAgIHJvdyxcbiAgICAgIH1cbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KHRoaXMucHJvcHMuU2VsZWN0SW5wdXRDb21wb25lbnQsIGlucHV0UHJvcHMpXG4gICAgfVxuXG4gICAgaGVhZFNlbGVjdG9yKHJvdykge1xuICAgICAgY29uc3QgeyBzZWxlY3RUeXBlIH0gPSB0aGlzLnByb3BzXG4gICAgICBpZiAoc2VsZWN0VHlwZSA9PT0gJ3JhZGlvJykgcmV0dXJuIG51bGxcblxuICAgICAgY29uc3QgeyB0b2dnbGVBbGwsIHNlbGVjdEFsbDogY2hlY2tlZCwgU2VsZWN0QWxsSW5wdXRDb21wb25lbnQgfSA9IHRoaXMucHJvcHNcbiAgICAgIGNvbnN0IGlucHV0UHJvcHMgPSB7XG4gICAgICAgIGNoZWNrZWQsXG4gICAgICAgIG9uQ2xpY2s6IHRvZ2dsZUFsbCxcbiAgICAgICAgc2VsZWN0VHlwZSxcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoU2VsZWN0QWxsSW5wdXRDb21wb25lbnQsIGlucHV0UHJvcHMpXG4gICAgfVxuXG4gICAgLy8gdGhpcyBpcyBzbyB3ZSBjYW4gZXhwb3NlIHRoZSB1bmRlcmx5aW5nIFJlYWN0VGFibGUgdG8gZ2V0IGF0IHRoZSBzb3J0ZWREYXRhIGZvciBzZWxlY3RBbGxcbiAgICBnZXRXcmFwcGVkSW5zdGFuY2UoKSB7XG4gICAgICBpZiAoIXRoaXMud3JhcHBlZEluc3RhbmNlKSBjb25zb2xlLndhcm4oJ1JUU2VsZWN0VGFibGUgLSBObyB3cmFwcGVkIGluc3RhbmNlJylcbiAgICAgIGlmICh0aGlzLndyYXBwZWRJbnN0YW5jZS5nZXRXcmFwcGVkSW5zdGFuY2UpIHJldHVybiB0aGlzLndyYXBwZWRJbnN0YW5jZS5nZXRXcmFwcGVkSW5zdGFuY2UoKVxuICAgICAgZWxzZSByZXR1cm4gdGhpcy53cmFwcGVkSW5zdGFuY2VcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGNvbHVtbnM6IG9yaWdpbmFsQ29scyxcbiAgICAgICAgaXNTZWxlY3RlZCxcbiAgICAgICAgdG9nZ2xlU2VsZWN0aW9uLFxuICAgICAgICB0b2dnbGVBbGwsXG4gICAgICAgIGtleUZpZWxkLFxuICAgICAgICBzZWxlY3RBbGwsXG4gICAgICAgIHNlbGVjdFR5cGUsXG4gICAgICAgIHNlbGVjdFdpZHRoLFxuICAgICAgICBTZWxlY3RBbGxJbnB1dENvbXBvbmVudCxcbiAgICAgICAgU2VsZWN0SW5wdXRDb21wb25lbnQsXG4gICAgICAgIC4uLnJlc3RcbiAgICAgIH0gPSB0aGlzLnByb3BzXG4gICAgICBjb25zdCBzZWxlY3QgPSB7XG4gICAgICAgIGlkOiAnX3NlbGVjdG9yJyxcbiAgICAgICAgYWNjZXNzb3I6ICgpID0+ICd4JywgLy8gdGhpcyB2YWx1ZSBpcyBub3QgaW1wb3J0YW50XG4gICAgICAgIEhlYWRlcjogdGhpcy5oZWFkU2VsZWN0b3IuYmluZCh0aGlzKSxcbiAgICAgICAgQ2VsbDogY2kgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJvd1NlbGVjdG9yLmJpbmQodGhpcykoY2kub3JpZ2luYWwpXG4gICAgICAgIH0sXG4gICAgICAgIHdpZHRoOiBzZWxlY3RXaWR0aCB8fCAzMCxcbiAgICAgICAgZmlsdGVyYWJsZTogZmFsc2UsXG4gICAgICAgIHNvcnRhYmxlOiBmYWxzZSxcbiAgICAgICAgcmVzaXphYmxlOiBmYWxzZSxcbiAgICAgICAgc3R5bGU6IHsgdGV4dEFsaWduOiAnY2VudGVyJyB9LFxuICAgICAgfVxuICAgICAgY29uc3QgY29sdW1ucyA9IFtzZWxlY3QsIC4uLm9yaWdpbmFsQ29sc11cbiAgICAgIGNvbnN0IGV4dHJhID0ge1xuICAgICAgICBjb2x1bW5zLFxuICAgICAgfVxuICAgICAgcmV0dXJuIDxDb21wb25lbnQgey4uLnJlc3R9IHsuLi5leHRyYX0gcmVmPXtyID0+ICh0aGlzLndyYXBwZWRJbnN0YW5jZSA9IHIpfSAvPlxuICAgIH1cbiAgfVxuXG4gIHdyYXBwZXIuZGlzcGxheU5hbWUgPSAnUlRTZWxlY3RUYWJsZSdcbiAgd3JhcHBlci5kZWZhdWx0UHJvcHMgPSB7XG4gICAga2V5RmllbGQ6ICdfaWQnLFxuICAgIGlzU2VsZWN0ZWQ6IGtleSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnTm8gaXNTZWxlY3RlZCBoYW5kbGVyIHByb3ZpZGVkOicsIHsga2V5IH0pXG4gICAgfSxcbiAgICBzZWxlY3RBbGw6IGZhbHNlLFxuICAgIHRvZ2dsZVNlbGVjdGlvbjogKGtleSwgc2hpZnQsIHJvdykgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ05vIHRvZ2dsZVNlbGVjdGlvbiBoYW5kbGVyIHByb3ZpZGVkOicsIHsga2V5LCBzaGlmdCwgcm93IH0pXG4gICAgfSxcbiAgICB0b2dnbGVBbGw6ICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdObyB0b2dnbGVBbGwgaGFuZGxlciBwcm92aWRlZC4nKVxuICAgIH0sXG4gICAgc2VsZWN0VHlwZTogJ2NoZWNrJyxcbiAgICBTZWxlY3RJbnB1dENvbXBvbmVudDogZGVmYXVsdFNlbGVjdElucHV0Q29tcG9uZW50LFxuICAgIFNlbGVjdEFsbElucHV0Q29tcG9uZW50OiBkZWZhdWx0U2VsZWN0SW5wdXRDb21wb25lbnQsXG4gIH1cblxuICByZXR1cm4gd3JhcHBlclxufVxuIl19