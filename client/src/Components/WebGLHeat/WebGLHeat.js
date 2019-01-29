import React, { Component } from "react";
import "./WebGLHeat.css";

import { formulas } from "../../formulas/formulas";
import { manager } from "../../Components/RWindowManager/manager/manager";

import { webglheatmap } from "./webgl-heatmap";

// redux
import { connect } from "react-redux";
import { getFeatures } from "../../../selectors/data";

class WebGLHeat extends Component {
    constructor(props) {
        super(props);

        this.animate = this.animate.bind(this);

        this.masks = Object.assign({}, this.props.masks);
        for (let m in this.masks) {
            this.masks[m].heatmaps = [];
            this.masks[m].h = 0;
            this.masks[m].on = true;
            this.masks[m].canvases = [];
            this.masks[m].totalHits = 0;
            this.masks[m].rowHits = [];
            this.masks[m].rowHitsZoom = [];
            this.masks[m].columnHits = [];
            this.masks[m].rowsZoom = 0;
            this.masks[m].results = {};
            this.masks[m].featureIntensitiesByRow = [];
        }

        this.canvas = [];
        this.mouseIsDown = false;
        this.mouseX;
        this.lastMoveLeft;
        this.columnIntensity = [];
        this.currentDrawRow = 0;

        this.sortMask = 0;
        this.sortByRow = false;

        this.initialDrawHappened = false;
        //console.log( this.props.data.toJS() );
        this.dataWidth = this.props.data.get(0).size;
        this.dataLength = this.props.data.size - 1; //-1 for header

        this.featureListRaw = getFeatures(this.props.data).toJS();
        this.featureList = this.featureListRaw;
        this.featureMapping = []; //column 0 maps to feature column 0, 1 -> 1 and so on. See this.featuremap function
        for (let i = 0; i < this.featureList.length; i++) {
            this.featureMapping.push(i);
        }

        this.rowMapping = [];
        for (let i = 0; i < this.dataLength; i++) {
            this.rowMapping.push(i);
        }
    }

    init() {
        this.scanning = false;
        this.width = ~~this.ref.getBoundingClientRect().width + 5;
        this.currentWidth = this.width;

        this.pixelBinSize = Math.ceil((this.dataLength * 2) / this.currentWidth);
        this.initialPixelBinSize = this.pixelBinSize;
        this.oldPixelBinSize = this.pixelBinSize;

        this.features = this.featureList.length; //rows
        this.featureHeight = 22; //pixels
        this.featureGap = 2; //pixels

        this.height = this.features * this.featureHeight + (this.features - 1) * this.featureGap;

        this.ref.style.width = this.width + "px";
        this.ref.style.height = this.height + "px";
        for (let m in this.masks) {
            this.masks[m].canvases[0].width = this.width;
            //this.masks[m].canvases[1].width = this.width;
            this.masks[m].canvases[0].style.opacity = this.masks[m].opacity;
            //this.masks[m].canvases[1].style.opacity = 0;

            this.masks[m].rowHits = new Array(this.dataWidth).fill(0);
            this.masks[m].rowHitsZoom = new Array(this.dataWidth).fill(0);
        }

        this.ref.style.borderTop = this.featureGap + "px solid #0F0F0F";
        //this.canvas[1].style.marginTop = this.featureGap + 'px';

        this.animationFrame = null;

        this.rPts = [];

        this.binSize = 2; //1 doesn't work
        this.binsPerFrame = parseInt(Math.max(10, 750000 / this.pixelBinSize), 10);
        this.startRow = 1;
        this.currentBin = 0; //First row is header
        this.binOffset = 0; //first bin corresponds binOffset row
        this.zoomLevel = 0;
        this.zoomStates = [];

        this.columnIntensity = new Array(this.dataWidth).fill(0);

        this.hidingEmptyRows = false;
    }

    //Maps default feature column numbers to other feature column numbers
    // To allow for sorting of features without modifying existing code much.
    featureMap(r) {
        return this.featureMapping[r];
    }
    rowMap(r) {
        return this.rowMapping[r];
    }
    /**
     * Orders heatmap canvases (via zIndex) based on maskOrder
     * @param {array} maskOrder - ordered string array of mask names (last on top)
     */
    setMaskOrder(maskOrder) {
        for (let i = 0; i < maskOrder.length; i++)
            for (let m in this.masks)
                if (this.masks[m].name === maskOrder[i])
                    this.masks[m].canvases[0].style.zIndex = maskOrder.length - i;
    }

    refreshHeight() {
        this.features = this.featureList.length; //rows
        this.height = this.features * this.featureHeight + (this.features - 1) * this.featureGap;
        this.ref.style.height = this.height + "px";
    }
    setFeatureList(fl) {
        this.featureList = fl;
        this.featureMapping = [];

        for (let i in this.featureListRaw) {
            this.featureMapping.push(this.featureListRaw.indexOf(this.featureList[i]));
        }

        this.refreshHeight();
        this.recalculateMasks();
    }
    sortByRows(sortMask) {
        this.sortMask = sortMask;
        this.sortByRow = !this.sortByRow;
        this.sortRows();
    }

    /**
     * Updates rowMapping based on whatever mask sortMask is set to and recalculates
     */
    sortRows() {
        //Make row map
        let countedIntensities = [];
        let mr;
        for (let r = 1; r < this.dataLength; r++) {
            //each row
            countedIntensities[r] = 0;
            for (let v = 0; v < this.dataWidth; v++) {
                //each value
                mr = this.masks[this.sortMask].masker(this.props.data.getIn([r, v]), v);
                if (mr > 0) {
                    countedIntensities[r]++;
                }
            }
        }

        //Save countedIntensities indices in a new object for faster lookup
        let indexedIntensities = {};
        for (let i = 1; i < countedIntensities.length; i++) {
            //1 because index 0 of countedInt is empty
            if (indexedIntensities.hasOwnProperty(countedIntensities[i])) {
                indexedIntensities[countedIntensities[i]].push(i);
            } else {
                indexedIntensities[countedIntensities[i]] = [i];
            }
        }

        //Now create the sortMap
        let sortMap = [];
        let ik = Object.keys(indexedIntensities).reverse();
        for (let i = 0; i < ik.length; i++) {
            for (let j in indexedIntensities[ik[i]]) {
                sortMap.push(indexedIntensities[ik[i]][j]);
            }
        }

        //Update our row map
        this.rowMapping = sortMap;
        this.fullRowMapping = Object.assign([], this.rowMapping);
        //Now recalculate so our new row map goes into effect
        this.recalculateMasks();
    }

    /**
     *
     * @param {bool} hide
     * @param {object} mask - a mask object
     */
    hideEmptyRows(hide, mask) {
        if (hide) {
            this.hidingEmptyRows = true;
            //Make row map
            let countedIntensities = [];
            let mr;
            for (let r = 1; r < this.dataLength; r++) {
                //each row
                countedIntensities[r] = 0;
                for (let v = 0; v < this.dataWidth; v++) {
                    //each value
                    mr = mask.masker(this.props.data.getIn([r, v]), v);
                    if (mr > 0) {
                        countedIntensities[r]++;
                    }
                }
            }

            //Save countedIntensities indices in a new object for faster lookup
            let indexedIntensities = {};
            for (let i = 1; i < countedIntensities.length; i++) {
                //1 because index 0 of countedInt is empty
                if (indexedIntensities.hasOwnProperty(countedIntensities[i])) {
                    indexedIntensities[countedIntensities[i]].push(i);
                } else {
                    indexedIntensities[countedIntensities[i]] = [i];
                }
            }

            //Get only the rows with 0 hits
            let emptyRows = indexedIntensities[0];

            this.fullRowMapping = Object.assign([], this.rowMapping);
            if (emptyRows !== undefined) {
                //Perhaps we've no empty rows
                //Now strip those 0 hit rows from our rowMapping
                for (let i = this.rowMapping.length - 1; i >= 0; i--) {
                    if (emptyRows.indexOf(this.rowMapping[i]) !== -1) this.rowMapping.splice(i, 1);
                }
            }
            //Now recalculate so our new row map goes into effect
            this.recalculateMasks();
        } else {
            this.hidingEmptyRows = false;
            console.log(this.rowMapping.length);
            this.rowMapping = this.fullRowMapping;
            console.log(this.rowMapping.length);
            //Now recalculate so our new row map goes into effect
            this.recalculateMasks();
        }
    }

    //Old sort that temporarily pushed all hits to the left and broke row order
    sortRowsOLD() {
        //Find our mask row's sort map
        for (let m in this.masks)
            this.masks[m].heatmaps[this.masks[m].h].clearRect(0, 0, this.width, this.height);
        for (let r = 0; r < this.dataWidth; r++) {
            //Each row
            let rm = this.featureMap(r);
            let sortMap = formulas.getSortMap(
                Object.assign([], this.masks[this.sortMask].featureIntensitiesByRow[rm])
            ).sortIndices;

            for (let m in this.masks) {
                let rowPts = [];
                for (let sm = 0; sm < sortMap.length; sm++) {
                    //Each bin
                    let curY = 0;
                    for (let i = 0; i < this.featureHeight / this.binSize; i++) {
                        //Each bin height
                        rowPts.push({
                            x: sm * this.binSize,
                            y: curY + rm * (this.featureHeight + this.featureGap),
                            size: this.binSize,
                            intensity: this.masks[m].featureIntensitiesByRow[rm][sortMap[sm]]
                        });
                        curY += this.binSize;
                    }
                }
                //console.log( rm, m, rowPts );
                //this.masks[m].heatmaps[this.masks[m].h].clearRect( 0, (rm*(this.featureHeight+this.featureGap)), this.width, this.featureHeight + this.featureGap );
                this.masks[m].heatmaps[this.masks[m].h].addPoints(rowPts);
                this.masks[m].heatmaps[this.masks[m].h].update();
                this.masks[m].heatmaps[this.masks[m].h].display();
            }
        }
    }

    getFullMaskFeatureData(maskObj, featureName) {
        let fullData = {};
        let rowNumber = this.props.data.get(0).indexOf(featureName);
        if (rowNumber !== -1) {
            for (let r = 1; r < this.props.data.length; r++) {
                if (maskObj.masker(this.props.data.getIn([r, rowNumber]))) {
                    if (fullData.hasOwnProperty(this.props.data.getIn([r, rowNumber])))
                        fullData[this.props.data.getIn([r, rowNumber])]++;
                    else fullData[this.props.data.getIn([r, rowNumber])] = 0;
                }
            }
        } else {
            console.warn("Warning - Feature [" + featureName + "] not found.");
        }
        return fullData;
    }

    getMaskAtRow(binNumber, mask) {
        let rowNumber = (binNumber + this.binOffset) * this.pixelBinSize + 1; // +1 to ignore csv header
        let rowPts = [];
        let v = 0; //value
        let mr = 0; //masker result
        let rowIntensity = 0;
        let intensity = 0;
        let curY = 0;
        let hasData = typeof this.masks[mask].maskerData === "function";

        if (this.props.data.has(rowNumber)) {
            this.masks[mask].rowsZoom += this.pixelBinSize;
            let rm;
            for (let r = 0; r < this.props.data.get(rowNumber).length; r++) {
                rm = this.featureMap(r);
                if (hasData) this.masks[mask].maskerData(rm);
                v = 0;
                for (let p = 0; p < this.pixelBinSize; p++) {
                    if (this.props.data.get(rowNumber + p)) {
                        //if the data doesn't fit neatly into a bin
                        mr = this.masks[mask].masker(
                            this.props.data.getIn([rowNumber + p, rm]),
                            rm
                        );
                        if (mr > 0) {
                            v += mr / this.pixelBinSize;
                            if (!this.initialDrawHappened) this.masks[mask].rowHits[rm]++;
                            this.masks[mask].rowHitsZoom[rm]++;
                        }
                    }
                }
                intensity = v;
                rowIntensity += intensity;
                this.columnIntensity[rm] += intensity / this.dataLength;
                for (let i = 0; i < this.featureHeight / this.binSize; i++) {
                    rowPts.push({
                        x: binNumber * this.binSize,
                        y: curY,
                        size: this.binSize,
                        intensity: intensity
                    });
                    curY += this.binSize;
                }
                for (let i = 0; i < this.featureGap / this.binSize; i++) {
                    rowPts.push({
                        x: binNumber * this.binSize,
                        y: curY,
                        size: this.binSize,
                        intensity: 100000000
                    });
                    curY += this.binSize;
                }
            }
        }
        return rowPts;
    }

    getMaskAtRowByRow(binNumber, mask) {
        let rowNumber = this.startRow + binNumber * this.pixelBinSize;
        //let rowNumber = parseInt( ( binNumber + ( this.binOffset / this.binSize ) ) * this.pixelBinSize, 10 ) + 1; // +1 to ignore csv header
        //let rowNumber = ( binNumber + ( ( this.binOffset * this.pixelBinSize ) / this.binSize ) ) + 1; // +1 to ignore csv header
        //let rowNumber = parseInt( ( ( this.binOffset + binNumber ) * this.pixelBinSize ) / this.binSize, 10 ) + 1; // +1 to ignore csv header

        let rowPts = [];
        let v = 0; //value
        let mr = 0; //masker result
        let rowIntensity = 0;
        let intensity = 0;
        let curY = 0;
        let hasData = typeof this.masks[mask].maskerData === "function";
        let r = this.currentDrawRow;

        if (this.props.data.has(rowNumber)) {
            this.masks[mask].rowsZoom += this.pixelBinSize;
            let rm;
            let vm;

            rm = this.featureMap(r);
            if (rm === -1) return rowPts;

            if (!this.masks[mask].featureIntensitiesByRow[r])
                this.masks[mask].featureIntensitiesByRow[r] = [];

            if (hasData) this.masks[mask].maskerData(rm);
            v = 0;
            for (let p = 0; p < this.pixelBinSize; p++) {
                vm = this.rowMap(rowNumber + p);
                if (vm === -1) break;

                if (this.props.data.has(vm)) {
                    //if the data doesn't fit neatly into a bin
                    mr = this.masks[mask].masker(this.props.data.getIn([vm, rm]), rm);
                    if (mr > 0) {
                        v += mr / this.pixelBinSize;
                        if (!this.initialDrawHappened) this.masks[mask].rowHits[rm]++;
                        this.masks[mask].rowHitsZoom[rm]++;
                    }
                }
            }
            intensity = v;

            //Keep track of intensities per row for later sorting
            this.masks[mask].featureIntensitiesByRow[r].push(intensity);

            rowIntensity += intensity;
            this.columnIntensity[rm] += intensity / this.dataLength;
            for (let i = 0; i < this.featureHeight / this.binSize; i++) {
                rowPts.push({
                    x: binNumber * this.binSize,
                    y: curY + r * (this.featureHeight + this.featureGap),
                    size: this.binSize,
                    intensity: intensity / 2
                });
                curY += this.binSize;
            }
            for (let i = 0; i < this.featureGap / this.binSize; i++) {
                rowPts.push({
                    x: binNumber * this.binSize,
                    y: curY + r * (this.featureHeight + this.featureGap),
                    size: this.binSize,
                    intensity: 100000000
                });
                curY += this.binSize;
            }
        }
        return rowPts;
    }

    animate() {
        this.scanning = true;
        for (let i = 0; i < this.binsPerFrame; i++) {
            if (this.currentBin < this.width) {
                for (let m in this.masks) {
                    if (this.masks[m].on) {
                        //this.masks[m].heatmaps[this.masks[m].h].clearRect( this.currentBin * 2, 0, 4, this.height );
                        this.masks[m].heatmaps[this.masks[m].h].addPoints(
                            this.getMaskAtRowByRow(this.currentBin, m)
                        );
                    }
                }
                this.currentBin++;
            }
        }
        for (let m in this.masks) {
            if (this.masks[m].on) {
                this.masks[m].heatmaps[this.masks[m].h].update();
                this.masks[m].heatmaps[this.masks[m].h].display();
            }
        }

        if (this.currentBin >= this.width) {
            //if( this.sortByRow )
            //  this.sortRow( this.currentDrawRow );
            //console.log( this.currentDrawRow, this.featureMap( this.currentDrawRow ) );
            this.currentDrawRow++;
            this.currentBin = 0;
        }
        if (this.currentDrawRow >= this.featureList.length) {
            this.currentDrawRow = 0;
            this.scanning = false;
            this.initialDrawHappened = true;
            if (this.zoomLevel === 0) {
                this.props.setDistribution("vertical", this.masks);
                this.props.setDistribution("horizontal", this.masks);
            }
            this.props.setExtentBox(this.startRow, this.pixelBinSize, this.dataLength);
            this.props.setValues(this.masks, this.dataLength);
            window.cancelAnimationFrame(this.animationFrame);
            return;
        }
        /*
    if( this.currentBin >= this.width ) {
      this.scanning = false;
      this.initialDrawHappened = true;
      this.props.setDistribution( 'vertical', this.columnIntensity, formulas.findMaxValueInArray( this.columnIntensity ) );
      this.props.setDistribution( 'horizontal', this.distributionLine.horizontal, this.distributionMax.horizontal );
      this.props.setExtentBox( this.binOffset, this.pixelBinSize, this.dataLength );
      this.props.setValues( this.masks, this.dataLength );
      window.cancelAnimationFrame( this.animationFrame );
      return;
    }
    */
        this.animationFrame = window.requestAnimationFrame(this.animate);
    }

    wheel(e) {
        e.preventDefault();
        let windowPos = manager.getWindowPosition(
            this.props.rwm.windowId,
            this.props.rwm.managerId
        );
        if (this.zoomStates.length === 0) {
            this.zoomStates.push({
                width: this.width,
                left: 0,
                currentBin: 0,
                binOffset: 0,
                pixelBinSize: this.initialPixelBinSize,
                zoomLevel: 0,
                startRow: 0
            });
        }

        var pos = formulas.findPos(this.masks[0].canvases[this.masks[0].h]);
        var leftness =
            parseInt(this.masks[0].canvases[this.masks[0].h].style.left.replace("px", ""), 10) || 0;
        var x = e.pageX - pos.x - windowPos.x - leftness;
        var y = e.pageY - pos.y;

        if (e.deltaY < 0) {
            //zoom up/in
            if (this.pixelBinSize === 1) return; // Don't zoom passed 1:1
            this.currentWidth *= 2;
            let zState = { width: this.currentWidth, left: -x };
            for (let m in this.masks) {
                this.masks[m].canvases[this.masks[m].h].style.width = zState.width + "px";
                this.masks[m].canvases[this.masks[m].h].style.height = this.height + "px";
                this.masks[m].canvases[this.masks[m].h].style.left = zState.left + "px";
            }
            this.currentBin = 0;
            /*
      let oldpixelBinSize = this.pixelBinSize;
      this.pixelBinSize = Math.ceil( ( this.dataLength * 2 ) / ( this.width * Math.pow( 2, this.zoomLevel ) ) );

      */

            //Without innerOffset, startRow will start at where the cursor zoomed in
            // We want it to zoom in directly to the cursor
            let innerOffset;
            //this.binOffset += ( x * ( this.pixelBinSize / oldpixelBinSize ) );
            //console.log( x, innerOffset );
            this.binOffset = x - innerOffset;
            this.binOffset = getZoomedInMin(0, this.width, x);
            this.oldPixelBinSize = this.pixelBinSize;
            this.pixelBinSize = Math.ceil(
                this.dataLength / (this.width * Math.pow(2, this.zoomLevel))
            );
            //Without innerOffset, startRow will start at where the cursor zoomed in
            // We want it to zoom in directly to the cursor
            this.startRow += parseInt((this.binOffset / this.binSize) * this.oldPixelBinSize, 10);

            this.zoomLevel++;

            zState.currentBin = this.currentBin;
            zState.binOffset = this.binOffset;
            zState.pixelBinSize = this.pixelBinSize;
            zState.zoomLevel = this.zoomLevel;
            zState.startRow = this.startRow;
            this.zoomStates.push(zState);

            //Finds the new minimum such that the new min max range is half the original
            // and value in still placed the same percentage between them
            function getZoomedInMin(min, max, value) {
                //Find percent between
                let percentBetween = (value - min) / (max - min);
                //Find what our new range would be
                let newRange = Math.ceil(max - min) / 2;
                return parseInt(value - newRange * percentBetween, 10);
            }

            setTimeout(() => {
                this.extentChanged();
            }, 1);
        } else if (e.deltaY > 0) {
            if (this.zoomLevel !== 0) {
                //We can still zoom out
                this.zoomLevel--;

                //Pop twice since we want the previous and not current
                let zState = this.zoomStates.pop();
                if (this.zoomStates.length !== 0) zState = this.zoomStates.pop();

                this.currentWidth = zState.width;
                for (let m in this.masks) {
                    this.masks[m].canvases[this.masks[m].h].style.width = this.width + "px";
                    this.masks[m].canvases[this.masks[m].h].style.height = this.height + "px";
                    this.masks[m].canvases[this.masks[m].h].style.left = 0 + "px";
                }

                this.currentBin = zState.currentBin;
                this.binOffset = zState.binOffset;
                this.pixelBinSize = zState.pixelBinSize;
                this.oldPixelBinSize = this.pixelBinSize;
                this.startRow = zState.startRow;

                setTimeout(() => {
                    this.recalculateMasks(false);
                }, 1);
            }
        }
    }

    recalculateMasks(clearResults) {
        if (clearResults) {
            this.startRow = 1;
            for (let m in this.masks) {
                this.masks[m].rowHits = new Array(this.dataWidth).fill(0);
                this.masks[m].results = {};
            }
            this.initialDrawHappened = false;
        }

        for (let m in this.masks) {
            this.masks[m].featureIntensitiesByRow = [];
        }

        this.columnIntensity = [];
        this.currentBin = 0;
        this.currentDrawRow = 0;

        this.extentChanged();
    }

    extentChanged() {
        window.cancelAnimationFrame(this.animationFrame);
        this.switchH();

        /* //Why recompute after initial?
    for( let m in this.masks ) {
      this.masks[m].rowHitsZoom = new Array(this.dataWidth).fill(0);
      this.masks[m].rowsZoom = 0;
    }
    */
        this.animationFrame = window.requestAnimationFrame(this.animate);
    }

    /**
     * Updates pan from extent box (in the case the user panned with it)
     * @param {*} startRow
     */
    setFromExtent(startRow) {
        this.currentBin = 0;
        this.startRow = parseInt(startRow, 10);
        window.cancelAnimationFrame(this.animationFrame);
        this.switchH();
        this.animationFrame = window.requestAnimationFrame(this.animate);
    }

    switchH() {
        this.columnIntensity = new Array(this.dataWidth).fill(0);

        let hSaves = [];
        for (let m in this.masks) {
            hSaves.push(this.masks[m].h);
            //this.masks[m].canvases[this.masks[m].h].style.opacity = 0;
        }

        //Timeout for time to animate opacity
        //setTimeout( () => {
        for (let m in this.masks) {
            this.masks[m].heatmaps[hSaves[m]].clear();
        }
        //}, 1000 );

        this.currentWidth = this.width;

        for (let m in this.masks) {
            //this.masks[m].h = this.masks[m].h === 1 ? 0 : 1;
            this.masks[m].canvases[this.masks[m].h].style.width = this.currentWidth + "px";
            this.masks[m].canvases[this.masks[m].h].style.left = 0 + "px";
            this.masks[m].canvases[this.masks[m].h].style.opacity = this.masks[m].opacity;
            this.masks[m].canvases[this.masks[m].h].style.zIndex =
                parseInt(this.masks[m].canvases[this.masks[m].h].style.zIndex, 10) + 2;
        }
    }

    mouseDown(e) {
        this.mouseIsDown = true;
        this.mouseX = e.pageX;

        for (let m in this.masks) {
            this.masks[m].canvases[this.masks[m].h].style.transition = "none";
        }
    }
    mouseMove(e) {
        if (this.mouseIsDown) {
            let leftness =
                parseInt(
                    this.masks[0].canvases[this.masks[0].h].style.left.replace("px", ""),
                    10
                ) || 0;
            this.lastMoveLeft = leftness - (this.mouseX - e.pageX);
            for (let m in this.masks) {
                this.masks[m].canvases[this.masks[m].h].style.left = this.lastMoveLeft + "px";
            }
            this.mouseX = e.pageX;
        } else {
            let windowPos = manager.getWindowPosition(
                this.props.rwm.windowId,
                this.props.rwm.managerId
            );
            var pos = formulas.findPos(this.masks[0].canvases[this.masks[0].h]);
            var leftness =
                parseInt(
                    this.masks[0].canvases[this.masks[0].h].style.left.replace("px", ""),
                    10
                ) || 0;
            var x = e.pageX - pos.x - windowPos.x - leftness;
            let binOffset = x;
            binOffset = parseInt(binOffset, 10);
            //console.info( 'Heatmap row:', this.startRow + parseInt( ( binOffset * this.pixelBinSize ) / this.binSize, 10 ) );
        }
    }
    mouseUp() {
        if (this.mouseIsDown) {
            for (let m in this.masks) {
                this.masks[m].canvases[this.masks[m].h].style.transition =
                    "opacity 1s cubic-bezier(0.445, 0.05, 0.55, 0.95)";
            }
            this.mouseIsDown = false;
            //Ensure mouse dragged
            if (this.lastMoveLeft && this.lastMoveLeft !== 0) {
                this.currentBin = 0;
                this.binOffset = parseInt(-this.lastMoveLeft, 10);
                this.startRow += parseInt((this.binOffset / this.binSize) * this.pixelBinSize, 10);

                window.cancelAnimationFrame(this.animationFrame);
                this.switchH();
                this.animationFrame = window.requestAnimationFrame(this.animate);
            }
            this.lastMoveLeft = 0;
        }
    }

    setMaskOpacity(name, opacity) {
        for (let m in this.masks) {
            if (this.masks[m].name === name) {
                if (opacity === "end") {
                    this.masks[m].canvases[this.masks[m].h].style.transition =
                        "opacity 1s cubic-bezier(0.445, 0.05, 0.55, 0.95)";
                } else {
                    this.masks[m].opacity = opacity;
                    this.masks[m].canvases[this.masks[m].h].style.transition = "none";
                    this.masks[m].canvases[this.masks[m].h].style.opacity = this.masks[m].opacity;
                }
            }
        }
    }

    /**
     * Resets to initial zoom and pan
     */
    refreshZoom() {
        this.pixelBinSize = Math.ceil((this.dataLength * 2) / this.currentWidth);
        this.initialPixelBinSize = this.pixelBinSize;
        this.oldPixelBinSize = this.pixelBinSize;

        this.currentBin = 0;
        this.startRow = 1;
        this.zoomLevel = 0;

        window.cancelAnimationFrame(this.animationFrame);
        this.switchH();
        this.animationFrame = window.requestAnimationFrame(this.animate);
    }

    componentDidMount() {
        this.init();
        try {
            for (let m in this.masks) {
                this.masks[m].heatmaps[0] = webglheatmap.createWebGLHeatmap({
                    canvas: this.masks[m].canvases[0],
                    width: this.width,
                    height: this.height,
                    intensityToAlpha: false,
                    gradientTexture: this.masks[m].gradient,
                    gradientWidth: 340
                });
                /*
        this.masks[m].heatmaps[1] = webglheatmap.createWebGLHeatmap(
          { canvas: this.masks[m].canvases[1], width: this.width, height: this.height, intensityToAlpha: false, gradientTexture: this.masks[m].gradient, gradientWidth: 340 }
        );
        */
            }
            this.animationFrame = window.requestAnimationFrame(this.animate);
        } catch (error) {
            console.warn(error);
        }
    }

    /**
     * Positions the hoverBin
     */
    mouseMoveBin(e) {
        let windowPos = manager.getWindowPosition(
            this.props.rwm.windowId,
            this.props.rwm.managerId
        );
        let pos = formulas.findPos(this.masks[0].canvases[this.masks[0].h]);
        let x = e.pageX - pos.x - windowPos.x;
        let y = e.pageY - pos.y - windowPos.y;

        let xBin = Math.floor(x / this.binSize) * this.binSize;
        let yBin =
            Math.floor(y / (this.featureHeight + this.featureGap)) *
            (this.featureHeight + this.featureGap);

        this.ref_hoverBin.style.opacity = 1;
        this.ref_hoverBin.style.top = yBin - 1 + "px";
        this.ref_hoverBin.style.left = xBin - 1 + "px";
        this.ref_hoverBin.style.width = this.binSize + "px";
        this.ref_hoverBin.style.height = this.featureHeight + "px";
    }
    mouseLeaveBin() {
        this.ref_hoverBin.style.opacity = 0;
    }
    /**
     * Captures and displays bin data on hover
     */
    mouseClickValues(e) {
        let windowPos = manager.getWindowPosition(
            this.props.rwm.windowId,
            this.props.rwm.managerId
        );
        let pos = formulas.findPos(this.masks[0].canvases[this.masks[0].h]);
        let x = e.pageX - pos.x - windowPos.x;
        let y = e.pageY - pos.y - windowPos.y;

        let xBin = Math.ceil(x / this.binSize);
        let yBin = Math.floor(y / (this.featureHeight + this.featureGap));

        let xI = this.startRow + xBin * this.pixelBinSize;
        let yI = yBin;
        //console.log( xI, yI );
        let values = {};
        let xIM = this.rowMap(xI); //x index mapped
        let yIM = this.featureMap(yI);
        for (let i = 0; i < this.pixelBinSize; i++) {
            //console.log( i, xI, yI, this.rowMap( xI + i ), this.featureMap( yI ) );
            if (this.props.data.has(xIM + i)) {
                let v = this.props.data.getIn([xIM + i, yIM]);
                if (values.hasOwnProperty(v)) values[v]++;
                else values[v] = 1;
            }
        }

        this.props.setInfoTable(
            this.props.data.getIn([0, yIM]) + " - Row: " + xIM + "+" + this.pixelBinSize,
            values
        );
    }

    componentWillUnmount() {
        window.cancelAnimationFrame(this.animationFrame);
    }

    _makeHeatmapCanvases() {
        let canvases = [];
        //Reverse order
        for (let m = Object.keys(this.masks).length - 1; m >= 0; m--) {
            canvases.push(
                <canvas
                    ref={r => {
                        this.masks[m].canvases[0] = r;
                    }}
                    key={m * 2}
                    style={{ zIndex: 2 }}
                    onWheel={e => this.wheel(e)}
                    onMouseDown={e => this.mouseDown(e)}
                    onMouseMove={e => this.mouseMove(e)}
                    onMouseUp={e => this.mouseUp(e)}
                    onMouseLeave={e => this.mouseUp(e)}
                    width={this.width}
                    height={this.height}
                />
            );
            /*
      canvases.push(
        <canvas ref={(r) => { this.masks[m].canvases[1] = r; } }
          key={m*2+1}
          style={{zIndex: 1}}
          onWheel = {(e) => this.wheel(e)}
          onMouseDown = {(e) => this.mouseDown(e)}
          onMouseMove = {(e) => this.mouseMove(e)}
          onMouseUp = {(e) => this.mouseUp(e)}
          onMouseLeave = {(e) => this.mouseUp(e)}
          width={this.width} height={this.height}></canvas>
      );
      */
        }
        return canvases;
    }

    render() {
        return (
            <div
                className="WebGLHeat"
                ref={r => {
                    this.ref = r;
                }}
                onClick={e => {
                    this.mouseClickValues(e);
                }}
                onMouseMove={e => {
                    this.mouseMoveBin(e);
                }}
                onMouseLeave={e => {
                    this.mouseLeaveBin(e);
                }}
            >
                {this._makeHeatmapCanvases()}
                <div
                    id="hoverBin"
                    ref={r => {
                        this.ref_hoverBin = r;
                    }}
                />
            </div>
        );
    }
}

// redux connection
const mapStateToProps = state => {
    return {
        data: state.getIn(["data", "data"])
    };
};
const mapDispatchToProps = () => ({});

export { WebGLHeat };
export default connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(WebGLHeat);
