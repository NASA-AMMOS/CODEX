'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DiagramWidget = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _DiagramModel = require('../DiagramModel');

var _Common = require('../Common');

var _actions = require('./actions');

var _LinkLayerWidget = require('./LinkLayerWidget');

var _NodeLayerWidget = require('./NodeLayerWidget');

var _Toolkit = require('../Toolkit');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEFAULT_ACTIONS = {
  deleteItems: true,
  selectItems: true,
  moveItems: true,
  multiselect: true,
  multiselectDrag: true,
  canvasDrag: true,
  zoom: true,
  copy: true,
  paste: true,
  selectAll: true,
  deselectAll: true
};

var DiagramWidget = exports.DiagramWidget = function (_React$Component) {
  _inherits(DiagramWidget, _React$Component);

  _createClass(DiagramWidget, [{
    key: 'getActions',
    value: function getActions() {
      if (this.props.actions === null) {
        return {};
      }
      return _extends({}, DEFAULT_ACTIONS, this.props.actions || {});
    }
  }]);

  function DiagramWidget(props) {
    _classCallCheck(this, DiagramWidget);

    var _this = _possibleConstructorReturn(this, (DiagramWidget.__proto__ || Object.getPrototypeOf(DiagramWidget)).call(this, props));

    _this.state = {
      action: null,
      actionType: 'unknown',
      renderedNodes: false,
      windowListener: null,
      clipboard: null
    };
    return _this;
  }

  _createClass(DiagramWidget, [{
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.props.diagramEngine.setCanvas(null);
      window.removeEventListener('keydown', this.state.windowListener);
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps) {
      if (this.props.diagramEngine.diagramModel.id !== nextProps.diagramEngine.diagramModel.id) {
        this.setState({ renderedNodes: false });
        nextProps.diagramEngine.diagramModel.rendered = true;
      }
      if (!nextProps.diagramEngine.diagramModel.rendered) {
        this.setState({ renderedNodes: false });
        nextProps.diagramEngine.diagramModel.rendered = true;
      }
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      if (!this.state.renderedNodes) {
        this.setState({
          renderedNodes: true
        });
      }
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      var _props = this.props,
          diagramEngine = _props.diagramEngine,
          onChange = _props.onChange;

      diagramEngine.setCanvas(this.refs['canvas']);
      diagramEngine.setForceUpdate(this.forceUpdate.bind(this));

      var _getActions = this.getActions(),
          selectAll = _getActions.selectAll,
          deselectAll = _getActions.deselectAll,
          copy = _getActions.copy,
          paste = _getActions.paste,
          deleteItems = _getActions.deleteItems;

      // Add a keyboard listener


      this.setState({
        renderedNodes: true,
        windowListener: window.addEventListener('keydown', function (event) {
          var selectedItems = diagramEngine.getDiagramModel().getSelectedItems();
          var ctrl = event.metaKey || event.ctrlKey;

          // Select all
          if (event.keyCode === 65 && ctrl && selectAll) {
            _this2.selectAll(true);
            event.preventDefault();
            event.stopPropagation();
          }

          // Deselect all
          if (event.keyCode === 68 && ctrl && deselectAll) {
            _this2.selectAll(false);
            event.preventDefault();
            event.stopPropagation();
          }

          // Copy selected
          if (event.keyCode === 67 && ctrl && selectedItems.length && copy) {
            _this2.copySelectedItems(selectedItems);
          }

          // Paste from clipboard
          if (event.keyCode === 86 && ctrl && _this2.state.clipboard && paste) {
            _this2.pasteSelectedItems(selectedItems);
          }

          // Delete all selected
          if ([8, 46].indexOf(event.keyCode) !== -1 && selectedItems.length && deleteItems) {
            selectedItems.forEach(function (element) {
              element.remove();
            });

            onChange(diagramEngine.getDiagramModel().serializeDiagram(), { type: 'items-deleted', items: selectedItems });
            _this2.forceUpdate();
          }
        })
      });
      window.focus();
    }
  }, {
    key: 'copySelectedItems',
    value: function copySelectedItems(selectedItems) {
      var _props2 = this.props,
          diagramEngine = _props2.diagramEngine,
          onChange = _props2.onChange;

      // Cannot copy anything without a node, so ensure some are selected

      var nodes = _lodash2.default.filter(selectedItems, function (item) {
        return item instanceof _Common.NodeModel;
      });

      // If there are no nodes, do nothing
      if (!nodes.length) {
        return;
      }

      // Deserialize the existing diagramModel
      var flatModel = diagramEngine.diagramModel.serializeDiagram();

      // Create a new diagramModel to hold clipboard data
      var newModel = new _DiagramModel.DiagramModel();

      // Create map of GUIDs for replacement
      var gMap = {};

      // Track what was copied to send back to onChange
      var copied = [];

      // Iterate the nodes
      _lodash2.default.forEach(flatModel.nodes, function (node) {
        if (node.selected) {
          // Get the node instance, updated the GUID and deserialize
          var nodeOb = diagramEngine.getInstanceFactory(node._class).getInstance();
          node.id = gMap[node.id] = _Toolkit.Toolkit.UID();
          nodeOb.deSerialize(node);

          // Deserialize ports
          _lodash2.default.forEach(node.ports, function (port) {
            var portOb = diagramEngine.getInstanceFactory(port._class).getInstance();
            port.id = gMap[port.id] = _Toolkit.Toolkit.UID();
            port.links = [];
            portOb.deSerialize(port);
            nodeOb.addPort(portOb);
          });

          nodeOb.setSelected(true);
          newModel.addNode(nodeOb);
          copied.push(nodeOb);
        }
      });

      // Iterate the links
      _lodash2.default.forEach(flatModel.links, function (link) {
        if (link.selected) {
          var linkOb = diagramEngine.getInstanceFactory(link._class).getInstance();
          link.id = gMap[link.id] = _Toolkit.Toolkit.UID();

          // Change point GUIDs and set selected
          link.points.forEach(function (point) {
            point.id = _Toolkit.Toolkit.UID();
            point.selected = true;
          });

          // Deserialize the link
          linkOb.deSerialize(link);

          // Only add the target if the node was copied and the target exists
          if (gMap[link.target] && gMap[link.source]) {
            linkOb.setTargetPort(newModel.getNode(gMap[link.target]).getPortFromID(gMap[link.targetPort]));
          }

          // Add the source if it exists
          if (gMap[link.source]) {
            linkOb.setSourcePort(newModel.getNode(gMap[link.source]).getPortFromID(gMap[link.sourcePort]));
            newModel.addLink(linkOb);
            copied.push(linkOb);
          }
        }
      });

      this.setState({ clipboard: newModel });
      onChange(diagramEngine.getDiagramModel().serializeDiagram(), { type: 'items-copied', items: copied });
    }
  }, {
    key: 'pasteSelectedItems',
    value: function pasteSelectedItems() {
      var _props3 = this.props,
          diagramEngine = _props3.diagramEngine,
          onChange = _props3.onChange;
      var clipboard = this.state.clipboard;

      var pasted = [];

      // Clear existing selections
      diagramEngine.diagramModel.clearSelection();
      this.forceUpdate();

      // Add the nodes to the existing diagramModel
      _lodash2.default.forEach(clipboard.nodes, function (node) {
        diagramEngine.diagramModel.addNode(node);
        pasted.push(node);
      });
      this.forceUpdate();

      // Add links to the existing diagramModel
      _lodash2.default.forEach(clipboard.links, function (link) {
        diagramEngine.diagramModel.addLink(link);
        pasted.push(link);
      });
      this.setState({ clipboard: null });

      onChange(diagramEngine.getDiagramModel().serializeDiagram(), { type: 'items-pasted', items: pasted });
    }
  }, {
    key: 'selectAll',
    value: function selectAll(select) {
      var _props4 = this.props,
          diagramEngine = _props4.diagramEngine,
          onChange = _props4.onChange;
      var _diagramEngine$diagra = diagramEngine.diagramModel,
          nodes = _diagramEngine$diagra.nodes,
          links = _diagramEngine$diagra.links;

      var selected = [];

      // Select all nodes
      _lodash2.default.forEach(nodes, function (node) {
        node.setSelected(select);
        selected.push(node);
      });

      // Select all links
      _lodash2.default.forEach(links, function (link) {
        link.setSelected(select);
        // Select all points
        link.points.forEach(function (point) {
          return point.setSelected(select);
        });
        selected.push(link);
      });

      // Repaint
      this.forceUpdate();

      var type = select ? 'items-select-all' : 'items-deselect-all';
      onChange(diagramEngine.getDiagramModel().serializeDiagram(), { type: type, items: selected });
    }

    /**
     * Gets a model and element under the mouse cursor
     */

  }, {
    key: 'getMouseElement',
    value: function getMouseElement(event) {
      var diagramModel = this.props.diagramEngine.diagramModel;
      var target = event.target;

      // Look for a port

      var element = target.closest('.port[data-name]');
      if (element) {
        var nodeElement = target.closest('.node[data-nodeid]');
        return {
          model: diagramModel.getNode(nodeElement.getAttribute('data-nodeid')).getPort(element.getAttribute('data-name')),
          element: element
        };
      }

      // Look for a point
      element = target.closest('.point[data-id]');
      if (element) {
        return {
          model: diagramModel.getLink(element.getAttribute('data-linkid')).getPointModel(element.getAttribute('data-id')),
          element: element
        };
      }

      // Look for a link
      element = target.closest('[data-linkid]');
      if (element) {
        return {
          model: diagramModel.getLink(element.getAttribute('data-linkid')),
          element: element
        };
      }

      // Look for a node
      element = target.closest('.node[data-nodeid]');
      if (element) {
        return {
          model: diagramModel.getNode(element.getAttribute('data-nodeid')),
          element: element
        };
      }

      return null;
    }
  }, {
    key: 'onWheel',
    value: function onWheel(event) {
      var diagramEngine = this.props.diagramEngine;

      var actions = this.getActions();
      if (!actions.zoom) {
        return;
      }
      var diagramModel = diagramEngine.getDiagramModel();
      event.preventDefault();
      event.stopPropagation();
      diagramModel.setZoomLevel(diagramModel.getZoomLevel() + event.deltaY / 60);
      diagramEngine.enableRepaintEntities([]);
      this.forceUpdate();
    }
  }, {
    key: 'onMouseMove',
    value: function onMouseMove(event) {
      var _this3 = this;

      var diagramEngine = this.props.diagramEngine;
      var _state = this.state,
          action = _state.action,
          currentActionType = _state.actionType;

      var diagramModel = diagramEngine.getDiagramModel();

      var _refs$canvas$getBound = this.refs.canvas.getBoundingClientRect(),
          left = _refs$canvas$getBound.left,
          top = _refs$canvas$getBound.top;

      var _getActions2 = this.getActions(),
          multiselectDrag = _getActions2.multiselectDrag,
          canvasDrag = _getActions2.canvasDrag,
          moveItems = _getActions2.moveItems;

      // Select items so draw a bounding box


      if (action instanceof _actions.SelectingAction && multiselectDrag) {
        var relative = diagramEngine.getRelativePoint(event.pageX, event.pageY);

        _lodash2.default.forEach(diagramModel.getNodes(), function (node) {
          if (action.containsElement(node.x, node.y, diagramModel)) {
            node.setSelected(true);
          }
        });

        _lodash2.default.forEach(diagramModel.getLinks(), function (link) {
          var allSelected = true;
          link.points.forEach(function (point) {
            if (action.containsElement(point.x, point.y, diagramModel)) {
              point.setSelected(true);
            } else {
              allSelected = false;
            }
          });

          if (allSelected) {
            link.setSelected(true);
          }
        });

        action.mouseX2 = relative.x;
        action.mouseY2 = relative.y;
        this.setState({ action: action, actionType: 'items-drag-selected' });
      } else if (action instanceof _actions.MoveItemsAction && moveItems) {
        // Translate the items on the canvas
        action.selectionModels.forEach(function (model) {
          if (model.model instanceof _Common.NodeModel || model.model instanceof _Common.PointModel) {
            model.model.x = model.initialX + (event.pageX - _this3.state.action.mouseX) / (diagramModel.getZoomLevel() / 100);
            model.model.y = model.initialY + (event.pageY - _this3.state.action.mouseY) / (diagramModel.getZoomLevel() / 100);
          }
        });

        // Determine actionType, do not override some mouse down
        var disallowed = ['link-created'];
        var actionType = disallowed.indexOf(currentActionType) === -1 ? 'items-moved' : currentActionType;
        if (action.selectionModels.length === 1 && action.selectionModels[0].model instanceof _Common.NodeModel) {
          actionType = 'node-moved';
        }

        this.setState({ actionType: actionType });
      } else if (this.state.action instanceof _actions.MoveCanvasAction && canvasDrag) {
        // Translate the actual canvas
        diagramModel.setOffset(action.initialOffsetX + (event.pageX - left - this.state.action.mouseX) / (diagramModel.getZoomLevel() / 100), action.initialOffsetY + (event.pageY - top - this.state.action.mouseY) / (diagramModel.getZoomLevel() / 100));
        this.setState({ action: action, actionType: 'canvas-drag' });
      }
    }
  }, {
    key: 'onMouseDown',
    value: function onMouseDown(event) {
      var diagramEngine = this.props.diagramEngine;

      var diagramModel = diagramEngine.getDiagramModel();
      var model = this.getMouseElement(event);

      var _getActions3 = this.getActions(),
          selectItems = _getActions3.selectItems,
          multiselect = _getActions3.multiselect,
          multiselectDrag = _getActions3.multiselectDrag;

      diagramEngine.clearRepaintEntities();

      // Check if this is the canvas
      if (model === null) {
        // Check for a multiple selection
        if (event.shiftKey && multiselectDrag) {
          var relative = diagramEngine.getRelativePoint(event.pageX, event.pageY);
          this.setState({
            action: new _actions.SelectingAction(relative.x, relative.y),
            actionType: 'canvas-shift-select'
          });
        } else {
          // This is a drag canvas event
          var _relative = diagramEngine.getRelativePoint(event.pageX, event.pageY);
          diagramModel.clearSelection();

          this.setState({
            action: new _actions.MoveCanvasAction(_relative.x, _relative.y, diagramModel),
            actionType: 'canvas-click'
          });
        }
      } else if (model.model instanceof _Common.PortModel) {
        var linkInstanceFactory = diagramEngine.linkInstanceFactory;

        // This is a port element, we want to drag a link

        var _relative2 = diagramEngine.getRelativeMousePoint(event);
        var link = linkInstanceFactory && linkInstanceFactory.getInstance() || new _Common.LinkModel();
        link.setSourcePort(model.model);

        link.getFirstPoint().updateLocation(_relative2);
        link.getLastPoint().updateLocation(_relative2);

        diagramModel.clearSelection();
        link.getLastPoint().setSelected(true);
        diagramModel.addLink(link);

        this.setState({
          action: new _actions.MoveItemsAction(event.pageX, event.pageY, diagramEngine),
          actionType: 'link-created'
        });
      } else if (selectItems) {
        // It's a direct click selection
        var deselect = false;
        var isSelected = model.model.isSelected();

        // Clear selections if this wasn't a shift key or a click on a selected element
        if (!event.shiftKey && !isSelected || !multiselect && !isSelected) {
          diagramModel.clearSelection(false, true);
        }

        // Is this a deselect or select?
        if (event.shiftKey && model.model.isSelected()) {
          model.model.setSelected(false);
          deselect = true;
        } else {
          model.model.setSelected(true);
          diagramModel.nodeSelected(model);
        }

        // Get the selected items and filter out point model
        var selected = diagramEngine.getDiagramModel().getSelectedItems();
        var filtered = _lodash2.default.filter(selected, function (item) {
          return !(item instanceof _Common.PointModel);
        });
        var isLink = model.model instanceof _Common.LinkModel;
        var isNode = model.model instanceof _Common.NodeModel;
        var isPoint = model.model instanceof _Common.PointModel;

        // Determine action type
        var actionType = 'items-selected';
        if (deselect && isLink) {
          actionType = 'link-deselected';
        } else if (deselect && isNode) {
          actionType = 'node-deselected';
        } else if (deselect && isPoint) {
          actionType = 'point-deselected';
        } else if ((selected.length === 1 || selected.length === 2 && filtered.length === 1) && isLink) {
          actionType = 'link-selected';
        } else if (selected.length === 1 && isNode) {
          actionType = 'node-selected';
        } else if (selected.length === 1 && isPoint) {
          actionType = 'point-selected';
        }

        this.setState({
          action: new _actions.MoveItemsAction(event.pageX, event.pageY, diagramEngine),
          actionType: actionType
        });
      }
    }
  }, {
    key: 'onMouseUp',
    value: function onMouseUp(event) {
      var _props5 = this.props,
          diagramEngine = _props5.diagramEngine,
          onChange = _props5.onChange;
      var _state2 = this.state,
          action = _state2.action,
          actionType = _state2.actionType;

      var element = this.getMouseElement(event);
      var actionOutput = {
        type: actionType
      };

      if (element === null) {
        // No element, this is a canvas event
        // actionOutput.type = 'canvas-event';
        actionOutput.event = event;
      } else if (action instanceof _actions.MoveItemsAction) {
        // Add the node model to the output
        actionOutput.model = element.model;

        // Check if we going to connect a link to something
        action.selectionModels.forEach(function (model) {
          // Only care about points connecting to things or being created
          if (model.model instanceof _Common.PointModel) {
            // Check if a point was created
            if (element.element.tagName === 'circle' && actionOutput.type !== 'link-created') {
              actionOutput.type = 'point-created';
            }

            if (element.model instanceof _Common.PortModel) {
              // Connect the link
              model.model.getLink().setTargetPort(element.model);

              // Link was connected to a port, update the output
              actionOutput.type = 'link-connected';
              delete actionOutput.model;
              actionOutput.linkModel = model.model.getLink();
              actionOutput.portModel = element.model;
            }
          }
        });
      }

      var attachItems = ['items-selected', 'items-drag-selected', 'items-moved', 'node-deselected', 'link-deselected'];
      if (attachItems.indexOf(actionType) !== -1) {
        actionOutput.items = _lodash2.default.filter(diagramEngine.getDiagramModel().getSelectedItems(), function (item) {
          return !(item instanceof _Common.PointModel);
        });
      }
      if (actionType === 'items-moved') {
        delete actionOutput.model;
      }

      diagramEngine.clearRepaintEntities();
      if (actionOutput.type !== 'unknown') {
        onChange(diagramEngine.getDiagramModel().serializeDiagram(), actionOutput);
      }
      this.setState({ action: null, actionType: 'unknown' });
    }
  }, {
    key: 'renderLinkLayerWidget',
    value: function renderLinkLayerWidget() {
      var _this4 = this;

      var diagramEngine = this.props.diagramEngine;

      var diagramModel = diagramEngine.getDiagramModel();

      if (!this.state.renderedNodes) {
        return null;
      }

      return _react2.default.createElement(_LinkLayerWidget.LinkLayerWidget, {
        diagramEngine: diagramEngine,
        pointAdded: function pointAdded(point, event) {
          event.stopPropagation();
          diagramModel.clearSelection(point);
          _this4.setState({
            action: new _actions.MoveItemsAction(event.pageX, event.pageY, diagramEngine)
          });
        }
      });
    }
  }, {
    key: 'renderSelector',
    value: function renderSelector() {
      var action = this.state.action;

      var offsetWidth = this.refs.canvas && this.refs.canvas.offsetWidth || window.innerWidth;
      var offsetHeight = this.refs.canvas && this.refs.canvas.offsetHeight || window.innerHeight;

      if (!(action instanceof _actions.SelectingAction)) {
        return null;
      }

      var style = {
        width: Math.abs(action.mouseX2 - action.mouseX),
        height: Math.abs(action.mouseY2 - action.mouseY)
      };

      if (action.mouseX2 - action.mouseX < 0) {
        style.right = offsetWidth - action.mouseX;
      } else {
        style.left = action.mouseX;
      }

      if (action.mouseY2 - action.mouseY < 0) {
        style.bottom = offsetHeight - action.mouseY;
      } else {
        style.top = action.mouseY;
      }

      return _react2.default.createElement('div', {
        className: 'selector',
        style: style
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var diagramEngine = this.props.diagramEngine;


      return _react2.default.createElement(
        'div',
        {
          ref: 'canvas',
          className: 'react-js-diagrams-canvas',
          onWheel: this.onWheel.bind(this),
          onMouseMove: this.onMouseMove.bind(this),
          onMouseDown: this.onMouseDown.bind(this),
          onMouseUp: this.onMouseUp.bind(this)
        },
        _react2.default.createElement(_NodeLayerWidget.NodeLayerWidget, { diagramEngine: diagramEngine }),
        this.renderLinkLayerWidget(),
        this.renderSelector()
      );
    }
  }]);

  return DiagramWidget;
}(_react2.default.Component);

DiagramWidget.defaultProps = {
  onChange: function onChange() {},
  actions: DEFAULT_ACTIONS
};