'use strict';

var _Autocomplete = require('../Autocomplete');

var _Autocomplete2 = _interopRequireDefault(_Autocomplete);

var _config = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('<Autocomplete />', function () {
  var autocomplete, input, items, item;

  describe('without any arguments', function () {
    beforeEach(function () {
      autocomplete = (0, _config.render)(_config.React.createElement(_Autocomplete2.default, null));
      input = (0, _config.findByTag)(autocomplete, 'input');
    });

    it('renders', function () {
      (0, _config.expect)(autocomplete).to.exist;
    });

    it('has one child input', function () {
      (0, _config.expect)(input).to.exist;
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.be.empty;
    });

    it('opens when the child input is focused', function () {
      _config.RTU.Simulate.focus(input);
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.not.be.empty;
    });

    it('closes when the child input is blured', function () {
      _config.RTU.Simulate.focus(input);
      _config.RTU.Simulate.blur(input);
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.be.empty;
    });

    it('can be opened and closed with #open and #close', function () {
      autocomplete.open();
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.not.be.empty;
      autocomplete.close();
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.be.empty;
    });

    it('is not opened onChange', function () {
      _config.RTU.Simulate.change(input);
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.be.empty;
    });
  });

  describe('with custom child', function () {
    beforeEach(function () {
      autocomplete = (0, _config.render)(_config.React.createElement(
        _Autocomplete2.default,
        null,
        _config.React.createElement('textarea', null)
      ));
      input = (0, _config.findByTag)(autocomplete, 'textarea');
    });

    it('renders', function () {
      (0, _config.expect)(autocomplete).to.exist;
    });

    it('opens and closes when the child input is focused and blured', function () {
      _config.RTU.Simulate.focus(input);
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.not.be.empty;
      _config.RTU.Simulate.blur(input);
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.be.empty;
    });
  });

  describe('with simple array', function () {
    beforeEach(function () {
      items = ['foo', 'bar', 'baz'];
      autocomplete = (0, _config.render)(_config.React.createElement(_Autocomplete2.default, { items: items }));
      input = (0, _config.findByTag)(autocomplete, 'input');
    });

    it('renders', function () {
      (0, _config.expect)(autocomplete).to.exist;
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'ul')).to.be.empty;
    });

    it('by default shows partial exact matches', function () {
      input.value = 'ba';
      autocomplete.open();
      (0, _config.expect)((0, _config.scryByTag)(autocomplete, 'li')).to.have.length(2);
    });

    it('exposes matches via #items', function () {
      input.value = 'ba';
      (0, _config.expect)(autocomplete.items).to.have.length(2);
    });
  });

  describe('select', function () {
    describe('without select handler', function () {
      beforeEach(function () {
        items = ['foo', 'bar', 'baz'];
        autocomplete = (0, _config.render)(_config.React.createElement(_Autocomplete2.default, { items: items }));
        input = (0, _config.findByTag)(autocomplete, 'input');
        input.value = 'ba';
        autocomplete.open();
        item = (0, _config.scryByTag)(autocomplete, 'li')[0];
        input.dispatchEvent = _config.sinon.spy();
      });

      it('if there is no select handler it fires an on change', function () {
        _config.RTU.Simulate.click(item);
        (0, _config.expect)(input.dispatchEvent).to.have.been.called;
        (0, _config.expect)(input.value).to.equal('bar');
      });

      it('selects on click', function () {
        _config.RTU.Simulate.click(item);
        (0, _config.expect)(input.value).to.equal('bar');
      });

      it('selects highlighted on Enter', function () {
        autocomplete.state.highlighted = 0;
        _config.RTU.Simulate.keyDown(input, { key: 'Enter' });
        (0, _config.expect)(input.value).to.equal('bar');
      });

      it('closes the menu after a function tick', function (done) {
        autocomplete.close = _config.sinon.spy();
        _config.RTU.Simulate.click(item);
        setTimeout(function () {
          (0, _config.expect)(autocomplete.close).to.have.been.called;
          done();
        }, 0);
      });

      it('does not fire a blur event', function (done) {
        autocomplete.handleBlur = _config.sinon.spy();
        _config.RTU.Simulate.click(item);
        setTimeout(function () {
          (0, _config.expect)(autocomplete.handleBlur).to.not.have.been.called;
          done();
        }, 0);
      });
    });

    describe('with select handler', function () {
      var handleSelectItem = _config.sinon.stub();

      beforeEach(function () {
        items = ['foo', 'bar', 'baz'];
        autocomplete = (0, _config.render)(_config.React.createElement(_Autocomplete2.default, { onSelectItem: handleSelectItem, items: items }));
        input = (0, _config.findByTag)(autocomplete, 'input');
        input.value = 'ba';
        autocomplete.open();
        item = (0, _config.scryByTag)(autocomplete, 'li')[0];
        input.dispatchEvent = _config.sinon.spy();
      });

      it('does not fire change if void', function () {
        handleSelectItem.returns(undefined);
        _config.RTU.Simulate.click(item);
        (0, _config.expect)(input.dispatchEvent).to.not.have.been.called;
        (0, _config.expect)(handleSelectItem).to.have.been.called;
      });

      it('does not fire change if falsy', function () {
        handleSelectItem.returns(0);
        _config.RTU.Simulate.click(item);
        (0, _config.expect)(input.dispatchEvent).to.not.have.been.called;
        (0, _config.expect)(handleSelectItem).to.have.been.called;
      });

      it('fires change if truthy', function () {
        handleSelectItem.returns(true);
        _config.RTU.Simulate.click(item);
        (0, _config.expect)(input.dispatchEvent).to.have.been.called;
        (0, _config.expect)(handleSelectItem).to.have.been.called;
      });
    });
  });
});