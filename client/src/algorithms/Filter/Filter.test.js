import React from 'react'
import { Filter } from './Filter'
import { shallow } from 'enzyme'
import { fromJS } from 'immutable'

// create a 
const setup = (
	data,
	selectedFeatures,
    selectionCreate = (() => {})
) => {
	data = data || fromJS({
		data: [
			['f1', 'f2', 'f3'],
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9]
		]
	})
	selectedFeatures = selectedFeatures || fromJS(['f1', 'f2'])

	return shallow(
		<Filter
			data={data}
			selectedFeatures={selectedFeatures}
			selectionCreate={selectionCreate}/>
	)
}

describe('<Filter/>', () => {
    it('renders without crashing', () => {
		setup()
    })


    it('creates an expression tree', () => {
        const wrapper = setup()
		const instance = wrapper.instance()

		instance.handleExprChange({target: {value: '(f1 || f2) && f2'}})

		expect(instance.state.expr_input).toEqual('(f1 || f2) && f2')
	
		// gross, but works
		expect(instance.state.expr_tree).toEqual({
			type: 'LogicalExpression',
			operator: '&&',
			left:
			{ type: 'LogicalExpression',
				operator: '||',
				left: { type: 'Identifier', name: 'f1' },
				right: { type: 'Identifier', name: 'f2' } },
			right: { type: 'Identifier', name: 'f2' }
		})
	})

	it('gets a list of identifiers in a statement', () => {
		const wrapper = setup()
		const instance = wrapper.instance()

		instance.handleExprChange({target: {value: '(f1 || f2) && f2'}})
		expect(instance.extractIdentifiers(instance.state.expr_tree)).toEqual(['f1', 'f2'])

	})

	it('should identify when an non-selected feature is used', () => {
		const wrapper = setup()
		const instance = wrapper.instance()

		expect(instance.findInvalidIdentifiers(['a', 'b'], ['a', 'b', 'c'])).toEqual([])
		expect(instance.findInvalidIdentifiers(['a', 'b', 'c'], ['a', 'b'])).toEqual(['c'])
	})

    it('stringifies full trees', () => {
        const wrapper = setup()
		const instance = wrapper.instance()

		instance.handleExprChange({target: {value: '(f1 || f2) && f2'}})
		expect(instance.createExprString(instance.state.expr_tree)).toEqual('((f1 || f2) && f2)')
    })


    it('extracts logical/binary expressions', () => {
        const wrapper = setup()
		const instance = wrapper.instance()

		instance.handleExprChange({target: {value: '(a || b) && c'}})
		const exprs = instance.extractLogicalExpressions(instance.state.expr_tree)

		expect(exprs.every(el => el.type === 'Identifier'
			|| el.type === 'LogicalExpression'
			|| el.type === 'BinaryExpression'
		)).toBeTruthy()
    })

	it('correctly evaluates expressions', () => {
        const wrapper = setup()
		const instance = wrapper.instance()

		expect((instance.evaluateExpression('f1 >  2'))).toEqual([false, true, true])
		expect((instance.evaluateExpression('f2 >= 2'))).toEqual([true, true, true])
		expect((instance.evaluateExpression('(f2 >= 2) || (f1 > 2)'))).toEqual([true, true, true])
		expect((instance.evaluateExpression('(f2 >= 2) && (f1 > 2)'))).toEqual([false, true, true])
	})

})
