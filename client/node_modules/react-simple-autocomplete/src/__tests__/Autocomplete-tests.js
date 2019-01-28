import Autocomplete from '../Autocomplete'
import { React, expect, sinon, RTU, render, findByTag, scryByTag } from './config'

describe('<Autocomplete />', () => {
  var autocomplete, input, items, item

  describe('without any arguments', () => {
    beforeEach(() => {
      autocomplete = render(<Autocomplete />)
      input = findByTag(autocomplete, 'input')
    })

    it('renders', () => {
      expect(autocomplete).to.exist
    })

    it('has one child input', () => {
      expect(input).to.exist
      expect(scryByTag(autocomplete, 'ul')).to.be.empty
    })

    it('opens when the child input is focused', () => {
      RTU.Simulate.focus(input)
      expect(scryByTag(autocomplete, 'ul')).to.not.be.empty
    })

    it('closes when the child input is blured', () => {
      RTU.Simulate.focus(input)
      RTU.Simulate.blur(input)
      expect(scryByTag(autocomplete, 'ul')).to.be.empty
    })

    it('can be opened and closed with #open and #close', () => {
      autocomplete.open()
      expect(scryByTag(autocomplete, 'ul')).to.not.be.empty
      autocomplete.close()
      expect(scryByTag(autocomplete, 'ul')).to.be.empty
    })

    it('is not opened onChange', () => {
      RTU.Simulate.change(input)
      expect(scryByTag(autocomplete, 'ul')).to.be.empty
    })
  })

  describe('with custom child', () => {
    beforeEach(() => {
      autocomplete = render(<Autocomplete><textarea /></Autocomplete>)
      input = findByTag(autocomplete, 'textarea')
    })

    it('renders', () => {
      expect(autocomplete).to.exist
    })

    it('opens and closes when the child input is focused and blured', () => {
      RTU.Simulate.focus(input)
      expect(scryByTag(autocomplete, 'ul')).to.not.be.empty
      RTU.Simulate.blur(input)
      expect(scryByTag(autocomplete, 'ul')).to.be.empty
    })
  })

  describe('with simple array', () => {
    beforeEach(() => {
      items = ['foo', 'bar', 'baz']
      autocomplete = render(<Autocomplete items={items}/>)
      input = findByTag(autocomplete, 'input')
    })

    it('renders', () => {
      expect(autocomplete).to.exist
      expect(scryByTag(autocomplete, 'ul')).to.be.empty
    })

    it('by default shows partial exact matches', () => {
      input.value = 'ba'
      autocomplete.open()
      expect(scryByTag(autocomplete, 'li')).to.have.length(2)
    })

    it('exposes matches via #items', () => {
      input.value = 'ba'
      expect(autocomplete.items).to.have.length(2)
    })
  })

  describe('select', () => {
    describe('without select handler', () => {
      beforeEach(() => {
        items = ['foo', 'bar', 'baz']
        autocomplete = render(<Autocomplete items={items}/>)
        input = findByTag(autocomplete, 'input')
        input.value = 'ba'
        autocomplete.open()
        item = scryByTag(autocomplete, 'li')[0]
        input.dispatchEvent = sinon.spy()
      })

      it('if there is no select handler it fires an on change', () => {
        RTU.Simulate.click(item)
        expect(input.dispatchEvent).to.have.been.called
        expect(input.value).to.equal('bar')
      })

      it('selects on click', () => {
        RTU.Simulate.click(item)
        expect(input.value).to.equal('bar')
      })

      it('selects highlighted on Enter', () => {
        autocomplete.state.highlighted = 0
        RTU.Simulate.keyDown(input, {key: 'Enter'})
        expect(input.value).to.equal('bar')
      })

      it('closes the menu after a function tick', (done) => {
        autocomplete.close = sinon.spy()
        RTU.Simulate.click(item)
        setTimeout(() => {
          expect(autocomplete.close).to.have.been.called
          done()
        }, 0)
      })

      it('does not fire a blur event', (done) => {
        autocomplete.handleBlur = sinon.spy()
        RTU.Simulate.click(item)
        setTimeout(() => {
          expect(autocomplete.handleBlur).to.not.have.been.called
          done()
        }, 0)
      })
    })

    describe('with select handler', () => {
      const handleSelectItem = sinon.stub()

      beforeEach(() => {
        items = ['foo', 'bar', 'baz']
        autocomplete = render(<Autocomplete onSelectItem={handleSelectItem} items={items}/>)
        input = findByTag(autocomplete, 'input')
        input.value = 'ba'
        autocomplete.open()
        item = scryByTag(autocomplete, 'li')[0]
        input.dispatchEvent = sinon.spy()
      })

      it('does not fire change if void', () => {
        handleSelectItem.returns(undefined)
        RTU.Simulate.click(item)
        expect(input.dispatchEvent).to.not.have.been.called
        expect(handleSelectItem).to.have.been.called
      })

      it('does not fire change if falsy', () => {
        handleSelectItem.returns(0)
        RTU.Simulate.click(item)
        expect(input.dispatchEvent).to.not.have.been.called
        expect(handleSelectItem).to.have.been.called
      })

      it('fires change if truthy', () => {
        handleSelectItem.returns(true)
        RTU.Simulate.click(item)
        expect(input.dispatchEvent).to.have.been.called
        expect(handleSelectItem).to.have.been.called
      })
    })
  })
})
