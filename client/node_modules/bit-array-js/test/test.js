var assert = require('assert');
var BitArray = require('../BitArray');

describe('BitArray', function() {
    describe('#set()', function() {
        it('should set index 0 to true', function() {
            var arr = new BitArray(32);
            arr.set(0);
            assert.equal(arr.data[0], true);
        });
    });
    describe('#clear()', function() {
        it('should set index 0 to false', function() {
            var arr = new BitArray(32);
            arr.set(0);
            arr.clear(0);
            assert.strictEqual(arr.data[0], false);
        });
    });
    describe('#value(index, value)', function() {
        context('when value not present', function() {
            it('should return value at index', function() {
                var arr = new BitArray(32);
                arr.set(0);
                assert.strictEqual(arr.value(0), true);
                arr.clear(0);
                assert.strictEqual(arr.value(0), false);
            });
        });
        context('when value present', function() {
            it('should set value at index', function() {
                var arr = new BitArray(32);
                arr.value(0, true);
                assert.strictEqual(arr.value(0), true);
                arr.value(0, false);
                assert.strictEqual(arr.value(0), false);
                
                arr.value(0, "asdf");
                assert.strictEqual(arr.value(0), true);
                arr.value(0, 0);
                assert.strictEqual(arr.value(0), false);
                arr.value(0, "");
                assert.strictEqual(arr.value(0), false);
                arr.value(0, 1);
                assert.strictEqual(arr.value(0), true);
            });
        });
    });
    describe('#toBase64()', function() {
        it('should return AA== when uninitialized', function() {
            var arr = new BitArray();
            assert.strictEqual(arr.toBase64(), "AA==");
        });
        it('should return AAAAAA== when size is 32', function() {
            var arr = new BitArray(32);
            assert.strictEqual(arr.toBase64(), "AAAAAA==");
        });
        it('should return QAAAAA== when index 1 is set', function() {
            var arr = new BitArray(32);
            arr.set(1);
            assert.strictEqual(arr.toBase64(), "QAAAAA==");
        });
        it('should return /////w== when all set', function() {
            var arr = new BitArray(32);
            for (var i = 0; i < arr.data.length; i++) {
                arr.set(i);
            }
            assert.strictEqual(arr.toBase64(), "/////w==");
        });
    });
    describe('#toBase64UrlSafe()', function() {
        it('should return AA when uninitialized', function() {
            var arr = new BitArray();
            assert.strictEqual(arr.toBase64UrlSafe(), "AA");
        });
        it('should return AAAAAA when size is 32', function() {
            var arr = new BitArray(32);
            assert.strictEqual(arr.toBase64UrlSafe(), "AAAAAA");
        });
        it('should return QAAAAA when index 1 is set', function() {
            var arr = new BitArray(32);
            arr.set(1);
            assert.strictEqual(arr.toBase64UrlSafe(), "QAAAAA");
        });
        it('should return _____w when all set', function() {
            var arr = new BitArray(32);
            for (var i = 0; i < arr.data.length; i++) {
                arr.set(i);
            }
            assert.strictEqual(arr.toBase64UrlSafe(), "_____w");
        });
    });
    describe('#fromBase64(value)', function() {
        context('when value is QAAAAA==', function() {
            it('should return true at index 1', function() {
                var arr = new BitArray(32);
                arr.fromBase64("QAAAAA==");
                assert.strictEqual(arr.value(1), true);
            });
        });
        context('when value is /////w==', function() {
            it('should return true at all indices', function() {
                var arr = new BitArray(32);
                arr.fromBase64("/////w==");
                for (var i = 0; i < arr.data.length; i++) {
                    assert.strictEqual(arr.value(i), true);
                }
            });
        });
    });
    describe('#fromBase64UrlSafe(value)', function() {
        context('when value is QAAAAA', function() {
            it('should return true at index 1', function() {
                var arr = new BitArray(32);
                arr.fromBase64("QAAAAA");
                assert.strictEqual(arr.value(1), true);
            });
        });
        context('when value is _____w', function() {
            it('should return true at all indices', function() {
                var arr = new BitArray(32);
                arr.fromBase64("_____w");
                for (var i = 0; i < arr.data.length; i++) {
                    assert.strictEqual(arr.value(i), true);
                }
            });
        });
    });
});