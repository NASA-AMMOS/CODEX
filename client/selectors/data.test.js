import * as actions from '../actions/data'
import reducer from '../reducers/data'
import * as sels from './data'
import { List } from 'immutable'

describe('Data selector tests', () => {
    // our test data store has this
    const load_file_action = actions.fileLoad(
        [
            ['f1', 'f2'],
            [1, 2],
			[3, 4],
			[5, 6],
			[7, 8]
		],
		'test.csv'
    )
    const base_state = reducer(undefined, load_file_action)


    it('should get features', () => {
        const features = sels.getFeatures(base_state)

        expect(features.equals(List.of('f1', 'f2'))).toBeTruthy()
        expect(features.equals(List.of('f2', 'f1'))).toBeFalsy()
        expect(features.equals(List.of('f2', 'f3'))).toBeFalsy()
    })

    it('should get selected features', () => {
        let state = reducer(base_state, actions.featureSelect('f1'))

        let selected = sels.getFeaturesWithSelected(state)

        expect(selected.get(0).get(0)).toEqual('f1')
        expect(selected.get(0).get(1)).toBeTruthy()
        expect(selected.get(1).get(0)).toEqual('f2')
        expect(selected.get(1).get(1)).toBeFalsy()
    })

    it('should get columns', () => {
        let col1 = sels.getColumn(base_state, 'f1')
        let col2 = sels.getColumn(base_state, 'f2')
        let col3 = sels.getColumn(base_state, 'f3')

        expect(col1.equals(List.of(1,3,5,7))).toBeTruthy()
        expect(col2.equals(List.of(2,4,6,8))).toBeTruthy()
        expect(col3.equals(List())).toBeTruthy()
    })
	it('should solve selections', () => {
		const act1 = actions.selectionCreate('sel1', [true, true, false, false], false, '#123456')
		const act2 = actions.selectionCreate('sel2', [true, false, true, false], true , '#abcdef')

		let state = reducer(base_state, act1)
        state = reducer(state, act2)

		let solved = sels.getFinalSelectionArray(state)
		expect(solved.toJS()).toEqual([
			['#abcdef', false],
			['#335ce4', false],
			['#abcdef', false],
			['#335ce4', false]
        ])
    })
        

    it('should get all active selection names', () => {
        // make a selection (they default to off)
        let state = reducer(base_state,
            actions.selectionCreate('s1', List([true, true]), false, 'blue'))
     
        // check whether it's off
        let selectionNames = sels.getActiveSelectionNames(state)
        expect(selectionNames.includes('s1')).toBe(false)
        
        // turn it on
        state = reducer(state,
            actions.selectionToggle(0))
        // check whether it's off
        selectionNames = sels.getActiveSelectionNames(state)
        expect(selectionNames.getIn([0, 'name'])).toBe('s1')
        
        // Now to test whether it only get active selections
        // add another
        state = reducer(state,
            actions.selectionCreate('s2', List([false, false]), false, 'red'))
        // check that they exist or not accordingly and that the last element
        //  is our active selection and not undefined or the like
        selectionNames = sels.getActiveSelectionNames(state)
        expect(selectionNames.getIn([0, 'name'])).toBe('s1')
        expect(selectionNames.last().get('name')).toBe('s1')
    })
    it('should get selection names by meta match', () => {
        // make a selection (they default to off)
        let state = reducer(base_state,
            actions.selectionCreate('s1', List([true, true]), false, 'blue', { 'test1': 1, 'test2': 2 } ))
        state = reducer(state,
            actions.selectionCreate('s2', List([true, true]), false, 'blue', { 'test1': 2, 'test2': 2 } ))
        
        let selectionNames = sels.getSelectionNamesByMeta(state, 'test1', 1 );
        expect(selectionNames.size).toBe(1)
        expect(selectionNames.getIn([0, 'name'])).toBe('s1')

        selectionNames = sels.getSelectionNamesByMeta(state, 'test2', 2 );
        expect(selectionNames.size).toBe(2)
        expect(selectionNames.getIn([1, 'name'])).toBe('s2')
    })
	it('should retrieve the filename', () => {
		expect(sels.getFilename(base_state)).toBe('test.csv')
	})
	it('should create points from selections', () => {
		const points = sels.getPoints(base_state, 'f1', 'f2')

		expect(points.toJS()).toEqual([
            [1, 2],
			[3, 4],
			[5, 6],
			[7, 8]
		])
	})
	it('should zip points and selections', () => {
		const act1 = actions.selectionCreate('sel1', [true, true, false, false], false, '#123456')
		const act2 = actions.selectionCreate('sel2', [true, false, true, false], false, '#abcdef')

		let state = reducer(base_state, act1)
		state = reducer(state, act2)
        state = reducer(state,
            actions.selectionToggle(0))
        state = reducer(state,
            actions.selectionToggle(1))

		const solved = sels.getFinalSelectionArray(state)
		const points = sels.getPoints(state, 'f1', 'f2')
		const final = sels.zipPointsAndSelections(points, solved)
		expect(final.toJS()).toEqual([
            [[1, 2], ['#abcdef', false]],
			[[3, 4], ['#123456', false]],
			[[5, 6], ['#abcdef', false]],
			[[7, 8], ['#335ce4', false]]
		])
    })
    it('should get points based on feature and mask', () => {
        const act1 = actions.selectionCreate('sel1', [true, true, false, false], false, '#123456')
		const act2 = actions.selectionCreate('sel2', [true, false, true, false], false, '#abcdef')

		let state = reducer(base_state, act1)
        state = reducer(state, act2)
        
        const testX = sels.getFeaturesMasked( state, 'f1', 'f2' )
        const test1 = sels.getFeaturesMasked( state, 'f1', 'f2', 'selections', 'sel1' )
        const test2 = sels.getFeaturesMasked( state, 'f1', 'f2', 'selections', 'sel2' )
        
        expect(testX.toJS()).toEqual([
            [1, 2],
			[3, 4],
			[5, 6],
            [7, 8]
        ])
        expect(test1.toJS()).toEqual([
            [1, 2],
			[3, 4],
			[],
            []
        ])
        expect(test2.toJS()).toEqual([
            [1, 2],
			[],
			[5,6],
            []
		])
    })
})
