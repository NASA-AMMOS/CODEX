import { formulas } from "../formulas/formulas";
import { invocation } from "../invocation/invocation";
import { parser } from "../parser/parser.js";
import { echartsThemes } from "./EchartsThemes.js";
import echarts from "echarts";
import BitArray from "bit-array-js";
import { controller } from "../Controller/controller";

// TODO: REMOVE THIS BANDAID
import { BANDAID_PATCH_STORE } from "../../index";
import { fileLoad } from "../../actions/data";

export default class Model {
    constructor() {
        this.activeModel = 0;
        this.nextGraphId = 0;
        this.models = {};
        this.vars = {
            featureFacts: [],
            layout: null,
            dragData: {}
        };
        this.listeners = {
            brushChange: [],
            featureChange: [],
            subsetChange: []
        };

        echarts.registerTheme("dark_theme", echartsThemes.getDarkTheme());
    }

    hasData() {
        if (this.models[this.activeModel]) return true;
        return false;
    }

    setActiveModel(activeModel) {
        this.activeModel = activeModel;
    }
    getActiveModel() {
        return this.models[this.activeModel];
    }
    updateModel(name, file, type, progressCallback, completeCallback) {
        if (!file) return;
        let blankModel = {
            filename: file.name,
            type: type,
            data: [],
            brushedRows: [],
            featuresCustomOrder: [],
            selectionsCustomOrder: [],
            subsetIds: [],
            subsets: null,
            progress: 0
        };
        this.parseFile(this.activeModel, file, type, progressCallback, () => {
            this.validateData(this.activeModel);
            completeCallback();
            this.setFeaturesCustomOrder();
            this.setSelectionsCustomOrder(); //Should be empty anyhow
            this.featuresChanged();
            BANDAID_PATCH_STORE.dispatch(fileLoad(this.models[this.activeModel].data, file.name));
        });
        this.models[this.activeModel] = blankModel;

        return this.models.length - 1;
    }

    validateData(activeModel = 0) {
        // replace spaces with _
        this.models[this.activeModel].data[0] = formulas.cleanStringArray(
            this.models[this.activeModel].data[0]
        );

        // rename duplicate headers
        let columnHeaders = [];
        for (let c = 0; c < this.models[this.activeModel].data[0].length; c++) {
            let idx = columnHeaders.indexOf(this.models[this.activeModel].data[0][c]);
            if (idx !== -1) {
                console.warn(
                    "File Parse CSV - Found a duplicate column: " +
                        this.models[this.activeModel].data[0][c]
                );
                this.models[this.activeModel].data[0][c] += "_DUPLICATE";
            }
            columnHeaders.push(this.models[this.activeModel].data[0][c]);
        }

        // remove empty columns
        for (let c = this.models[this.activeModel].data[0].length - 1; c > 0; c--) {
            if (this.models[this.activeModel].data[0][c].length === 0) {
                console.warn("File Parse CSV - Found an empty column: " + c);
                for (let r = 0; r < this.models[this.activeModel].data.length; r++) {
                    this.models[this.activeModel].data[r].splice(c, 1);
                }
            }
        }
    }

    connectGraphs(groupName) {
        echarts.connect(groupName);
    }

    getNewGraphId() {
        let toReturn = this.nextGraphId;
        this.nextGraphId++;
        return toReturn;
    }

    updateGroupId(graphId, groupId) {
        for (let l in this.listeners) {
            for (let i = 0; i < this.listeners[l].length; i++) {
                if (this.listeners[l][i].graphId === graphId) {
                    this.listeners[l][i].group = groupId;
                }
            }
        }
    }

    addListener(listenerName, listenerFunction, graphId, windowId, groupId) {
        if (this.listeners.hasOwnProperty(listenerName)) {
            this.listeners[listenerName].push({
                call: listenerFunction,
                graphId: graphId,
                windowId: windowId,
                group: groupId || null
            });
        }
    }
    removeAllListenersWithId(id) {
        for (let l in this.listeners) {
            if (this.listeners[l] && this.listeners[l].length > 0) {
                for (let i = this.listeners[l].length - 1; i >= 0; i--) {
                    if (this.listeners[l][i] && this.listeners[l][i].windowId === id) {
                        this.listeners[l].splice(i, 1);
                    }
                }
            }
        }
    }

    getFileName(activeModel = 0) {
        if (this.models[activeModel]) return this.models[activeModel].filename;
    }
    //IMPROVEMENT: Format data in column form maybe
    //subsetId:
    //  null for no subset
    //  string for one subset
    //  array of strings for many subsets all unioned together
    getSubColumns(colNames, subsetId, activeModel = 0) {
        let subColsData = [];
        let colIndexOrder = [];
        let isSet;

        if (subsetId && !Array.isArray(subsetId)) subsetId = [{ selection: subsetId }];

        let subsetIdIndex = [];
        if (subsetId) {
            for (let i = 0; i < subsetId.length; i++) {
                let ind = parseInt(
                    formulas.objectArrayIndexOfKeyWithValue(
                        this.models[activeModel].subsetIds,
                        "id",
                        subsetId[i].selection
                    ),
                    10
                );
                if (ind > -1) subsetIdIndex[i] = ind;
                else i--;
            }
        }

        for (let i = 0; i < colNames.length; i++) {
            colIndexOrder.push(this.models[activeModel].data[0].indexOf(colNames[i]));
        }

        for (let i = 0; i < this.models[activeModel].data.length; i++) {
            var rowData = [];

            //Union of all subsets
            isSet = false;
            if (subsetId) {
                for (let j = 0; j < subsetId.length; j++) {
                    let subsetSlot = Math.floor(subsetIdIndex[j] / 8);
                    if (
                        (this.models[activeModel].subsets[subsetSlot][i] &
                            (1 << subsetIdIndex[j])) !==
                        0
                    ) {
                        isSet = true;
                        break;
                    }
                }
            }
            if (isSet) {
                for (let j = 0; j < colIndexOrder.length; j++) {
                    rowData.push(
                        colIndexOrder[j] === -1
                            ? 0
                            : this.models[activeModel].data[i][colIndexOrder[j]]
                    );
                }
            } else if (!subsetId) {
                for (let j = 0; j < colIndexOrder.length; j++) {
                    rowData.push(
                        colIndexOrder[j] === -1
                            ? 0
                            : this.models[activeModel].data[i][colIndexOrder[j]]
                    );
                }
            }
            subColsData.push(rowData);
        }
        return subColsData;
    }
    getColumnInfo(activeModel = 0) {
        let colInfo = [];
        if (this.models[activeModel]) {
            for (let i = 0; i < this.models[activeModel].data[0].length; i++) {
                colInfo.push({
                    name: this.models[activeModel].data[0][i],
                    type: "0"
                });
            }
        }
        return colInfo;
    }
    getFeatures(activeModel = 0) {
        let features = [];
        if (this.models[activeModel]) {
            for (let i = 0; i < this.models[activeModel].data[0].length; i++) {
                features.push(this.models[activeModel].data[0][i]);
            }
        }
        return features;
    }
    getFeaturesCustomOrder(activeModel = 0) {
        return this.models[activeModel].featuresCustomOrder;
    }
    getSelectionsCustomOrder(activeModel = 0) {
        return this.models[activeModel].selectionsCustomOrder;
    }
    getSubsetInfo(activeModel = 0) {
        let subsetInfo = [];
        if (this.models[activeModel]) {
            for (let i = 0; i < this.models[activeModel].subsetIds.length; i++) {
                if (this.models[activeModel].subsetIds[i] !== null) {
                    let index = formulas.objectArrayIndexOfKeyWithValue(
                        subsetInfo,
                        "name",
                        this.models[activeModel].subsetIds[i].id
                    );

                    if (index !== -1) {
                        subsetInfo[index].parts.push(this.models[activeModel].subsetIds[i].subId);
                    } else {
                        subsetInfo.push({
                            selection: this.models[activeModel].subsetIds[i].id,
                            parts: [this.models[activeModel].subsetIds[i].subId]
                        });
                    }
                }
            }
        }
        return subsetInfo;
    }
    getFeaturesInfo(activeModel = 0) {
        return {
            column: this.models[activeModel].featuresCustomOrder,
            subset: this.models[activeModel].selectionsCustomOrder, //this.getSubsetInfo( activeModel ),
            featureset: []
        };
    }
    setFeaturesCustomOrder(newFeaturesCustomOrder, activeModel = 0) {
        if (newFeaturesCustomOrder)
            this.models[activeModel].featuresCustomOrder = newFeaturesCustomOrder;
        //default order
        else this.models[activeModel].featuresCustomOrder = this.getColumnInfo();
    }
    setSelectionsCustomOrder(newSelectionsCustomOrder, activeModel = 0) {
        if (newSelectionsCustomOrder)
            this.models[activeModel].selectionsCustomOrder = newSelectionsCustomOrder;
        //default order
        else this.models[activeModel].selectionsCustomOrder = this.getSubsetInfo();
    }
    setSelectionCustomOrderColor(selection, hex, activeModel = 0) {
        let index = formulas.objectArrayIndexOfKeyWithValue(
            this.models[activeModel].selectionsCustomOrder,
            "selection",
            selection
        );
        if (index !== -1) {
            this.models[activeModel].selectionsCustomOrder[index].color = hex;
            return true;
        }
        return false;
    }

    //For multidimensional features sets in row format [1,2],[1,2],[1,2],...
    addFeatures(featureName, features, activeModel = 0) {
        let addedNames = [];
        if (features && features[0]) {
            for (let i = 0; i < features[0].length; i++) {
                if (this.models[activeModel]) {
                    //make sure featureName is unique
                    let foundUniqueName = false;
                    let uniqueNameIndex = 0;
                    let testFeatureName = featureName;
                    while (!foundUniqueName) {
                        if (this.models[activeModel].data[0].includes(testFeatureName)) {
                            testFeatureName =
                                featureName + "_" + formulas.iToAlphabet(uniqueNameIndex);
                            uniqueNameIndex++;
                        } else {
                            foundUniqueName = true;
                        }
                    }

                    addedNames.push(testFeatureName);
                    this.models[activeModel].data[0].push(testFeatureName);
                    this.models[activeModel].featuresCustomOrder.push({
                        name: testFeatureName,
                        type: "0"
                    });
                    for (
                        let j = 1;
                        j < this.models[activeModel].data.length && j < features.length;
                        j++
                    ) {
                        this.models[activeModel].data[j].push(features[j][i]);
                    }
                }
            }
            this.featuresChanged();
        }
        return addedNames;
    }
    addFeature(featureName, feature, activeModel = 0) {
        if (this.models[activeModel]) {
            //make sure featureName is unique
            let foundUniqueName = false;
            let uniqueNameIndex = 0;
            let testFeatureName = featureName;
            while (!foundUniqueName) {
                if (this.models[activeModel].data[0].includes(testFeatureName)) {
                    testFeatureName = featureName + "_" + formulas.iToAlphabet(uniqueNameIndex);
                    uniqueNameIndex++;
                } else {
                    foundUniqueName = true;
                }
            }
            featureName = testFeatureName;

            this.models[activeModel].data[0].push(featureName);
            this.models[activeModel].featuresCustomOrder.push({ name: featureName, type: "0" });
            for (let i = 1; i < this.models[activeModel].data.length && i < feature.length; i++) {
                this.models[activeModel].data[i].push(feature[i]);
            }
            this.featuresChanged();
            return [featureName];
        }
        return [];
    }

    /**
     *
     * @param {string} mode - 'rect'
     * @param {{}} range - {x:[min.max], y:[min,max]} [mode == 'rect']
     *        {{}} range - {{x:v,y:v},{x:v,y:v},...}  [mode == 'freehand']
     * @param {string} xAxisFeature
     * @param {string} yAxisFeature
     * @param {*} activeModel
     * returns
     */
    setBrushedRowsArea(mode, range, xAxisFeature, yAxisFeature, group, activeModel = 0) {
        if (!group) return;
        //start with 0 to exclude header
        this.models[activeModel].brushedRows = []; //0 is unbrushed, 1 brushed

        let xFeatureI = this.models[activeModel].data[0].indexOf(xAxisFeature);
        let yFeatureI = this.models[activeModel].data[0].indexOf(yAxisFeature);
        if (xFeatureI === -1 || yFeatureI === -1) return;

        for (let i = 1; i < this.models[activeModel].data.length; i++) {
            if (
                mode === "rectangle" &&
                this.models[activeModel].data[i][xFeatureI] > range.x[0] &&
                this.models[activeModel].data[i][xFeatureI] < range.x[1] &&
                this.models[activeModel].data[i][yFeatureI] > range.y[0] &&
                this.models[activeModel].data[i][yFeatureI] < range.y[1]
            ) {
                this.models[activeModel].brushedRows.push(true);
            } else if (
                mode === "freehand" &&
                formulas.isPointInPoly(range, {
                    x: this.models[activeModel].data[i][xFeatureI],
                    y: this.models[activeModel].data[i][yFeatureI]
                })
            ) {
                this.models[activeModel].brushedRows.push(true);
            } else {
                this.models[activeModel].brushedRows.push(false);
            }
        }

        for (let i = 0; i < this.listeners.brushChange.length; i++) {
            if (
                this.listeners.brushChange[i].group != null &&
                this.listeners.brushChange[i].group === group
            ) {
                this.listeners.brushChange[i].call();
            }
        }
    }

    //DEPRECATED
    setBrushedRows(brushedRowsSelected, group, activeModel = 0) {
        if (!group) return;
        let isBrushed;

        this.models[activeModel].brushedRows = [false]; //0 is unbrushed, 1 brushed

        //Don't brush the brush
        for (let b = 0; b < brushedRowsSelected.length; b++) {
            if (brushedRowsSelected[b].seriesName === "Highlight") {
                brushedRowsSelected.splice(b, 1);
                break;
            }
        }

        let currentBrushI = new Array(brushedRowsSelected.length).fill(0);
        for (let i = 0; i < this.models[activeModel].data.length; i++) {
            isBrushed = false;
            for (let b = 0; b < brushedRowsSelected.length; b++) {
                if (brushedRowsSelected[b].dataIndex[currentBrushI[b]] === i) {
                    isBrushed = true;
                    currentBrushI[b]++;
                }
            }

            if (isBrushed) {
                this.models[activeModel].brushedRows.push(true);
            } else {
                this.models[activeModel].brushedRows.push(false);
            }
        }

        for (let i = 0; i < this.listeners.brushChange.length; i++) {
            if (
                this.listeners.brushChange[i].group != null &&
                this.listeners.brushChange[i].group === group
            ) {
                this.listeners.brushChange[i].call();
            }
        }
    }
    getBrushedRows(activeModel = 0) {
        return this.models[activeModel].brushedRows;
    }
    clearBrushedRows(activeModel = 0) {
        this.models[activeModel].brushedRows = [];
        controller.graphChanged();
    }
    featuresChanged() {
        for (let i = 0; i < this.listeners.featureChange.length; i++) {
            this.listeners.featureChange[i].call();
        }
    }
    //When multiple subsets change, changedId and changedSlot can be arrays
    // Alternatively changedId can be set to 'obj' and changedSlot can be an
    //  array of { id: , slot: } objects
    subsetsChanged(changeBy, changedId, changedSlot, activeModel = 0) {
        if (changedId === "obj") {
            for (let i = 0; i < changedSlot.length; i++) {
                this.subsetsChanged(changeBy, changedSlot[i].id, changedSlot[i].slot, activeModel);
            }
        } else if (changedId.constructor === Array) {
            if (changedSlot.constructor === Array && changedId.length === changedSlot.length) {
                for (let i = 0; i < changedId.length; i++) {
                    this.subsetsChanged(changeBy, changedId[i], changedSlot[i], activeModel);
                }
            } else console.error("SubsetsChanged Failed");
        } else {
            //Convert Subset to binary
            let binarySubset = this.getBinarySubset(changedSlot, activeModel);
            //Send subset to server
            invocation.invoke(
                {
                    routine: "arrange",
                    hashType: "selection",
                    activity: changeBy,
                    name: changedId,
                    data: binarySubset.data,
                    length: binarySubset.length
                },
                function() {
                    console.log("Subset " + changedId + " " + changeBy + "ed on the server.");
                }
            );
        }

        //Call all listeners
        for (let i = 0; i < this.listeners.subsetChange.length; i++) {
            this.listeners.subsetChange[i].call();
        }
    }

    getBinarySubset(slot = 0, activeModel) {
        let sm = Math.floor(slot / 8);
        let binarySubset = new BitArray(this.models[activeModel].subsets[sm].length - 1);

        //1 because first is the header
        for (let i = 1; i < this.models[activeModel].subsets[sm].length; i++) {
            binarySubset.value(
                i - 1,
                (this.models[activeModel].subsets[sm][i] & (1 << slot % 8)) !== 0
            );
        }
        binarySubset = binarySubset.toBase64();

        return { data: binarySubset, length: this.models[activeModel].subsets[sm].length - 1 };
    }

    /*Subsets are Uint8Arrays (see parseFile completeCallback below), one for each row
      SubsetIds ( a name string ) are saved in model[].subsetIds and their index
        corresponds to the bit index in the Uint8Array for that row:

        subsetIds = [ 'A', 'B', null, null, ..., null ]

        row1: value1, value2, value3, ... , 01000000
        row2: value1, value2, value3, ... , 01000000
        row3: value1, value2, value3, ... , 10000000

        Here row3 will belong to A while row1 and row2 belong to B

        Currently only supports one set of UInt8s.
        So as of now, there can only be a max of 8 subsets without adding more on.

    * @param filter - function(row) that returns true if that row should be in the selection
    */
    addSubsetFromFilter(subsetId, filter, activeModel = 0) {
        if (this.models[activeModel]) {
            //make sure subsetId is unique
            let foundUniqueId = false;
            let uniqueIdIndex = 0;
            let testSubsetId = subsetId;
            while (!foundUniqueId) {
                let wasMatched = false;
                for (let s = 0; s < this.models[activeModel].subsetIds.length; s++) {
                    if (this.models[activeModel].subsetIds[s].id === testSubsetId) {
                        wasMatched = true;
                        testSubsetId = subsetId + "_" + formulas.iToAlphabet(uniqueIdIndex);
                        uniqueIdIndex++;
                        break;
                    }
                }
                if (!wasMatched) foundUniqueId = true;
            }
            subsetId = testSubsetId;

            //find next null subset slot
            let subsetSlot = null;
            for (let i = 0; i < this.models[activeModel].subsetIds.length; i++) {
                if (this.models[activeModel].subsetIds[i] === null) {
                    subsetSlot = i;
                    break;
                }
            }
            if (subsetSlot === null) subsetSlot = this.models[activeModel].subsetIds.length;
            if (subsetSlot !== null) {
                let sm = Math.floor(subsetSlot / 8);
                if (this.models[activeModel].subsets[sm] === undefined) {
                    this.models[activeModel].subsets[sm] = new Uint8Array(
                        this.models[activeModel].data.length
                    ).fill(0);
                }
                this.models[activeModel].subsetIds[subsetSlot] = { id: subsetId, subId: 0 };
                this.models[activeModel].selectionsCustomOrder.push({
                    selection: subsetId,
                    color: controller.vars.selectionsColorPalette[subsetSlot],
                    subId: 0
                });

                for (let i = 1; i < this.models[activeModel].data.length; i++) {
                    if (filter(this.models[activeModel].data[i])) {
                        this.models[activeModel].subsets[sm][i] =
                            this.models[activeModel].subsets[sm][i] | (1 << subsetSlot % 8);
                    } else {
                        this.models[activeModel].subsets[sm][i] =
                            this.models[activeModel].subsets[sm][i] | (0 << subsetSlot % 8);
                    }
                }
            }

            this.subsetsChanged("add", subsetId, subsetSlot, activeModel);
            return true;
        }
    }

    addSubsetPreview(subsetId, filter, activeModel = 0) {
        if (this.models[activeModel]) {
            for (let i = 1; i < this.models[activeModel].data.length; i++) {
                filter(this.models[activeModel].data[i]);
            }
        }
    }

    /**
     * Splits each number in a data array into its own selection
     *
     * @param subsetId - Unique name to call the subset
     * @param filter - Array of data (eg. [0,1,4,5,4,1,2,2,0,1,3])
     * @param numFilters - How many filters/selections to make (eg. 2 would mean take 0 and 1, 3 would mean take 0, 1 and 2)
     * @param numOffset - Offset all filter numbers (2 numFilters with 1 numOffset would take 1 and 2 )
     */
    addFilter(subsetId, filter, numFilters, numOffset = 0, dontTurnOn, activeModel = 0) {
        let addedSubsets = [];
        if (this.models[activeModel]) {
            //make sure subsetId is unique
            let foundUniqueId = false;
            let uniqueIdIndex = 0;
            let testSubsetId = subsetId;
            let allUsedSubsetSlotsAndIds = [];

            while (!foundUniqueId) {
                let wasMatched = false;
                for (let s = 0; s < this.models[activeModel].subsetIds.length; s++) {
                    if (
                        this.models[activeModel].subsetIds[s] !== null &&
                        this.models[activeModel].subsetIds[s].id === testSubsetId
                    ) {
                        wasMatched = true;
                        testSubsetId = subsetId + "_" + formulas.iToAlphabet(uniqueIdIndex);
                        uniqueIdIndex++;
                        break;
                    }
                }
                if (!wasMatched) foundUniqueId = true;
            }
            subsetId = testSubsetId;

            let subsetSlot = null;
            for (let f = 0; f < numFilters; f++) {
                //find next null subset slot
                subsetSlot = null;
                for (let i = 0; i < this.models[activeModel].subsetIds.length; i++) {
                    if (this.models[activeModel].subsetIds[i] === null) {
                        subsetSlot = i;
                        break;
                    }
                }
                if (subsetSlot === null) subsetSlot = this.models[activeModel].subsetIds.length;
                if (subsetSlot !== null) {
                    let sm = Math.floor(subsetSlot / 8);
                    if (this.models[activeModel].subsets[sm] === undefined) {
                        this.models[activeModel].subsets[sm] = new Uint8Array(
                            this.models[activeModel].data.length
                        ).fill(0);
                    }
                    let subsetIdF = f > 0 ? subsetId + "_" + f : subsetId;
                    addedSubsets.push({
                        selection: subsetIdF,
                        type: "selection",
                        color: controller.vars.selectionsColorPalette[subsetSlot],
                        parts: undefined
                    });
                    allUsedSubsetSlotsAndIds.push({ slot: subsetSlot, id: subsetIdF });
                    this.models[activeModel].subsetIds[subsetSlot] = { id: subsetIdF, subId: f };
                    this.models[activeModel].selectionsCustomOrder.push({
                        selection: subsetIdF,
                        color: controller.vars.selectionsColorPalette[subsetSlot],
                        subId: f
                    });
                    for (let i = 1; i < this.models[activeModel].data.length; i++) {
                        if (filter[i] === f + numOffset) {
                            this.models[activeModel].subsets[sm][i] =
                                this.models[activeModel].subsets[sm][i] | (1 << subsetSlot % 8);
                        } else {
                            this.models[activeModel].subsets[sm][i] =
                                this.models[activeModel].subsets[sm][i] | (0 << subsetSlot % 8);
                        }
                    }
                }
            }

            //Default these to be on
            if (!dontTurnOn) {
                for (let i = 0; i < allUsedSubsetSlotsAndIds.length; i++) {
                    controller.addChosenSelection(
                        allUsedSubsetSlotsAndIds[i].id,
                        "selection",
                        controller.vars.selectionsColorPalette[allUsedSubsetSlotsAndIds[i].slot]
                    );
                }
            }
            //Remove highlight
            this.models[activeModel].brushedRows = [];
            controller.graphChanged();
            //Update all changes //controller.addChosenSelection already does this
            this.subsetsChanged("add", "obj", allUsedSubsetSlotsAndIds, activeModel);
        }
        return addedSubsets;
    }
    renameSelection(currentName, newName, activeModel = 0) {
        //make sure subsetId name will be unique
        for (let s = 0; s < this.models[activeModel].subsetIds.length; s++) {
            if (this.models[activeModel].subsetIds[s].id === newName) return false;
        }
        //make sure customOrder name will be unique too
        let index = formulas.objectArrayIndexOfKeyWithValue(
            this.models[activeModel].selectionsCustomOrder,
            "selection",
            currentName
        );
        if (index === -1) return false;

        //now rename them
        for (let s = 0; s < this.models[activeModel].subsetIds.length; s++) {
            if (this.models[activeModel].subsetIds[s].id === currentName) {
                this.models[activeModel].subsetIds[s].id = newName;
                break;
            }
        }
        this.models[activeModel].selectionsCustomOrder[index].selection = newName;

        return true;
    }
    deleteSelection(selection, activeModel = 0) {
        for (let i = 0; i < this.models[activeModel].subsetIds.length; i++) {
            //Find the subsetId to delete
            //Note: this isn't deleting the selection mask per se just removing the reference to it
            // Creating another selection would then overwrite this deleted one
            if (
                this.models[activeModel].subsetIds[i] !== null &&
                this.models[activeModel].subsetIds[i].id === selection
            ) {
                this.models[activeModel].subsetIds[i] = null;

                //Reset its bit to 0
                console.log(10, 1 << 1, ~(1 << 1), 10 & ~(1 << 1));
                /*
                let sm = Math.floor( i / 8 );
                for( let b = 1; b < this.models[activeModel].data.length; b++ ) {
                    this.models[activeModel].subsets[sm][b] = this.models[activeModel].subsets[sm][b] & ~(0 << (i % 8)); 
                }
                */

                //Remove model's knowledge of it
                for (let s = 0; s < this.models[activeModel].selectionsCustomOrder.length; s++) {
                    if (this.models[activeModel].selectionsCustomOrder[s].selection === selection) {
                        this.models[activeModel].selectionsCustomOrder.splice(s, 1);
                        break;
                    }
                }

                //Remove controller's knowledge of it and update
                controller.removeChosenSelection(selection);

                //Remove highlight
                this.models[activeModel].brushedRows = [];
                controller.graphChanged();

                this.subsetsChanged("delete", selection, i, activeModel);
                return;
            }
        }
    }

    getFeaturesAutoComplete() {
        let colInfo = this.getColumnInfo();
        let columns = [];
        for (let i = 0; i < colInfo.length; i++) {
            columns.push(colInfo[i].name);
        }
        return columns;
    }

    quickselect(arr, k, left, right, compare) {
        this.quickselectStep(
            arr,
            k,
            left || 0,
            right || arr.length - 1,
            compare || this.defaultCompare
        );
    }

    quickselectStep(arr, k, left, right, compare) {
        while (right > left) {
            if (right - left > 600) {
                var n = right - left + 1;
                var m = k - left + 1;
                var z = Math.log(n);
                var s = 0.5 * Math.exp((2 * z) / 3);
                var sd = 0.5 * Math.sqrt((z * s * (n - s)) / n) * (m - n / 2 < 0 ? -1 : 1);
                var newLeft = Math.max(left, Math.floor(k - (m * s) / n + sd));
                var newRight = Math.min(right, Math.floor(k + ((n - m) * s) / n + sd));
                this.quickselectStep(arr, k, newLeft, newRight, compare);
            }

            var t = arr[k];
            var i = left;
            var j = right;

            this.swap(arr, left, k);
            if (compare(arr[right], t) > 0) this.swap(arr, left, right);

            while (i < j) {
                this.swap(arr, i, j);
                i++;
                j--;
                while (compare(arr[i], t) < 0) i++;
                while (compare(arr[j], t) > 0) j--;
            }

            if (compare(arr[left], t) === 0) this.swap(arr, left, j);
            else {
                j++;
                this.swap(arr, j, right);
            }

            if (j <= k) left = j + 1;
            if (k <= j) right = j - 1;
        }
    }

    swap(arr, i, j) {
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    defaultCompare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    getStandardDeviation(arr) {
        let avg = this.average(arr);

        let squareDiffs = arr.map(function(value) {
            let diff = value - avg;
            let sqrDiff = diff * diff;
            return sqrDiff;
        });

        let avgSquareDiff = this.average(squareDiffs);

        let stdDev = Math.sqrt(avgSquareDiff);
        return stdDev;
    }

    average(arr) {
        let sum = arr.reduce(function(sum, value) {
            return sum + value;
        }, 0);

        let avg = sum / arr.length;
        return avg;
    }

    /** Computes min, max, mean, mode, type, percent NaN, Inf */
    computeFeatureFacts() {
        let colInfo = this.getColumnInfo();
        let featureFacts = this.vars.featureFacts;
        let points = this.models[0].data;
        let totalPoints = 0;
        for (let i = 0; i < colInfo.length; i++) {
            this.vars.featureFacts.push({
                totalPoints: 0,
                feature: colInfo[i].name,
                max: Number.MIN_SAFE_INTEGER,
                min: Number.MAX_SAFE_INTEGER,
                mean: 0,
                mode: 0,
                type:
                    !isNaN(points[1][i]) === true
                        ? Number.isInteger(points[1][i])
                            ? "Integer"
                            : "Float"
                        : "Tokenized String",
                notNumber: 0,
                notNumberPercentage: "",
                inf: 0,
                infPercentage: "",
                totalDigits: 0,
                nanMean: 0,
                median: 0,
                stdDev: 0,
                modeMap: {},
                maxEl: points[1][colInfo[i]],
                maxCount: 1,
                featureArray: []
            });
        }
        for (let i = 0; i < points.length; i++) {
            totalPoints++;
            for (let j = 0; j < featureFacts.length; j++) {
                if (isNaN(points[i][j])) {
                    if (points[i][j] && points[i][j].toLowerCase() === "inf") {
                        featureFacts[j].inf += 1;
                    } else {
                        featureFacts[j].notNumber += 1;
                    }
                } else {
                    featureFacts[j].featureArray.push(points[i][j]);
                    let el = points[i][j];
                    if (featureFacts[j].modeMap[el] == null) featureFacts[j].modeMap[el] = 1;
                    else featureFacts[j].modeMap[el]++;

                    if (featureFacts[j].modeMap[el] > featureFacts[j].maxCount) {
                        featureFacts[j].maxEl = el;
                        featureFacts[j].maxCount = featureFacts[j].modeMap[el];
                    }

                    featureFacts[j].totalDigits++;
                    if (points[i][j] > featureFacts[j].max) {
                        featureFacts[j].max = points[i][j];
                    }
                    if (points[i][j] < featureFacts[j].min) {
                        featureFacts[j].min = points[i][j];
                    }
                    //can cause overflow
                    featureFacts[j].nanMean = featureFacts[j].mean += points[i][j];
                }
            }
        }
        //this mean does not ignore NaN values
        for (let i = 0; i < featureFacts.length; i++) {
            featureFacts[i].mean /= totalPoints;
            featureFacts[i].totalPoints = totalPoints;
            this.quickselect(
                featureFacts[i].featureArray,
                Math.ceil(featureFacts[i].totalDigits / 2)
            );
            featureFacts[i].stdDev = this.getStandardDeviation(featureFacts[i].featureArray);
            featureFacts[i].median =
                featureFacts[i].featureArray[Math.ceil(featureFacts[i].totalDigits / 2)];
            featureFacts[i].notNumberPercentage =
                String(Math.round(((featureFacts[i].notNumber / totalPoints) * 100 * 100) / 100)) +
                "%";
            featureFacts[i].infPercentage =
                String(Math.round(((featureFacts[i].inf / totalPoints) * 100 * 100) / 100)) + "%";
            if (featureFacts[i].maxEl === undefined) {
                featureFacts[i].mode = "No Mode";
            } else {
                featureFacts[i].mode = featureFacts[i].maxEl;
            }
            if (!featureFacts[i].totalDigits) {
                featureFacts[i].nanMean = NaN;
                featureFacts[i].max = NaN;
                featureFacts[i].min = NaN;
                featureFacts[i].mean = NaN;
                featureFacts[i].mode = NaN;
            } else {
                //this mean ignores NaN's
                featureFacts[i].nanMean /= featureFacts[i].totalDigits;
            }
        }
        this.vars.featureFacts = featureFacts;
    }

    setDragData(dragData) {
        this.vars.dragData = dragData;
    }
    getDragData() {
        return this.vars.dragData;
    }
    releaseDragData() {
        this.vars.dragData = {};
    }

    parseFile(name, file, type, progressCallback, completeCallback) {
        let that = this;
        parser.parseFile(
            file,
            type,
            function(data, progress) {
                that.models[name].data.push(data);
                that.models[name].progress = progress;
                if (typeof progressCallback === "function") {
                    progressCallback(progress);
                }
            },
            function() {
                that.models[name].subsets = [];
                that.models[name].subsetIds = [];
                if (typeof completeCallback === "function") {
                    completeCallback();
                }
            }
        );
    }
}

export let model = new Model();
