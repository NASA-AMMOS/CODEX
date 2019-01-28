# Redux Simple Autocomplete

Simple, customizable, unopinionated autocomplete wrapper for React.

## Installation

npm:

```bash
$ npm install --save react-simple-autocomplete
```

npmcdm:

```html
<!-- <SimpleAutocomplete /> -->
<script src="//npmcdn.com/react-simple-autocomplete"></script>
```

## Demo

[bendyorke.com/react-simple-autocomplete](http://bendyorke.com/react-simple-autocomplete)

## What does this library try to solve?

Autocomplete fields are very common but can be a pain to write.  When looking around, all the available autocomplete fields were either incomplete, or very opinionated.  I wanted a reusable component to provide me the basic functionality but could be taylored to any use case.

## Basic output

Given:

```html
<Autocomplete items={['one', 'two']} />
```

Output with menu closed:

```html
<div>
  <input type="text" />
</div>
```

Output with menu open & first item highlighted:

```html
<div>
  <input type="text" />
  <ul>
    <em><li>one</li></em>
    <li>two</li>
  </ul>
</div>
```

## API

### &lt;Autocomplete />

### Children:

`<Autocomplete />` can accept a single element as a child.  This element can contain nested elements, however the top level element must respond to `#value`.  Any refs applied to the top level child will be overridden, however it can be accessed via `#input`.  Defaults to: `<input type="text" />`

NOTE: Currently, `onMouseDown`, `onMouseEnter`, and `onClick` are overwritten on the top level child element.  This should be fixed shortly.  `onChange`, however, is free to be used!

### Methods:

#### `#open`

Opens the menu

#### `#close`

Closes the menu

#### `.input`

Retrieve the top level child

#### `.options`

Retrieve the items that are currently available as options

### Props:

#### `items: [Any]`

The items prop is an array the different possible matches.  It can be an array of any type, however only strings are supported by the default `filter` prop.

#### `filter: (item: Any, query: String) -> Boolean`

Filter function to decide which items are possible choices.  Called on each item individually and is passed the current item & the value of the input field. Defaults to:

```js
(item, query) => item.toLowerCase().includes(query.toLowerCase())
```

#### `sort: (a: Any, b: Any) -> Number`

Sort function to be called on the remaining items after the filter function.  Defaults to no sort (`() => {}`).

Can also pass `undefined`, `null`, or `false` to use the default `Array.sort()` method.

#### `limit: Number`

Limit your results to a specific number.  Defaults to `undefined`.

#### `renderMenu: ({items: [Any]}) -> Element`

Function used to render the menu.  Gives you full control to style your menu, use whichever elements you want, nest the items, group the items, etc, etc.  Items are passed as named parameters to support stateless functional components.  Defaults to:

```js
({items}) => <ul>{items}</ul>
```

#### `renderItem: ({item: Any, highlighted: Boolean}) -> Element`

Function used to render each individual item.  Gives you full control to style your item, apply conditional logic if the item is highlighted, and mutate the items display value.  Items are passed as named parameters to support stateless functional components.  Defaults to:

```js
({item, highlighted}) => highlighted
  ? <em><li>{items}</li></em>
  : <li>{items}</li>
```

#### `onSelectItem: ({item: Any, event: React.SyntheticEvent}) -> Any`

Callback called when an item is selected (either onClick, or onKeyDown: Enter when an element is highlighted).

By default Autocomplete will update the input value onClick.  If you provide a `onSelectItem` handler, you must return a truthy value to keep this behavior.  If you return `undefined` or any other falsey value it will stop the default event handler.

#### `onFocus: ({event: React.SyntheticEvent}) -> Any`

Menu is opened when input element is focused prior to the `onFocus` handler being invoked.

#### `onBlur: ({event: React.SyntheticEvent}) -> Any`

Menu is closed when the input element is blurred prior to the `onBlur` handler being invoked.

NOTE: This is not called when an item is selected from the menu.

## Tests

Tests are run with mocha, and written in chai & sinon.  Any test related code is located alonside project files nested under a `__tests__` directory.  Files containing tests to be run should be postfixed with `-tests.js`.
