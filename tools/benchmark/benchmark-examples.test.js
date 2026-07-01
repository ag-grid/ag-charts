const assert = require('node:assert/strict');
const test = require('node:test');

const { discoverExamples, parseExamplesArg, resolveExamples, shardExamples } = require('./benchmark-examples');

test('parseExamplesArg splits on commas and/or whitespace and drops empties', () => {
    assert.deepEqual(parseExamplesArg('a,b'), ['a', 'b']);
    assert.deepEqual(parseExamplesArg('a b'), ['a', 'b']);
    assert.deepEqual(parseExamplesArg('  a , b ,, c '), ['a', 'b', 'c']);
    assert.deepEqual(parseExamplesArg(''), []);
    // Defaulting to '' keeps the full-run path safe when no value is supplied.
    assert.deepEqual(parseExamplesArg(), []);
    assert.deepEqual(parseExamplesArg(undefined), []);
});

test('resolveExamples with no request returns every runnable example', () => {
    assert.deepEqual(resolveExamples([]), discoverExamples());
});

test('resolveExamples narrows to the requested names in discovery order', () => {
    const all = discoverExamples();
    assert.ok(all.length >= 2, 'expected at least two runnable examples to exercise narrowing');
    const [first, second] = all;
    // Request out of order to prove the result is re-sorted into discovery order.
    assert.deepEqual(resolveExamples([second, first]), [first, second]);
});

test('resolveExamples rejects unknown example names', () => {
    assert.throws(() => resolveExamples(['__definitely-not-an-example__']), /Unknown benchmark example/);
});

test('shardExamples narrows the input set before sharding', () => {
    const [first] = discoverExamples();
    assert.deepEqual(shardExamples(5, [first]), [[first]]);
});
