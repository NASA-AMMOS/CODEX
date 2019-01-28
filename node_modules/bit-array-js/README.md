# bit-array-js

Boolean arrays that can be serialized to and from base64.

# install

## node

```
npm install bit-array-js
```

## browser

``` html
<script src="BitArray.min.js"></script>
```

# example

``` js
var BitArray = require("bit-array-js");
var a = new BitArray(8);
a.set(1);                   // [false, false, false, true, false, false, false, false]
a.value(3, true);           // [false, true, false, true, false, false, false, false]
a.value(3);                 // returns true
a.toBase64();               // returns UA==
a.fromBase64("EA==");       // [false, false, false, true, false, false, false, false]
a.clear(3);                 // [false, false, false, false, false, false, false, false]
```

# methods

## set(index)

set true at `index` 

## clear(index)

set false at `index`

## value(index)

return value at `index`

## value(index, val)

set at `index` if `val` is truthy

clear at `index` if `val` is falsy

## toBase64()

return base64 encoded string representation

## toBase64UrlSafe()

toBase64 with +/ replaced with -_ and padding removed.

## fromBase64(value)

`value` - base64 string

## fromBase64UrlSafe(value)

`value` - url safe base64 string