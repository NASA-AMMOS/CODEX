import { useState, useEffect } from "react";

import { selectFeatureGroup } from "../../actions/data";
import {
    useActiveWindow,
    useSetWindowNeedsAutoscaleById,
    useWindowList
} from "../../hooks/WindowHooks";
import {
    useCurrentSelection,
    useFeatureGroups,
    useFeatureMetadata,
    useSaveCurrentSelection,
    useSavedSelections,
    useSelectFeatureGroup,
    useSelectionGroups,
    useSetFeatureSelect,
    useSetSelectionActive,
    useSetSelectionGroupActive
} from "../../hooks/DataHooks";
import { useGlobalChartState, useStatsPanelHidden } from "../../hooks/UIHooks";
import { useKey } from "../../hooks/UtilHooks";
import * as windowTypes from "../../constants/windowTypes";

function KeyboardHandler(props) {
    const [disableHotkeys, setDisableHotkeys] = useState(false);

    useEffect(_ => {
        function isKeyboardInput(e) {
            if (e.target.tagName !== "INPUT") return false;
            const inputType = e.target.getAttribute("type");
            return inputType === "text" || inputType === "number";
        }

        function handleTextFocus(focus) {
            return e => {
                if (isKeyboardInput(e)) setDisableHotkeys(focus);
            };
        }
        window.addEventListener("focusin", handleTextFocus(true));
        window.addEventListener("focusout", handleTextFocus());
        return _ => {
            window.removeEventListener("focusin", handleTextFocus);
            window.removeEventListener("focusout", handleTextFocus);
        };
    }, []);

    // Backtick ("`") deselects all features
    const featureList = useFeatureMetadata();
    const [groups] = useFeatureGroups();
    const selectFeature = useSetFeatureSelect();
    const selectFeatureGroup = useSelectFeatureGroup();
    const backtick = useKey("`");
    useEffect(
        _ => {
            if (disableHotkeys) return;
            if (backtick) {
                featureList.forEach(feature => selectFeature(feature.get("name"), false));
                groups.forEach(group => selectFeatureGroup(group.get("id"), false));
            }
        },
        [backtick]
    );

    // Tilde ("~") deselects all selections
    const [selections] = useSavedSelections();
    const [selectionGroups] = useSelectionGroups();
    const setSelectionActive = useSetSelectionActive();
    const setGroupActive = useSetSelectionGroupActive();
    const tilde = useKey("~");
    useEffect(
        _ => {
            if (disableHotkeys) return;
            if (tilde) {
                selections.forEach(sel => setSelectionActive(sel.id, false));
                selectionGroups.forEach(group => setGroupActive(group.id, false));
            }
        },
        [tilde]
    );

    // Graph selection tools
    const [previousChartState, setPreviousChartState] = useState();
    const [globalChartState, setGlobalChartState] = useGlobalChartState();

    // "s" toggles lasso
    const sKey = useKey("s");
    useEffect(
        _ => {
            if (disableHotkeys) return;
            if (sKey) {
                if (!previousChartState) setPreviousChartState(globalChartState);
                setGlobalChartState("lasso");
            } else {
                if (previousChartState) setGlobalChartState(previousChartState);
                setPreviousChartState(null);
            }
        },
        [sKey]
    );

    // "z" toggles zoom
    const zKey = useKey("z");
    useEffect(
        _ => {
            if (disableHotkeys) return;
            if (zKey) {
                if (!previousChartState) setPreviousChartState(globalChartState);
                setGlobalChartState("zoom");
            } else {
                if (previousChartState) setGlobalChartState(previousChartState);
                setPreviousChartState(null);
            }
        },
        [zKey]
    );

    // spacebar toggles pan
    const spacebar = useKey(" ", { preventDefault: true });
    useEffect(
        _ => {
            if (disableHotkeys) return;
            if (spacebar) {
                if (!previousChartState) setPreviousChartState(globalChartState);
                setGlobalChartState("pan");
            } else {
                if (previousChartState) setGlobalChartState(previousChartState);
                setPreviousChartState(null);
            }
        },
        [spacebar]
    );

    // "S" (caps) saves current selection
    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const saveCurrentSelection = useSaveCurrentSelection();
    const SKey = useKey("S");
    useEffect(
        _ => {
            if (disableHotkeys) return;
            if (SKey) saveCurrentSelection();
        },
        [SKey]
    );

    // "Z" caps resets zoom level if currently active window is a chart
    const [activeWindowId] = useActiveWindow();
    const windowList = useWindowList();
    const activeWindow = windowList.find(win => win.get("id") === activeWindowId);
    const graphWindowActive =
        activeWindow && windowTypes.graphs.includes(activeWindow.get("windowType"));
    const setWindowNeedsAutoscale = useSetWindowNeedsAutoscaleById();
    const ZKey = useKey("Z");
    useEffect(
        _ => {
            if (disableHotkeys) return;
            if (ZKey && graphWindowActive) setWindowNeedsAutoscale(activeWindowId, true);
        },
        [ZKey]
    );

    // "t" key toggles the stats panel on the feature list on and off
    const [statsHidden, setStatsHidden] = useStatsPanelHidden();
    const tKey = useKey("t");
    useEffect(
        _ => {
            if (disableHotkeys) return;
            if (tKey) {
                setStatsHidden(!statsHidden);
            }
        },
        [tKey]
    );

    // "shift-F" keys toggle fullscreen
    const fKey = useKey("f");
    useEffect(() => {
        if (disableHotkeys) return;
        if (!fKey) return;
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, [fKey]);

    return null;
}

export default KeyboardHandler;
