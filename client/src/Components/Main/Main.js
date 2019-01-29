import React, { Component } from "react";
import "./Main.css";
import View from "../View/View.js";

import { manager } from "../RWindowManager/manager/manager";

import GraphWork from "../GraphWork/GraphWork.js";
import Algorithmspace from "../Algorithmspace/Algorithmspace";
import { SparklineRangeDebugger } from "../SparklineRange/SparklineRange";

class Main extends Component {
    constructor() {
        super();
        //Add components to our window manager
        manager.subscribeComponent("GraphWork", GraphWork);
        manager.subscribeComponent("AlgorithmSpace", Algorithmspace);

        // debug?
        manager.subscribeComponent("SparklineRange", SparklineRangeDebugger);
    }

    render() {
        return (
            <div className="Main">
                <View />
            </div>
        );
    }
}

export default Main;
