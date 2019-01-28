import * as actions from '../actions/data'
import reducer, { getInitialState } from './data'

describe('Data store', () => {
    it('should return initial state', () => {
        expect(reducer(undefined, {}).equals(getInitialState())).toBeTruthy()
    })

    it('should handle FILE_LOAD', () => {
        const act = actions.fileLoad([['f1', 'f2'], [1,2], [3,4]], 'test.csv')

        let state = reducer(undefined, {})
        expect(state.get('data')).toBeNull()
        expect(state.get('filename')).toBeNull()
        expect(state.get('selections').toJS()).toEqual([])

        state = reducer(state, act)

        expect(state.get('data').size).toEqual(3)
        expect(state.get('data').get(0).size).toEqual(2)
        expect(state.get('data').get(1).size).toEqual(2)
        expect(state.get('data').get(2).size).toEqual(2)
        expect(state.get('filename')).toEqual('test.csv')
        expect(state.getIn(['master','mask']).size).toEqual(2)
        expect(state.getIn(['brush','mask']).size).toEqual(2)
    })

    it('should handle FEATURE_ADD', () => {
        const act1 = actions.fileLoad([['f1', 'f2'], [1,2], [3,4]], 'test.csv')
        const act2 = actions.featureAdd('f3', [3, 5])
        const act3 = actions.featureAdd('f3', [4, 6])

        let state = reducer(undefined, act1)

        state = reducer(state, act2)
        expect(state.get('data').toJS()).toEqual(
            [['f1','f2','f3'],[1,2,3],[3,4,5]]
        )

        // handle duplicate feature names
        state = reducer(state, act3)
        expect(state.get('data').toJS()).toEqual(
            [['f1','f2','f3', 'f3_A'],[1,2,3,4],[3,4,5,6]]
        )
    })
    
    it('should handle FEATURE_SELECT', () => {
        const act = actions.featureSelect('foo')
        const state = reducer(undefined, act)
        expect(state.get('selected_features').has('foo')).toBeTruthy()
    })

    it('should handle FEATURE_UNSELECT', () => {
        const act1 = actions.featureSelect('foo')
        const act2 = actions.featureUnselect('foo')

        let state = reducer(undefined, act1)
        expect(state.get('selected_features').has('foo')).toBeTruthy()

        state = reducer(state, act2)
        expect(state.get('selected_features').has('foo')).toBeFalsy()
    })

    it('should handle FEATURES_UNSELECTALL', () => {
        const act1 = actions.featureSelect('foo')
        const act2 = actions.featureSelect('bar')
        const act3 = actions.featuresUnselectAll()

        let state = reducer(undefined, act1)
        state = reducer(state, act2)
        state = reducer(state, act3)
        expect(state.get('selected_features').size).toEqual(0)
    })

    it('should handle SELECTION_CREATE', () => {
        const act1 = actions.fileLoad([['f1', 'f2'], [1,2], [3,4]], 'test.csv')
        const act2 = actions.selectionCreate('foo', [true, false], true, '#123456')
        const act3 = actions.selectionCreate('bar', [true, false], false, '#abcdef')
        const act4 = actions.brushUpdate([false, true])
        const act5 = actions.selectionCreate('baz', 'brush', false, '#fedcba')
        
        let state = reducer(undefined, act1)
        state = reducer(state, act2)
        let sel = state.get('selections').get(0)

        expect(sel.get('name')).toEqual('foo')
        expect(sel.get('mask').size).toEqual(2)
        expect(sel.get('color')).toEqual('#123456')
        expect(sel.get('emphasize')).toBeFalsy()
        expect(sel.get('visible')).toBeTruthy()

        state = reducer(state, act3)
        sel = state.get('selections').get(1)
        
        expect(sel.get('visible')).toBeFalsy()

        // handle selection from brush
        state = reducer(state, act4)
        state = reducer(state, act5)
        sel = state.get('selections').get(2)

        expect(sel.get('mask').toJS()).toEqual([false, true])
    })
    it('should handle SELECTION_REORDER', () => {
        const act1 = actions.selectionCreate('foo', [], '')
        const act2 = actions.selectionCreate('bar', [], '')
        const act3 = actions.selectionCreate('baz', [], '')

        // add the three selections
        let state = reducer(undefined, act1)
        state = reducer(state, act2)
        state = reducer(state, act3)

        // expect the original order
        expect(state.get('selections').get(0).get('name')).toEqual('foo')
        expect(state.get('selections').get(1).get('name')).toEqual('bar')
        expect(state.get('selections').get(2).get('name')).toEqual('baz')
        expect(state.get('selections').size).toEqual(3)

        // reorder 
        const reorder_action = actions.selectionReorder([1, 0, 2])
        state = reducer(state, reorder_action)

        // expect the three to be swapped
        expect(state.get('selections').get(0).get('name')).toEqual('bar')
        expect(state.get('selections').get(1).get('name')).toEqual('foo')
        expect(state.get('selections').get(2).get('name')).toEqual('baz')
        expect(state.get('selections').size).toEqual(3)
    })
	it('should handle SELECTION_RECOLOR', () => {
        const act1 = actions.selectionCreate('bar', [], false, '#123456')
		const act2 = actions.selectionRecolor(0, '#abcdef')

		let state = reducer(undefined, act1)
		expect(state.get('selections').get(0).get('color')).toEqual('#123456')

		// apply the recolor selector
		state = reducer(state, act2)

		expect(state.get('selections').get(0).get('color')).toEqual('#abcdef')
	})
	it('should handle SELECTION_RENAME', () => {
        const act1 = actions.selectionCreate('bar', [], false, '#123456')
		const act2 = actions.selectionRename(0, 'baz')

		let state = reducer(undefined, act1)
		expect(state.get('selections').get(0).get('name')).toEqual('bar')

		// apply the recolor selector
		state = reducer(state, act2)

		expect(state.get('selections').get(0).get('name')).toEqual('baz')
	})
    it('should handle SELECTION_EMPHASIZE', () => {
        const act1 = actions.selectionCreate('foo', [], '')
        const act2 = actions.selectionEmphasisToggle(0)

        let state = reducer(undefined, act1)
        expect(state.get('selections').get(0).get('emphasize')).toBeFalsy()

        // apply the selection toggle
        state = reducer(state, act2)

        expect(state.get('selections').get(0).get('emphasize')).toBeTruthy()

        // apply the selection toggle again
        state = reducer(state, act2)

        expect(state.get('selections').get(0).get('emphasize')).toBeFalsy()
    })
    it('should handle SELECTION_TOGGLE', () => {
        const act1 = actions.selectionCreate('foo', [], false, '')
        const act2 = actions.selectionToggle(0)

        let state = reducer(undefined, act1)
        expect(state.get('selections').get(0).get('visible')).toBeFalsy()

        // apply the selection toggle
        state = reducer(state, act2)

        expect(state.get('selections').get(0).get('visible')).toBeTruthy()

        // apply the selection toggle again
        state = reducer(state, act2)

        expect(state.get('selections').get(0).get('visible')).toBeFalsy()
    })

    it('should handle SELECTION_UNSELECTALL', () => {
        const act1 = actions.selectionCreate('foo', [], true, '')
        const act2 = actions.selectionCreate('bar', [], true, '')
        const act3 = actions.selectionsUnselectAll();

        let state = reducer(undefined, act1)
        state = reducer(state, act2)
        state = reducer(state, act3)

        expect(state.get('selections').get(0).get('visible')).toBeFalsy()
        expect(state.get('selections').get(1).get('visible')).toBeFalsy()
    })

    it('should handle SELECTION_REMOVE', () => {
        const act1 = actions.selectionCreate('foo', [], false, '')
        const act2 = actions.selectionRemove(0)

        let state = reducer(undefined, act1)
        expect(state.get('selections').size).toEqual(1)

        state = reducer(state, act2)

        expect(state.get('selections').size).toEqual(0)
    })

    it('should handle BRUSH_UPDATE', () => {
        const act1 = actions.fileLoad([['f1', 'f2'], [1,2], [3,4], [5,6]], 'test.csv')
        const act2 = actions.brushUpdate([true, false, true])
        const act3 = actions.brushUpdate([true, true])

        // brush should initialize to all false for each data row
        let state = reducer(undefined, act1)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([false, false, false])

        // should update brush
        state = reducer(state, act2)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([true, false, true])

        // should leave it upchanged if new mask is the wrong size
        state = reducer(state, act3)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([true, false, true])

    })
    it('should handle BRUSH_UPDATE_AREA', () => {
        const act1 = actions.fileLoad([['f1', 'f2', 'f3'], [1,1,3], [2,2,1], [3,3,2]], 'test.csv')
        const act2 = actions.brushUpdateArea('rectangle', { x: [0.5, 1.5], y: [0.5, 1.5]}, 'f1', 'f2')
        const act3 = actions.brushUpdateArea('rectangle', { x: [0.5, 2.5], y: [0.5, 2.5]}, 'f2', 'f3')
        //freehand square around 1,1
        const act4 = actions.brushUpdateArea('freehand', [  {x: 0.5, y: 0.5},
                                                            {x: 1.5, y: 0.5},
                                                            {x: 1.5, y: 1.5},
                                                            {x: 0.5, y: 1.5}
                                                         ], 'f1', 'f2')
        //freehand triangle
        const act5 = actions.brushUpdateArea('freehand', [  {x: 1, y: 0.5},
                                                            {x: 2, y: 3},
                                                            {x: 6, y: 1}
                                                         ], 'f2', 'f3')
        const act6 = actions.brushUpdateArea('something else', null, 'f1', 'f2')

        let state = reducer(undefined, act1)

        // rectangle - only first row should be brushed
        state = reducer(state, act2)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([true, false, false])

        // rectangle
        state = reducer(state, act3)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([false, true, false])

        // freehand
        state = reducer(state, act4)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([true, false, false])

        // freehand
        state = reducer(state, act5)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([false, true, true])

        // something else
        state = reducer(state, act6)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([false, false, false])
    })
    it('should handle BRUSH_CLEAR', () => {
        const act1 = actions.fileLoad([['f1', 'f2'], [1,2], [3,4], [5,6]], 'test.csv')
        const act2 = actions.brushUpdate([true, false, true])
        const act3 = actions.brushClear()

        // brush should initialize to all false for each data row
        let state = reducer(undefined, act1)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([false, false, false])

        // should update brush
        state = reducer(state, act2)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([true, false, true])

        // should clear brush back to all falses
        state = reducer(state, act3)
        expect(state.getIn(['brush','mask']).toJS()).toEqual([false, false, false])
    })
})
