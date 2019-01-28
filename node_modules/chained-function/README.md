# chained-function [![build status](https://travis-ci.org/cheton/chained-function.svg?branch=master)](https://travis-ci.org/cheton/chained-function) [![Coverage Status](https://coveralls.io/repos/github/cheton/chained-function/badge.svg?branch=master)](https://coveralls.io/github/cheton/chained-function?branch=master)

[![NPM](https://nodei.co/npm/chained-function.png?downloads=true&stars=true)](https://www.npmjs.com/package/chained-function)

## Installation

```bash
npm install --save chained-function
```

## Usage

```js
let sum = 0;
const func = chainedFunction(
    function(val) {
        sum += val;
        console.log(sum); // 2
    },
    function(val) {
        sum += val;
        console.log(sum); // 4
    },
    function(val) {
        sum += val;
        console.log(sum); // 6
    }
);

func(2);
```

### React

```js
import React, { Component, PropTypes } from 'react';
import chainedFunction from 'chained-function';

class extends Component {
    static propTypes = {
        onClick: PropTypes.func
    };
    static contextTypes = {
        $parent: PropTypes.shape({
            onClick: PropTypes.func
        })
    };

    actions = {
        handleClick: (event) => {
        }
    }

    render() {
        const { onClick, ...props } = this.props;
        const parent = this.context.$parent;

        <a
            {...props}
            onClick={chainedFunction(
                this.actions.handleClick,
                onClick,
                parent && parent.onClick
            )}
        />
    }
}
```

## License

MIT
