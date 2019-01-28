/**
 * Data selection tools. These are intended to be used in container elements,
 * in order to simplify the process of integrating redux
 * @see docs/redux_docs.md
 * @author Patrick Kage
 */

import { Seq, List, Map, mergeWith } from 'immutable'

/**
 * Get the list of features
 * @param {Map} domain current domain structure (or data structure)
 * @return {List} list of features
 */
export const getFeatures = (domain) => {
    const rows = domain.has('data') ? domain.get('data') : domain
    return (rows === undefined || rows === null ) ? List() : rows.get(0)
}

/**
 * Get the list of selected features
 */
export const getSelectedFeatures = (domain) => {
	return domain.get('selected_features')
}

/**
 * Get the list of all features, along with whether or not they are selected
 * @param {Map} domain current domain structure
 * @return {List} list of tuples of (feature, selected)
 */
export const getFeaturesWithSelected = (domain) => {
    return getFeatures(domain).map(
        f => List.of(f, domain.get('selected_features').has(f))
    )
}

/**
 * Get the current filename
 * @param {Map} domain current domain structure
 * @return {string} current filename (or null)
 */
export const getFilename = (domain) => domain.get('filename')

/**
 * Get a column from the loaded data
 * @param {Map} domain current domain structure
 * @param {string} feature feature name
 * @return {List} list of numbers
 */
export const getColumn = (domain, feature) => {
    // figure out which column we're selecting
    const targetCol = domain.get('data').get(0).indexOf(feature)

    if (targetCol === -1) {
        return List()
    }

    const col = Seq(domain.get('data'))
        .rest()				            // exclude the first row (headers)
        .map(row => row.get(targetCol)) // for each row, get the target column

    return col
}

/**
 * Gets a list of in-order (last = highest layer) selection that are on
 * @param {Map} domain
 * @return {List} - [{name:'Selection1',color:'blue',emph}, {}, ... ]
 */
export const getActiveSelectionNames = (domain) => {
    // just push visible selection names into a list
    return domain.get('selections')
        .filter(sel => sel.get('visible'))
        .map(sel => Map({
            'name': sel.get('name'),
            'color': sel.get('color'),
            'emphasize': sel.get('emphasize')
        }))
}

/**
 * Return a list of selection names with the matching key value meta
 * @param {Map} domain
 * @param {} key - meta key
 * @param {} value - meta key value to match
 * @return {List} - {[{name:'Selection1',color:'blue',emph}, {}, ... ]}
 */
export const getSelectionNamesByMeta = (domain, key, value) => {
    // just push visible selection names into a list
    return domain.get('selections')
        .filter(sel => sel.getIn(['meta', key]) === value ) 
        .map(sel => Map({
            'name': sel.get('name'),
            'color': sel.get('color'),
            'emphasize': sel.get('emphasize')
        }))
}

/**
 * Get the final selection array from the state.
 * @param domain
 * @return array of colors + boolean emphasis
 */
export const getFinalSelectionArray = (domain) => {
    // Seq does not lack a fold, i'm just stupid and forgot that it's called
    // a "reduce" outside of haskell

    // Essentially this algorithm is: for each mask, map either a null or 
    // a (color, emphasis) tuple onto it, then right reduce them into 
	// final mask (or null) with a merge. Right reduction here means that the
	// leftmost selection (the brush) has the highest precedence. The final
	// step is to replace all remaining null values with a default value

    // default color
    /*
    const default_tuple = ['#0069e0', false]

    // step one: map each selection object into an array of tuples
    const masks = domain.get('selections')
        .map(sel => {
            // multi-line for readability, tuple cached for performance
			const tuple = [sel.get('color'), sel.get('emphasize')]
            return sel.get('mask').map(
                val => val ? tuple : null
            )
        })
    
    console.log( domain.get('selections').toJS() );


    // reduce the array of masks to a single mask array
    const finalMask = masks.reduceRight((acc, value) => {
		// see mergeWith docs from immutable
		return acc.mergeWith(
			(left, right) => (right === null) ? left : right,
			acc,
			value
		)
    })


    // fill in the gaps with the default value
    return finalMask.map(el => (el === null) ? default_tuple : el)
    
    const masks = domain.get('selections')
        .map(sel => {
            // multi-line for readability, tuple cached for performance
			const tuple = [sel.get('color'), sel.get('emphasize')]
            return sel.get('mask').map(
                val => val ? tuple : null
            )
        })
    */
    //Go backwards over each selection mask element
    // finding the color of the first visible and selected element
    let selectionArray = []
    let sels = domain.get('selections');
    let masterSel = domain.get('master');
    let masterMask = masterSel.get('mask');
    for( let m = 0; m < masterMask.size; m++ ) {
        selectionArray.push([masterSel.get('color'), masterSel.get('emphasize')]);
        for( let s = sels.size - 1; s >= 0; s-- ) {
            const sel = sels.get(s);
            if( sel.get('visible') &&
                sel.get('mask').get(m) ) {
                selectionArray[selectionArray.length - 1]
                    = [sel.get('color'), sel.get('emphasize')];
                break;
            }
        }
    }
    return List(selectionArray);
}

/**
 * Create points from features
 * @param {Map} domain data domain
 * @param {string} xfeature first feature
 * @param {string} yfeature second fetaure
 * @returns {List} of columns
 */
export const getPoints = (domain, xfeature, yfeature) => {
	return getColumn(domain, xfeature).zip(getColumn(domain, yfeature))
}

/**
 * Zip together features and selections
 * @param {array} point point array
 * @param {array} selections solved selections array
 */
export const zipPointsAndSelections = (points, selections) => {
    return points.zip(selections)
}

/**
 * Gets multiple feature data masked by a selection
 * @param {Map} domain - current domain structure 
 * @param {List} featureNames
 * @param {string} type - 'master' || 'brush' || 'selections'
 * @param {string} selectionName 
 * 
 * @example (domain, 'letter', 'frequency', 'selections', 'consonants') ->
 * @return  [[],['b', 0.061], ... , ['z',0.004]]
 */
export const getFeaturesMasked = (domain, xfeature, yfeature, type, selectionName) => {
    // get the points
    let points = getPoints( domain, xfeature, yfeature )

    // get the master, brush or selection
    let mask = domain.get( type )
    if( type === 'selections' )
        mask = mask.find( obj => { return obj.get( 'name' ) === selectionName; } )
    
    // if we have a valid selection, apply its mask
    if( mask ) {
        // get its mask array
        mask = mask.get( 'mask' );
        // set any false points to []
        points = points.map( (pt, i) => {
            if( mask.get(i) ) return pt
            return []
        });
    }

    return points
}

/**
 * Gets specialized data object for graph
 *  so that it can render it without overlappings
 */
export const getDataForGraph = (domain, xfeature, yfeature) => {

}