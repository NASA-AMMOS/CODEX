import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useWindowManager } from "hooks/WindowHooks";
import React, { useRef, useState, useEffect } from "react";

/*
    Parent component of this file that contains all of the ui for 
    the Find More Like This workflow
*/
function GeneralClassifier(props) {

    return (
        <React.Fragment>
            Test
        </React.Fragment>
    );
}

// wrapped data selector
export default props => {
    const win = useWindowManager(props, {
        width: 750,
        height: 500,
        resizeable: true,
        title: "General Classifier"
    });

   
    return (
        <GeneralClassifier/>
    );
};