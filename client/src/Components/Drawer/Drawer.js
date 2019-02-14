import "components/Drawer/Drawer.css";

import { connect } from "react-redux";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { brushClear } from "actions/data";
import { brushtypeSet, brushIdSet, modeSet } from "actions/ui";
import { formulas } from "formulas/formulas";

class Drawer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            on: false,
            forcePointerEventsOn: false,
            isDrawing: false,
            startClickPos: [0, 0],
            polyPoints: "",
            endClickPos: [0, 0]
        };

        this.vars = {
            mouseDownPos: [0, 0]
        };
    }

    turnOn() {
        this.setState({ on: true });
    }
    turnOff() {
        this.setState({ on: false });
    }

    setDrawer(to) {
        to = to.toLowerCase();

        if (to === "on") {
            this.setState({ on: true, forcePointerEventsOn: false, isDrawing: false });
        } else if (to === "off") {
            this.setState({ on: false, forcePointerEventsOn: false, isDrawing: false });
        } else if (to === "completelyoff") {
            this.setState({ on: false, forcePointerEventsOn: true, isDrawing: false });
        } else if (to === "clear") {
            this.setState({
                on: true,
                isDrawing: false,
                startClickPos: [0, 0],
                polyPoints: "",
                endClickPos: [0, 0]
            });
        } else if (to === "clearshape") {
            this.setState({
                isDrawing: false,
                startClickPos: [0, 0],
                polyPoints: "",
                endClickPos: [0, 0]
            });
        } else if (to === "clearshapedraw") {
            this.setState({
                isDrawing: false,
                startClickPos: [0, 0],
                polyPoints: "",
                endClickPos: [0, 0]
            });
        } else {
            this.setState({
                mode: to,
                isDrawing: false,
                startClickPos: [0, 0],
                polyPoints: "",
                endClickPos: [0, 0]
            });
        }
    }

    drawingEnded(d) {
        this.props.brushIdSet();
        this.props.onDrawingEnd(d);
    }

    drawFreehand(coords) {
        let newPolyPoints = this.state.polyPoints;
        newPolyPoints.push(coords);
        this.setState({ polyPoints: newPolyPoints });
    }
    drawRect(coords) {
        this.setState({ endClickPos: coords });
    }

    _draw(e) {
        //For when shift is pressed outside drawer and then moved in
        if (this._ref) {
            if (e.shiftKey) {
                this._ref.style.cursor = "move";
            } else {
                this._ref.style.cursor = "crosshair";
            }
        }

        if (!this.state.on) return;

        let coords = [e.nativeEvent.offsetX, e.nativeEvent.offsetY];

        if (e.shiftKey && e.buttons === 1) {
            let offset = [
                coords[0] - this.vars.mouseDownPos[0],
                coords[1] - this.vars.mouseDownPos[1]
            ];
            this.vars.mouseDownPos = coords;

            switch (this.props.brushtype) {
                case "freehand":
                    let newPolyPoints = [];
                    for (let p in this.state.polyPoints)
                        newPolyPoints.push([
                            this.state.polyPoints[p][0] + offset[0],
                            this.state.polyPoints[p][1] + offset[1]
                        ]);
                    this.setState({ polyPoints: newPolyPoints });
                    break;
                case "rectangle":
                    let draggedStartPos = [
                        this.state.startClickPos[0] + offset[0],
                        this.state.startClickPos[1] + offset[1]
                    ];
                    let draggedEndPos = [
                        this.state.endClickPos[0] + offset[0],
                        this.state.endClickPos[1] + offset[1]
                    ];
                    this.setState({ startClickPos: draggedStartPos, endClickPos: draggedEndPos });
                    break;
                default:
                    break;
            }
        } else {
            if (!this.state.isDrawing) return;
            switch (this.props.brushtype) {
                case "freehand":
                    this.drawFreehand(coords);
                    break;
                case "rectangle":
                    this.drawRect(coords);
                    break;
                default:
                    console.warn("Warning! Drawer - Unknown draw mode: " + this.props.brushtype);
            }
        }
    }

    _click(e, isDown) {
        if (!this.state.on || e.button !== 0) return;

        let coords = [e.nativeEvent.offsetX, e.nativeEvent.offsetY];
        if (isDown) {
            if (e.shiftKey) {
                this.vars.mouseDownPos = coords;
            } else {
                this.setState({
                    isDrawing: true,
                    startClickPos: coords,
                    endClickPos: coords,
                    polyPoints: []
                });
            }
        } else {
            this.drawingEnded({
                mode: this.props.brushtype,
                range: {
                    x: [this.state.startClickPos[0], this.state.endClickPos[0]].sort(formulas.asc),
                    y: [this.state.startClickPos[1], this.state.endClickPos[1]].sort(formulas.asc)
                },
                polyPoints: this.state.polyPoints
            });
            if (this.state.isDrawing) {
                this.setState({ isDrawing: false, endClickPos: coords });
            }
        }
    }

    update(mode, brushtype) {
        switch (mode) {
            case "zoom":
                //Clear any shapes on the graph
                this.setDrawer("clearshape");
                //And turn drawing off
                this.setDrawer("off");
                break;
            case "select":
                //Turn drawing on
                this.setDrawer("on");
                //And make sure the brush updates
                this.setDrawer(brushtype);
                break;
            case "snap":
                //Clear any shapes on the graph
                this.setDrawer("clearshape");
                //And completely remove all mouse events from the graph
                this.setDrawer("completelyoff");
                break;
        }
    }

    componentDidMount() {
        this.update(this.props.mode, this.props.brushtype);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.mode !== nextProps.mode) this.update(nextProps.mode, nextProps.brushtype);
        //Drawers know to clear their shapes if they're not the last ones drawn on
        if (this.props.windowId !== nextProps.brushId) this.setDrawer("clearshape");
    }

    render() {
        let shape;
        switch (this.props.brushtype) {
            case "rectangle":
                let rectXYWH = [
                    Math.min(this.state.startClickPos[0], this.state.endClickPos[0]),
                    Math.min(this.state.startClickPos[1], this.state.endClickPos[1]),
                    Math.max(
                        this.state.startClickPos[0] - this.state.endClickPos[0],
                        this.state.endClickPos[0] - this.state.startClickPos[0]
                    ),
                    Math.max(
                        this.state.startClickPos[1] - this.state.endClickPos[1],
                        this.state.endClickPos[1] - this.state.startClickPos[1]
                    )
                ];
                shape = (
                    <rect
                        x={rectXYWH[0]}
                        y={rectXYWH[1]}
                        width={rectXYWH[2]}
                        height={rectXYWH[3]}
                        stroke="rgba(255,69,0,1)"
                        strokeWidth="2"
                        fill="rgba(0,0,0,0.1)"
                    />
                );
                break;
            case "freehand":
                let polyPointsString = "";
                for (let p in this.state.polyPoints)
                    polyPointsString +=
                        " " + this.state.polyPoints[p][0] + "," + this.state.polyPoints[p][1];
                shape = (
                    <polygon
                        points={polyPointsString}
                        stroke="rgba(255,69,0,1)"
                        strokeWidth="2"
                        fill="rgba(0,0,0,0.1)"
                    />
                );
                break;
            default:
                break;
        }

        let drawerStyle = { pointerEvents: this.state.on ? "inherit" : "none" };
        if (this.state.forcePointerEventsOn) drawerStyle = { pointerEvents: "inherit" };
        return (
            <div
                className="Drawer"
                ref={r => {
                    this._ref = r;
                }}
                style={drawerStyle}
                onMouseDown={e => {
                    this._click(e, true);
                }}
                onMouseUp={e => {
                    this._click(e, false);
                }}
                onMouseMove={e => {
                    this._draw(e);
                }}
            >
                <svg width="100%" height="100%">
                    {shape}
                </svg>
            </div>
        );
    }
}

// validation
Drawer.propTypes = {
    mode: PropTypes.string.isRequired,
    brushtype: PropTypes.string.isRequired,
    brushClear: PropTypes.func.isRequired,
    brushtypeSet: PropTypes.func.isRequired,
    brushIdSet: PropTypes.func.isRequired,
    brushId: PropTypes.number.isRequired,
    modeSet: PropTypes.func.isRequired,

    windowId: PropTypes.number.isRequired,
    onDrawingEnd: PropTypes.func.isRequired
};

// redux store
const mapStateToProps = state => {
    const ui = state.ui;
    return {
        mode: ui.get("mode"),
        brushtype: ui.getIn(["brush", "type"]),
        brushId: ui.getIn(["brush", "id"])
    };
};
const mapDispatchToProps = dispatch => ({
    brushClear: () => dispatch(brushClear()),
    brushtypeSet: t => dispatch(brushtypeSet(t)),
    brushIdSet: t => dispatch(brushIdSet(t)),
    modeSet: m => dispatch(modeSet())
});

function mergeProps(propsFromState, propsFromDispatch, ownProps) {
    return {
        mode: propsFromState.mode,
        brushtype: propsFromState.brushtype,
        brushId: propsFromState.brushId,
        windowId: ownProps.windowId,
        onDrawingEnd: ownProps.onDrawingEnd,
        brushClear: () => {
            propsFromDispatch.brushClear();
        },
        brushtypeSet: brushtype => {
            propsFromDispatch.brushtypeSet(brushtype);
        },
        brushIdSet: () => {
            propsFromDispatch.brushIdSet(ownProps.windowId);
        },
        modeSet: mode => {
            propsFromDispatch.modeSet(mode);
        }
    };
}

export { Drawer };
export default connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
)(Drawer);
