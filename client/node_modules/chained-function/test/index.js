import { test } from 'tap';
import chainedFunction from '../src';

test('chained function', (t) => {
    const wanted = [3, 4, 5];
    const found = [];
    const fn = chainedFunction(
        function(val) {
            found.push(val + 1);
        },
        function(val) {
            found.push(val + 2);
        },
        function(val) {
            found.push(val + 3);
        }
    );
    fn(2);
    t.same(found, wanted);
    t.end();
});
