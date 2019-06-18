import { useSelector, useStore, useDispatch } from "react-redux";
import * as uiActions from "actions/ui";

/**
 * Get current global graph state
 * @return tuple of getter/setter for global chart state
 */
export function useGlobalChartState() {
    const dispatch = useDispatch();
    const gcs = useSelector(state => state.ui.get("globalChartState"));

    return [gcs, state => dispatch(uiActions.changeGlobalChartState(state))];
}
