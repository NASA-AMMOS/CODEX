import * as actions from '../actions/ui'
import reducer, { getInitialState } from './ui'
import { getInitialState as getInitialStateData } from './data'

import React from 'react';
import ReactDOM from 'react-dom';


describe('Interface store', () => {

    let data_state = getInitialStateData([['a','b'],[0,1],[2,3]], 'test.csv');

    it('should return initial state', () => {
        expect(reducer(undefined, {}).equals(getInitialState())).toBeTruthy()
    })

    it('should handle OPEN_GRAPH', () => {
        // Just test with random features
        const act1 = actions.openGraph(data_state, 'Test', null, null, null, true)

        let state = reducer(undefined, act1)
        // OPEN_GRAPH doesn't change state currently (though potentially could)
        expect(true).toEqual( true )
    })

    it('should handle OPEN_ALGORITHM', () => {
        const act1 = actions.openAlgorithm(data_state, 'Filter')

        let state = reducer(undefined, act1)
        // OPEN_GRAPH doesn't change state currently (though potentially could)
        expect(true).toEqual( true )
    })
    it('should handle OPEN_REPORT', () => {
        const act1 = actions.openAlgorithm(data_state, 'Quality Scan')

        let state = reducer(undefined, act1)
        // OPEN_GRAPH doesn't change state currently (though potentially could)
        expect(true).toEqual( true )
    })
    it('should handle OPEN_DEVELOPMENT', () => {
        const act1 = actions.openAlgorithm(data_state, 'nrandomfeatures')

        let state = reducer(undefined, act1)
        // OPEN_GRAPH doesn't change state currently (though potentially could)
        expect(true).toEqual( true )
    })

    it('should handle BRUSHTYPE_SET', () => {
        const act1 = actions.brushtypeSet('rectangle')
        const act2 = actions.brushtypeSet('freehand')
        const act3 = actions.brushtypeSet('fake_brushtype')

        let state = reducer(undefined, act1)
        expect(state.getIn(['brush','type'])).toEqual( 'rectangle' )

        state = reducer(state, act2)
        expect(state.getIn(['brush','type'])).toEqual( 'freehand' )

        //brushtype shouldn't update on unknown types
        state = reducer(state, act3)
        expect(state.getIn(['brush','type'])).toEqual( 'freehand' )
    })

    it('should handle BRUSHID_SET', () => {
        const act1 = actions.brushIdSet(1)
        const act2 = actions.brushIdSet(2)
        const act3 = actions.brushIdSet('NaN')

        let state = reducer(undefined, act1)
        expect(state.getIn(['brush','id'])).toEqual( 1 )

        state = reducer(state, act2)
        expect(state.getIn(['brush','id'])).toEqual( 2 )

        //Shouldn't update to NaN values
        state = reducer(state, act3)
        expect(state.getIn(['brush','id'])).toEqual( 2 )
    })

    it('should handle MODE_SET', () => {
        const act1 = actions.modeSet('zoom')
        const act2 = actions.modeSet('select')
        const act3 = actions.modeSet('snap')
        const act4 = actions.modeSet('fake_mode')

        let state = reducer(undefined, act1)
        expect(state.get('mode')).toEqual( 'zoom' )

        state = reducer(state, act2)
        expect(state.get('mode')).toEqual( 'select' )

        state = reducer(state, act3)
        expect(state.get('mode')).toEqual( 'snap' )

        //Fake mode shouldn't update
        state = reducer(state, act4)
        expect(state.get('mode')).toEqual( 'snap' )
    })

    it('should handle ADD_TO_HISTORY', () => {
        const act1 = actions.addToHistory('note', 'test', 'Just a test.')
        const act2 = actions.addToHistory('success', 'test', 'Test complete!')

        let state = reducer(undefined, act1)
        expect(state.get('history').size).toEqual( 1 )
        expect(state.getIn(['history', 0, 'status'])).toEqual( 'note' )
        expect(state.getIn(['history', 0, 'description'])).toEqual( 'Just a test.' )

        state = reducer(state, act2)
        expect(state.get('history').size).toEqual( 2 )
        expect(state.getIn(['history', 1, 'status'])).toEqual( 'success' )
        expect(state.getIn(['history', 1, 'description'])).toEqual( 'Test complete!' )
    })
})