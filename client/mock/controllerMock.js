export default class Controller {
    constructor() {
    }
    globalKeyDown( e ) {
    }
    //PANEL
    setPanel( open ) {
    }
    getPanelOpen() {
    }
    addPanelOpenListener( listenerId, listenerFunction ) {
    }
    callAllPanelOpenUpdate() {
    }
    removeAllListenersWithId( id ) {
    }
    removeListener( name, matchKey, matchValue ) {
    }
    getAnID() {
    }
    unsubscribeChosenFeaturesUpdate( chosenFeaturesUpdateFunction, id ) {
    }
    subscribeChosenFeaturesUpdateMiddleWare( chosenFeaturesUpdateMiddleWareFunction, id, idsToIntercept ) {
    }
    unsubscribeChosenFeaturesMiddleWareUpdate( chosenFeaturesUpdateFunction, id ) {
    }
    getMiddleware( id, type = 'feature' ) {
    }
    callAllChosenFeaturesUpdate() {
    }
    addChosenFeature( feature, type, parts ) {
    }
    setChosenFeatures( chosenFeatures ) {
    }
    getChosenFeatures( type ) {
    }
    removeChosenFeature( feature ) {
    }
    toggleChosenFeature( feature, forceTo, isShift ) {
    }
    clearAllChosenFeatures() {
    }
    clearAllChosenSelections() {
    }
    //CHOSEN SELECTIONS
    subscribeChosenSelectionsUpdate( chosenSelectionsUpdateFunction, id ) {
    }
    unsubscribeChosenSelectionsUpdate( chosenSelectionsUpdateFunction, id ) {
    }
    subscribeChosenSelectionsUpdateMiddleWare( chosenSelectionsUpdateMiddleWareFunction, id, idsToIntercept ) {
    }
    unsubscribeChosenSelectionsMiddleWareUpdate( chosenSelectionsUpdateFunction, id ) {
    }
    getSelectionsMiddleware( id ) {
    }
    callAllChosenSelectionsUpdate() {
    }
    addChosenSelection( selection, type, color, parts ) {
    }
    setChosenSelections( chosenSelections ) {
    }
    getChosenSelections( type ) {
    }
    removeChosenSelection( selection ) {
    }
    toggleChosenSelection( selection, color, forceTo, isShift, stopRefresh ) {
    }
    setSelectionsColorPalette( selection, i, hex ) {
    }
    //returns true if renamed, false if not (error such as duplicate name)
    renameSelection( currentName, newName ) {
    }
    subscribeAllFeaturesToggle( allFeaturesToggleFunction ) {
    }
    toggleAllFeatures() {
    }
    setDragData( dragData ) {
    }
    getDragData() {
    }
    releaseDragData() {
    }
    setDrawers( to ) {
    }
    setTopBarMode( to, brushType ) {
    }
    refreshTopBarMode() {
    }
    addGenericGraph( id, it ) {
    }
    removeGenericGraph( id ) {
    }
    setMessage( message, status ) {
    }
    toggleIndeterminateLoadingBar( on, message ) {
    }
    addNewGraph( name, xaxis, yaxis, subsets, randomFeatures ) {
    }
    addGraphListener( listenerId, listenerFunction ) {
    }
    addGraphReceiveListener( listenerId, listenerFunction ) {
    }
    addGraphLinkListener( listenerId, listenerFunction ) {
    }
    addGraphStyleListener( listenerId, listenerFunction ) {
    }
    getGraphs() {
    }
    getAlgorithm( algo ) {
    }
    getAlgoSubalgo( algo, subalgo ) {
    }
    getGraphByType( type ) {
    }
    graphChanged( id ) {
    }
    graphLinkChanged() {
    }
    setLinkPosition( x, y ) {
    }
    getLinkPosition() {
    }
    emphasizeSelection( selectionName ) {
    }
    deEmphasizeSelection( selectionName ) {
    }
    //First column is x, second column is y and first subset is subset
    getChosenXYSubset() {
    }
    getGroups() {
    }
    subscribeSetAlgorithm( setAlgorithmFunction ) {
    }
    openAlgorithm( name, type ) {
    }
    setNameSubstart( substart ) {
    }
    getNameSubstart() {
    }
    addNameSubstartListener( listenerId, listenerFunction ) {
    }
    callAllNameSubstartUpdate() {
    }
    subscribesSetLoadingPercent( f ) {
    }
    dev( methodName ) {
    }
}

export let controller = new Controller();
