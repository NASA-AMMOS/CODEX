import React, { Component } from "react";

import "./QualityScanTable.css";

class QualityScanTable extends Component {
    constructor(props) {
        super(props);

        this.state = {
            featureList: this.props.featureList
        };

        this.ref_featureTableTR = [];
    }

    setFeatureList(fl) {
        this.setState({ featureList: fl });
    }

    makeFeatureTable(featureList) {
        let featureTableElements = [];
        for (let i = 0; i < featureList.length; i++) {
            featureTableElements.push(
                <tr
                    key={i}
                    ref={r => (this.ref_featureTableTR[i] = r)}
                    onClick={() => this.props.setQualityInfo("feature", i)}
                    onMouseEnter={() => this.props.mouseEnteredFeature(i)}
                    onMouseLeave={() => this.props.mouseLeftFeature(i)}
                    style={{ display: featureList[i].hidden ? "none" : "table-row" }}
                >
                    <td className="tableFeatureName" title={featureList[i].name}>
                        {featureList[i].name}
                    </td>
                    <td>{featureList[i].count}</td>
                    <td title={featureList[i].percentRaw}>{featureList[i].percent}</td>
                </tr>
            );
        }

        return featureTableElements;
    }

    getTableRef() {
        return this.ref_featurelist;
    }
    /**
     *
     * @param {int || 'visible'} i
     */
    getTRRef(i) {
        if (i === "visible") {
            //return the first visible tr
            for (let f in this.state.featureList) {
                if (this.state.featureList[f].hidden === false) return this.ref_featureTableTR[f];
            }
        }
        return this.ref_featureTableTR[i];
    }
    getTRRefs() {
        return this.ref_featureTableTR;
    }
    getWidth() {
        return this.ref_featurelist.getBoundingClientRect().width;
    }

    componentDidUpdate() {
        this.props.finalizeTableHeaderFooter();
    }

    render() {
        return (
            <div className="QualityScanTable">
                <table
                    id="featureTable"
                    ref={r => {
                        this.ref_featurelist = r;
                    }}
                    cellPadding="0"
                    cellSpacing="0"
                    border="0"
                >
                    <tbody>{this.makeFeatureTable(this.state.featureList)}</tbody>
                </table>
            </div>
        );
    }
}

export default QualityScanTable;
