'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function () {
    for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
        funcs[_key] = arguments[_key];
    }

    return funcs.filter(function (func) {
        return typeof func === 'function';
    }).reduce(function (accumulator, func) {
        if (accumulator === null) {
            return func;
        }

        return function chainedFunction() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            accumulator.apply(this, args);
            func.apply(this, args);
        };
    }, null);
};