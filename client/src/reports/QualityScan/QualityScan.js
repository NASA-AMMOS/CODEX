import React, { Component } from "react";

import WebGLHeat from "../../Components/WebGLHeat/WebGLHeat";
import QualityScanMasks from "./QualityScanMasks/QualityScanMasks";
import {
    FaCheck,
    FaSortAlphaAsc,
    FaSortAlphaDesc,
    FaSortNumericAsc,
    FaSortNumericDesc,
    FaCaretLeft,
    FaAlignLeft,
    FaRefresh,
    FaSearchPlus,
    FaSearchMinus
} from "react-icons/lib/fa";
import { GoFold, GoUnfold, GoArrowLeft, GoArrowRight } from "react-icons/lib/go";
import { MdInvertColorsOff, MdInvertColorsOn } from "react-icons/lib/md";

import "./QualityScan.css";
import { formulas } from "../../formulas/formulas";
import QualityScanInfo from "./QualityScanInfo/QualityScanInfo";
import QualityScanTable from "./QualityScanTable/QualityScanTable";

// redux
import { connect } from "react-redux";
import { getFeatures } from "../../../selectors/data";

class QualityScan extends Component {
    constructor(props) {
        super(props);

        this.ref_chart = {};
        this.ref_webglheat = null;
        this.ref_tableheader = null;
        this.ref_featureTable = null;
        this.ref_featureTableTR = [];
        this.ref_totalsbar = null;
        this.ref_highlighter = null;
        this.ref_QualityScanInfo = null;
        this.ref_QualityScanTable = null;

        // handler bindings
        this.setValues = this.setValues.bind(this);
        this._setValuesFor = this._setValuesFor.bind(this);
        this.setExtentBox = this.setExtentBox.bind(this);
        this.setDistribution = this.setDistribution.bind(this);

        this.state = { data: this.props.data.toJS() };
        const data = this.state.data;

        this.masks = [
            {
                name: "Infinities",
                gradient: "gradients/red.png",
                color: "red",
                opacity: 1,
                masker: function(v) {
                    if (this.inputs.value.value.length > 0)
                        return this.inputs.value.value == v ? 1 : 0; // eslint-disable-line
                    return !isNaN(v) && !isFinite(v) ? 1 : 0;
                },
                inputs: {
                    value: { type: "text", value: "" }
                }
            },
            {
                name: "NaNs",
                gradient: "gradients/yellow.png",
                color: "yellow",
                opacity: 1,
                masker: function(v) {
                    return isNaN(v) ? 1 : 0;
                }
            },
            {
                name: "Repeats",
                gradient: "gradients/green.png",
                color: "lime",
                opacity: 0,
                masker: function(v, row) {
                    return this.results[row].hasOwnProperty(v) && this.results[row][v] > 1 ? 1 : 0; //(this.results[row][v]/this.results[row]['__neverusethisasafeaturevalue']) : 0;
                },
                cutoff: 1,
                results: {},
                maskerData: function(rowNumber) {
                    if (this.results.hasOwnProperty(rowNumber)) {
                        return;
                    }
                    let rowRepeats = {};
                    let max = -Infinity;
                    if (rowNumber !== -1) {
                        for (let r = 1; r < data.length; r++) {
                            if (rowRepeats.hasOwnProperty(data[r][rowNumber]))
                                rowRepeats[data[r][rowNumber]]++;
                            else rowRepeats[data[r][rowNumber]] = 1;
                            if (rowRepeats[data[r][rowNumber]] > max)
                                max = rowRepeats[data[r][rowNumber]];
                        }
                    }
                    rowRepeats["__neverusethisasafeaturevalue"] = max;
                    this.results[rowNumber] = rowRepeats;
                }
            },
            {
                name: "Outliers",
                gradient: "gradients/cyan.png",
                color: "cyan",
                opacity: 0,
                masker: function(v, row) {
                    return Math.abs(v - this.results[row].mean) >
                        this.results[row].standardDeviation * this.inputs.sigma.value
                        ? 1
                        : 0;
                },
                results: {},
                maskerData: function(rowNumber) {
                    if (this.results.hasOwnProperty(rowNumber)) {
                        return;
                    }
                    let standardDeviation = 0;
                    let mean = 0;
                    let variance = 0;

                    if (rowNumber !== -1) {
                        // Calculate mean
                        for (let r = 1; r < data.length; r++) {
                            mean += data[r][rowNumber];
                        }
                        mean /= data.length - 1;
                        // Calculate variance
                        for (let r = 1; r < data.length; r++) {
                            variance += Math.pow(data[r][rowNumber] - mean, 2);
                        }
                        variance /= data.length - 1;

                        // Standard deviation
                        standardDeviation = Math.sqrt(variance);
                    }
                    this.results[rowNumber] = { standardDeviation: standardDeviation, mean: mean };
                },
                inputs: {
                    sigma: { type: "range", min: 0, step: 0.01, max: 7, value: 3 }
                }
            },

            {
                name: "Custom",
                gradient: "gradients/fuchsia.png",
                color: "fuchsia",
                opacity: 0,
                masker: function(v) {
                    return Number.isInteger(v) ? 1 : 0;
                }
            }
        ];

        this.sortedBy = "default"; //or 'alpha', 'antialpha', 'count', 'anticount'

        let mFeatures = getFeatures(this.props.data).toJS();
        let map = []; //maps raw features indices to list feature indices
        for (let i = 0; i < mFeatures.length; i++) {
            map.push(i);
        }
        //2nd getFeatures to avoid tied reference
        this.featureData = {
            full: [],
            list: mFeatures,
            raw: getFeatures(this.props.data).toJS(),
            map: map
        };

        //Map mask indices back to this.masks so that they can be rearranged
        this.maskMapping = [];
        for (let i = 0; i < this.masks.length; i++) this.maskMapping.push(i);

        this.chosenMask = 0;

        this.horupdated = false;

        //Arrays of intensities
        this.distributionLines = {
            vertical: [],
            horizontal: []
        };

        this.sortedByRows = false;
        //Whether empty hit rows for the current mask are hidden
        this.featuresHidden = false;
        this.rowsHidden = false;

        //Whether the user has her mouse down on the extent box
        this.extentBoxDown = false;

        this.colorsInverted = false;
    }

    highlightFeature(i) {
        this.ref_highlighter.style.top =
            this.ref_featureTableTR[i].getBoundingClientRect().top -
            this.ref_QualityScanTable.getTableRef().getBoundingClientRect().top -
            this.ref_QualityScanTable.getTableRef().getBoundingClientRect().height +
            "px";
    }

    makeFeatureTable(featureList) {
        let featureTableElements = [];
        for (let i = 0; i < featureList.length; i++) {
            featureTableElements.push(
                <tr
                    key={i}
                    ref={r => (this.ref_featureTableTR[i] = r)}
                    onMouseEnter={() => this.highlightFeature(i)}
                    onClick={() => this.setQualityInfo("feature", i)}
                >
                    <td className="tableFeatureName" title={featureList[i]}>
                        {featureList[i]}
                    </td>
                    <td />
                    <td />
                </tr>
            );
        }

        return featureTableElements;
    }

    makeFeatureList(featureList) {
        return;
        let featureListElements = [];
        for (let i = 0; i < featureList.length; i++) {
            featureListElements.push(
                <li
                    key={i}
                    ref={r => (this.ref_featurelistli[i] = r)}
                    onMouseEnter={() => this.highlightFeature(i)}
                >
                    {featureList[i]}
                </li>
            );
        }
        return featureListElements;
    }

    setValues(masks, dataLength) {
        for (let m in this.masks) {
            this.masks[m].rowHits = masks[m].rowHits;
            this.masks[m].dataLength = dataLength;
            this.masks[m].totalRowHits = 0;
            for (let i in this.masks[m].rowHits) {
                this.masks[m].totalRowHits += this.masks[m].rowHits[i];
            }
        }

        this._setValuesFor(this.chosenMask);
    }

    _setValuesFor(maskId) {
        if (maskId === -1) maskId = this.chosenMask;
        this.lastMaskId = maskId;
        //Create new table feature list, mapping mask row hits to new feature order
        let updatedTableFeatureList = [];
        for (let i in this.masks[maskId].rowHits) {
            let hidden = false;
            if (
                this.featuresHidden &&
                this.masks[this.chosenMask].rowHits[this.featureData.map[i]] === 0
            )
                hidden = true;

            updatedTableFeatureList.push({
                name: this.featureData.list[i],
                hidden: hidden,
                count: this.masks[maskId].rowHits[this.featureData.map[i]],
                percent:
                    (
                        (this.masks[maskId].rowHits[this.featureData.map[i]] /
                            this.masks[maskId].dataLength) *
                        100
                    ).toFixed(2) + "%",
                percentRaw:
                    (this.masks[maskId].rowHits[this.featureData.map[i]] /
                        this.masks[maskId].dataLength) *
                        100 +
                    "%"
            });
        }
        this.featureData.full = updatedTableFeatureList;
        this.ref_QualityScanTable.setFeatureList(updatedTableFeatureList);
    }

    //Fit table header dimensions to its rows
    // Called after QualityScanTable render
    finalizeTableHeaderFooter() {
        let maskId = this.lastMaskId;

        let totalsbar = this.ref_totalsbar;

        let ftt = this.ref_QualityScanTable.getTRRef("visible"); //feature table tablerow

        if (ftt !== undefined) {
            //They're not all invisible
            let w0 = ftt.children[0].getBoundingClientRect().width + "px";
            this.ref_tableheader.children[0].style.width = w0;
            totalsbar.children[0].style.width = w0;
            totalsbar.children[0].innerHTML = this.masks[maskId].rowHits.length;
            let w1 = ftt.children[1].getBoundingClientRect().width + "px";
            this.ref_tableheader.children[1].style.width = w1;
            totalsbar.children[1].style.width = w1;
            totalsbar.children[1].innerHTML = this.masks[maskId].totalRowHits;
            let w2 = ftt.children[2].getBoundingClientRect().width + "px";
            this.ref_tableheader.children[2].style.width = w2;
            totalsbar.children[2].style.width = w2;
        }
        //Write total bar values
        totalsbar.children[2].innerHTML =
            (
                (this.masks[maskId].totalRowHits /
                    (this.masks[maskId].dataLength * this.masks[maskId].rowHits.length)) *
                100
            ).toFixed(2) + "%";
        totalsbar.children[2].title =
            (this.masks[maskId].totalRowHits /
                (this.masks[maskId].dataLength * this.masks[maskId].rowHits.length)) *
                100 +
            "%";
    }

    setExtentBox = (startRow, pixelsPerBin, dataLength) => {
        let width = this.ref_chart["horizontal"].getBoundingClientRect().width;
        this.ref_extentbox.style.transition =
            "left 0.2s cubic-bezier(0.445, 0.05, 0.55, 0.95), width 0.2s cubic-bezier(0.445, 0.05, 0.55, 0.95)";
        this.ref_extentbox.style.left = (startRow / dataLength) * width + "px";
        this.ref_extentbox.style.width = (pixelsPerBin * width * width) / (dataLength * 2) + "px";
    };
    /**
     * Sets the sparkline distribution
     * @param {string} graphPos - 'veritcal' || 'horizontal'
     * @param {obj} masks - masks object from webglheat
     */
    setDistribution = (graphPos, masks) => {
        this.ref_chart[graphPos].innerHTML = "";

        masks = masks || this.masks;

        //var mask = masks[this.chosenMask];
        for (let m = this.masks.length - 1; m >= 0; m--) {
            let mask = this.masks[this.maskMap(m)];
            let pts, max, multiplier, ptString;
            switch (graphPos.toLowerCase()) {
                case "vertical":
                    if (mask.featureIntensitiesByRow === undefined) return;
                    //Find feature points and intensities
                    pts = new Array(mask.featureIntensitiesByRow.length).fill(0);
                    for (let r = 0; r < mask.featureIntensitiesByRow.length; r++) {
                        for (let v = 0; v < mask.featureIntensitiesByRow[r].length; v++) {
                            pts[r] += mask.featureIntensitiesByRow[r][v];
                        }
                    }
                    if (mask.name === this.masks[this.chosenMask].name)
                        this.distributionLines.vertical = pts;

                    max = -Infinity;
                    for (let i = 0; i < pts.length; i++) {
                        if (pts[i] > max) max = pts[i];
                    }

                    let width = this.ref_chart["vertical"].getBoundingClientRect().width;
                    multiplier = (width - 4) / max;

                    this.ref_chart["vertical"].parentElement.style.height =
                        this.ref_QualityScanTable.getTableRef().getBoundingClientRect().height +
                        "px";

                    ptString = "0,11 ";
                    for (let p in pts) {
                        ptString += parseInt(pts[p] * multiplier, 10) + "," + (p * 24 + 11) + " ";
                    }
                    ptString += "0," + ((pts.length - 1) * 24 + 11);

                    //If we've bad data somewhy
                    if (ptString.indexOf("NaN") !== -1) {
                        ptString = "";
                    }

                    this.ref_chart["vertical"].insertAdjacentHTML(
                        "beforeend",
                        '<polyline class="QualityScan_Distribution_' +
                            mask.name +
                            '" fill="#fff" fill-opacity="' +
                            mask.opacity / 8 +
                            '" stroke="' +
                            mask.color +
                            '" stroke-width="2" stroke-opacity="' +
                            mask.opacity +
                            '" points="' +
                            ptString +
                            '"/>'
                    );
                    break;
                case "horizontal":
                    if (mask.featureIntensitiesByRow[0] === undefined) return;

                    pts = new Array(mask.featureIntensitiesByRow[0].length).fill(0);
                    for (let r = 0; r < mask.featureIntensitiesByRow.length; r++) {
                        for (let v = 0; v < mask.featureIntensitiesByRow[r].length; v++) {
                            pts[v] += mask.featureIntensitiesByRow[r][v];
                        }
                    }
                    this.distributionLines.horizontal = pts;

                    max = -Infinity;
                    for (let i = 0; i < pts.length; i++) {
                        if (pts[i] > max) max = pts[i];
                    }

                    let height = this.ref_chart["horizontal"].getBoundingClientRect().height - 2;
                    multiplier = (height - 4) / max;

                    ptString = "0,0 ";
                    for (let p in pts) {
                        ptString += p * 2 + "," + (parseInt(pts[p] * multiplier, 10) + 1) + " ";
                    }
                    ptString += (pts.length - 1) * 2 + ",0";

                    //If we've bad data somewhy
                    if (ptString.indexOf("NaN") !== -1) {
                        ptString = "0,0";
                    }

                    this.ref_chart["horizontal"].insertAdjacentHTML(
                        "beforeend",
                        '<polyline class="QualityScan_Distribution_' +
                            mask.name +
                            '" fill="#fff" fill-opacity="' +
                            mask.opacity / 8 +
                            '" stroke="' +
                            mask.color +
                            '" stroke-width="2" stroke-opacity="' +
                            mask.opacity +
                            '" points="' +
                            ptString +
                            '"/>'
                    );
                    break;
                default:
                    console.warn("Warning - Unknown Quality Scan graph position: " + graphPos);
            }
        }
    };

    setMaskInputValue(maskName, inputName, value) {
        for (let m in this.masks) {
            if (
                this.masks[m].name === maskName &&
                this.masks[m].inputs &&
                this.masks[m].inputs[inputName]
            ) {
                this.masks[m].inputs[inputName].value = value;
            }
        }
        this.ref_webglheat.recalculateMasks(true);
    }
    setMaskOpacity(name, opacity) {
        //Set the distribution marginal opacities first
        if (opacity !== "end") {
            let masksDistLine = document.getElementsByClassName("QualityScan_Distribution_" + name);
            for (let i = 0; i < masksDistLine.length; i++) {
                masksDistLine[i].setAttribute("fill-opacity", opacity / 8);
                masksDistLine[i].setAttribute("stroke-opacity", opacity);
            }
        }

        if (this.ref_webglheat) {
            this.ref_webglheat.setMaskOpacity(name, opacity);
        }
    }
    maskMap(i) {
        if (i < 0) return -1;
        return this.maskMapping[i];
    }
    setMaskOrder(maskOrder) {
        //Set mask mapping
        this.maskMapping = [];
        for (let i in maskOrder) {
            for (let m = 0; m < this.masks.length; m++) {
                if (this.masks[m].name === maskOrder[i]) {
                    this.maskMapping.push(m);
                    break;
                }
            }
        }

        if (this.ref_webglheat) this.ref_webglheat.setMaskOrder(maskOrder);
    }
    setHoverMask(hoverId) {
        this._setValuesFor(this.maskMap(hoverId));
    }
    choseMask(i) {
        this.chosenMask = this.maskMap(i);
        this.featuresHidden = false;
        this.rowsHidden = false;
        //this.ref_webglheat.setFeatureList( this.featureData.list );
        this._setValuesFor(this.chosenMask);
        this.setDistribution("vertical");
        this.setDistribution("horizontal");
    }

    //type == 'feature' -> variable is featurelist index || 'last' for last used variable
    setQualityInfo(type, variable) {
        let trs = this.ref_QualityScanTable.getTRRefs();

        for (let i in trs) {
            trs[i].style.background = "unset";
            trs[i].style.color = "unset";
        }

        if (variable !== "last" && type === "feature") {
            trs[variable].style.background = "#FF4500";
            trs[variable].style.color = "white";
            variable = this.featureData.map[variable];

            this.ref_highlitArrow.style.display = "block";
            this.ref_highlitArrow.style.top = variable * 24 + "px";
            this.ref_highlitArrow.style.right = this.ref_QualityScanTable.getWidth() + "px";
            this.shiftInfoTable(true);
        }

        this.ref_QualityScanInfo.setQualityInfo(type, this.masks[this.chosenMask], variable);
    }

    /**
     *
     * @param {string} title - table title
     * @param {object} dataObject - { key: count, key: count, ... }
     */
    setInfoTable = (title, dataObject) => {
        this.shiftInfoTable(true);
        this.ref_QualityScanInfo.setQualityInfoRaw(title, dataObject);
    };

    /**
     * Opens or closes that right most info table
     */
    shiftInfoTable(open) {
        if (open)
            this.ref_righter.style.left =
                "calc( 100% - " + this.ref_QualityScanTable.getWidth() + "px )";
        else this.ref_righter.style.left = "100%";
    }

    sortFeaturesToggle(headerIndex) {
        let byFull = false;
        let newOrder;
        if (headerIndex === 0) {
            //sort by name
            newOrder = this.featureData.list;
            newOrder = newOrder.sort();
            if (this.sortedBy === "alpha") {
                newOrder = newOrder.reverse();
                this.sortedBy = "antialpha";
            } else {
                this.sortedBy = "alpha";
            }
        } else if (this.featureData.full.length > 0) {
            //sort by count/percent
            byFull = true;
            newOrder = this.featureData.full;
            newOrder = formulas.sortArrayOfObjectsByKeyValue(newOrder, "count");
            //Kind of only like it highest first
            newOrder = newOrder.reverse();
            this.sortedBy = "anticount";
        } else {
            console.warn(
                "Warning! - tried to sort Quality Scan features by count before counts were computed."
            );
            return;
        }

        this.rearrangeFeatureList(newOrder, byFull);
        this.ref_webglheat.setFeatureList(this.featureData.list);
    }

    sortRowsToggle() {
        this.sortedByRows = !this.sortedByRows;

        if (this.sortedByRows) {
            this.ref_option_sortrows.style.background = "white";
            this.ref_option_sortrows.children[0].style.color = "black";
            this.ref_option_sortrows.children[1].style.color = "black";
            this.ref_option_sortrows.children[1].innerText = "Sort Rows";
        } else {
            this.ref_option_sortrows.style.background = "black";
            this.ref_option_sortrows.children[0].style.color = "white";
            this.ref_option_sortrows.children[1].style.color = "white";
            this.ref_option_sortrows.children[1].innerText = "Unsort Rows";
        }

        this.ref_webglheat.sortByRows(this.lastMaskId);
    }
    hiddenFeaturesToggle() {
        this.featuresHidden = !this.featuresHidden;

        if (this.featuresHidden) {
            this.ref_option_hiddenfeatures.style.background = "white";
            this.ref_option_hiddenfeatures.children[0].style.color = "black";
            this.ref_option_hiddenfeatures.children[1].style.color = "black";
            this.ref_option_hiddenfeatures.children[1].innerText = "Show Empty Features";
        } else {
            this.ref_option_hiddenfeatures.style.background = "black";
            this.ref_option_hiddenfeatures.children[0].style.color = "white";
            this.ref_option_hiddenfeatures.children[1].style.color = "white";
            this.ref_option_hiddenfeatures.children[1].innerText = "Hide Empty Features";
        }

        if (this.featuresHidden) {
            //Find all the empty features
            // Cheat and take the already computed by the distributions
            let hiddenFeatureList = []; //rather all that aren't hidden
            for (let i = 0; i < this.featureData.list.length; i++) {
                if (this.distributionLines.vertical[i] !== 0)
                    hiddenFeatureList.push(this.featureData.list[i]);
            }
            this.ref_webglheat.setFeatureList(hiddenFeatureList);
            this._setValuesFor(this.chosenMask, hiddenFeatureList);
        } else {
            this.ref_webglheat.setFeatureList(this.featureData.list);
            this._setValuesFor(this.chosenMask);
        }
    }
    hiddenRowsToggle() {
        this.rowsHidden = !this.rowsHidden;
        if (this.rowsHidden) {
            this.ref_option_hiddenrows.style.background = "white";
            this.ref_option_hiddenrows.children[0].style.color = "black";
            this.ref_option_hiddenrows.children[1].style.color = "black";
            this.ref_option_hiddenrows.children[1].innerText = "Show Empty Rows";
        } else {
            this.ref_option_hiddenrows.style.background = "black";
            this.ref_option_hiddenrows.children[0].style.color = "white";
            this.ref_option_hiddenrows.children[1].style.color = "white";
            this.ref_option_hiddenrows.children[1].innerText = "Hide Empty Rows";
        }

        this.ref_webglheat.hideEmptyRows(this.rowsHidden, this.masks[this.chosenMask]);
    }

    /**
     * Called when the user's mouse enters a table feature row
     * @param {int} i - feature list index
     */
    mouseEnteredFeature(i) {
        //If it's 0, we can use the precomputed values
        if (this.ref_webglheat.zoomLevel === 0) {
            this.ref_highlightCanvas.style.display = "inherit";
            this.ref_highlightCanvas.style.top = i * 24 + "px";
            this.ref_highlightCanvas.width = this.ref_webglheat.width;
            this.ref_highlightCanvas.height = 24;
            let ctx = this.ref_highlightCanvas.getContext("2d");
            ctx.fillStyle = "#FF4500";
            let fI = this.masks[this.chosenMask].featureIntensitiesByRow[i];
            if (fI !== undefined) {
                for (let r = 0; r < fI.length; r++) {
                    if (fI[r] !== 0) ctx.fillRect(r * 2, 0, 2, 24);
                }
            }
        }
    }

    /**
     * Called when the user's mouse leaves a table feature row
     * @param {int} i - feature list index
     */
    mouseLeftFeature() {
        this.ref_highlightCanvas.style.display = "none";
    }

    /**
     * Make a highlight row that only highlight a specific value
     */
    highlightByValue(feature, value) {
        let rawFeatureI = this.state.data[0].indexOf(feature);
        if (rawFeatureI === -1) return;
        let i = this.ref_webglheat.featureMap(rawFeatureI);
        if (!(i >= 0)) return;

        this.ref_highlightCanvas.style.display = "inherit";
        this.ref_highlightCanvas.style.top = i * 24 + "px";
        this.ref_highlightCanvas.width = this.ref_webglheat.width;
        this.ref_highlightCanvas.height = 24;
        let ctx = this.ref_highlightCanvas.getContext("2d");
        ctx.fillStyle = "#FF4500";

        let binSize = this.ref_webglheat.pixelBinSize;
        for (let r = 1; r < this.state.data.length; r++) {
            if (this.state.data[r][rawFeatureI] == value) {
                ctx.fillRect((r * 2) / binSize, 0, 2, 24);
                if ((r * 2) / binSize > this.ref_webglheat.width) console.log("too High!");
            }
        }
    }

    /**
     * Drag events for the extent box and its panning
     * @param {string} eventType - 'down', 'move', 'up'
     * @param {MouseEvent} e
     */
    extentBoxEvent(eventType, e) {
        switch (eventType) {
            case "down":
                this.extentBoxDown = true;
                this.extentStartLeft = parseInt(
                    this.ref_extentbox.style.left.replace("px", ""),
                    10
                );
                this.lastExtentBoxX = e.pageX;
                break;
            case "move":
                if (this.extentBoxDown) {
                    this.ref_extentbox.style.transition = "none";
                    this.ref_extentbox.style.left =
                        parseInt(this.ref_extentbox.style.left.replace("px", ""), 10) +
                        (e.pageX - this.lastExtentBoxX) +
                        "px";
                }
                this.lastExtentBoxX = e.pageX;
                break;
            case "up":
            case "leave":
                if (this.extentBoxDown) {
                    this.extentBoxDown = false;
                    let width = this.ref_chart["horizontal"].getBoundingClientRect().width;
                    let left = parseInt(this.ref_extentbox.style.left.replace("px", ""), 10);
                    this.ref_webglheat.setFromExtent(((this.state.data.length - 1) * left) / width);
                }
                break;
            default:
                break;
        }
    }

    /**
     * Restores zoom and pan to initial stat
     */
    refreshZoom() {
        this.ref_webglheat.refreshZoom();
    }
    /**
     * Swaps the background color of the heatmap
     */
    invertColors() {
        //background: linear-gradient( to top, #000, #181818 );
        this.colorsInverted = !this.colorsInverted;
        if (this.colorsInverted) {
            this.ref_invertColors.style.color = "black";
            this.ref_invertColors.style.background = "white";
            this.ref_webglheat.ref.style.background = "#FFF";
        } else {
            this.ref_invertColors.style.color = "white";
            this.ref_invertColors.style.background = "black";
            this.ref_webglheat.ref.style.background = "#181818";
        }
    }

    //Rearrange feature list based on how list will change and remake map
    // byFull true if we're instead rearranged based on the order of full
    rearrangeFeatureList(newOrder, byFull) {
        let newMap = [];
        let name;
        for (let i = 0; i < newOrder.length; i++) {
            name = byFull ? newOrder[i].name : newOrder[i];
            let m = this.featureData.raw.indexOf(name);
            newMap.push(m);
        }

        let newList = [];
        if (byFull) {
            //then we need to assemble newList based on newMap
            for (let i = 0; i < newMap.length; i++) {
                newList.push(this.featureData.raw[newMap[i]]);
            }
        } else newList = newOrder;

        this.featureData.list = newList;
        this.featureData.map = newMap;
    }

    render() {
        return (
            <div className="QualityScan">
                <div className="left">
                    <div className="top">Masks</div>
                    <div className="middle">
                        <div className="masks">
                            <QualityScanMasks
                                masks={this.masks}
                                setMaskOpacity={(n, o) => this.setMaskOpacity(n, o)}
                                setHoverMask={h => this.setHoverMask(h)}
                                choseMask={i => this.choseMask(i)}
                                setQualityInfo={v => this.setQualityInfo("feature", v)}
                                setMaskInputValue={(m, i, v) => this.setMaskInputValue(m, i, v)}
                                setMaskOrder={mo => this.setMaskOrder(mo)}
                            />
                        </div>
                    </div>
                </div>
                <div className="right">
                    <div className="top">
                        <div className="optionbar">
                            <div className="optionbarleft">
                                <div
                                    ref={r => (this.ref_option_sortrows = r)}
                                    onClick={() => this.sortRowsToggle()}
                                >
                                    <span>
                                        <FaAlignLeft />
                                    </span>
                                    <div>Sort Rows</div>
                                </div>
                                <div
                                    ref={r => (this.ref_option_hiddenfeatures = r)}
                                    onClick={() => this.hiddenFeaturesToggle()}
                                >
                                    <span>
                                        <GoFold />
                                    </span>
                                    <div>Hide Empty Features</div>
                                </div>
                                <div
                                    ref={r => (this.ref_option_hiddenrows = r)}
                                    onClick={() => this.hiddenRowsToggle()}
                                >
                                    <span style={{ transform: "rotate(90deg)" }}>
                                        <GoFold />
                                    </span>
                                    <div>Hide Empty Rows</div>
                                </div>
                            </div>
                            <div className="optionbarright">
                                <div onClick={() => this.refreshZoom()}>
                                    <FaRefresh />
                                </div>
                            </div>
                            {/*Remove Clean Features - Pan Left - Pan Right - Zoom In - Zoom out - Reset*/}
                        </div>
                        <div className="header">
                            <table cellPadding="0" cellSpacing="0" border="0">
                                <thead>
                                    <tr
                                        className="tableHeader"
                                        ref={r => (this.ref_tableheader = r)}
                                    >
                                        <th>
                                            Feature
                                            <div onClick={() => this.sortFeaturesToggle(0)}>
                                                <FaSortAlphaAsc />
                                            </div>
                                        </th>
                                        <th>Count</th>
                                        <th>
                                            Percent
                                            <div onClick={() => this.sortFeaturesToggle(1)}>
                                                <FaSortNumericDesc />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        <div className="corner" />
                    </div>
                    <div className="middle">
                        <div className="heat">
                            <WebGLHeat
                                ref={r => {
                                    this.ref_webglheat = r ? r.getWrappedInstance() : null;
                                }}
                                masks={this.masks}
                                rwm={this.props}
                                featureList={this.featureData.raw}
                                setDistribution={this.setDistribution}
                                setExtentBox={this.setExtentBox}
                                setValues={this.setValues}
                                setInfoTable={this.setInfoTable}
                            />
                        </div>
                        <div className="vertline">
                            <svg
                                width="100%"
                                height="100%"
                                className="chart"
                                ref={r => {
                                    this.ref_chart["vertical"] = r;
                                }}
                            />
                        </div>
                        <QualityScanTable
                            ref={r => {
                                this.ref_QualityScanTable = r;
                            }}
                            featureList={this.featureData.raw}
                            setQualityInfo={(t, v) => this.setQualityInfo(t, v)}
                            finalizeTableHeaderFooter={() => this.finalizeTableHeaderFooter()}
                            mouseEnteredFeature={v => this.mouseEnteredFeature(v)}
                            mouseLeftFeature={() => this.mouseLeftFeature()}
                        />
                        <canvas
                            id="highlightCanvas"
                            ref={r => {
                                this.ref_highlightCanvas = r;
                            }}
                        />
                        <div
                            id="highlitArrow"
                            ref={r => {
                                this.ref_highlitArrow = r;
                            }}
                        />
                    </div>
                    <div className="bottom">
                        <div className="horiline">
                            <div
                                className="extentbox"
                                ref={r => {
                                    this.ref_extentbox = r;
                                }}
                                onMouseDown={e => this.extentBoxEvent("down", e)}
                                onMouseMove={e => this.extentBoxEvent("move", e)}
                                onMouseUp={e => this.extentBoxEvent("up", e)}
                            />
                            <svg
                                width="100%"
                                height="100%"
                                className="chart"
                                ref={r => {
                                    this.ref_chart["horizontal"] = r;
                                }}
                            />
                        </div>
                        <div className="corner">
                            <div
                                id="invertColors"
                                ref={r => {
                                    this.ref_invertColors = r;
                                }}
                                onClick={r => {
                                    this.invertColors();
                                }}
                            >
                                <MdInvertColorsOn />
                            </div>
                        </div>
                        <div className="totalsbar" ref={r => (this.ref_totalsbar = r)}>
                            <div />
                            <div />
                            <div />
                        </div>
                    </div>
                </div>
                <div
                    id="righter"
                    ref={r => {
                        this.ref_righter = r;
                    }}
                >
                    <QualityScanInfo
                        ref={r => {
                            this.ref_QualityScanInfo = r ? r.getWrappedInstance() : null;
                        }}
                        setMaskInputValue={(m, i, v) => this.setMaskInputValue(m, i, v)}
                        shiftInfoTable={o => this.shiftInfoTable(o)}
                        highlightByValue={(f, v) => this.highlightByValue(f, v)}
                        mouseLeftFeature={() => this.mouseLeftFeature()}
                    />
                </div>
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

export { QualityScan };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(QualityScan);
