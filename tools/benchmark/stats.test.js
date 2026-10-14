const assert = require('node:assert/strict');
const test = require('node:test');

const { median, pctChange } = require('./stats');

test('median takes the middle value, or the mean of the middle two', () => {
    assert.equal(median([3, 1, 2]), 2);
    assert.equal(median([4, 1, 3, 2]), 2.5);
});

test('median is null without values', () => {
    assert.equal(median([]), null);
    assert.equal(median(undefined), null);
});

test('pctChange rounds to one decimal and is null against a zero baseline', () => {
    assert.equal(pctChange(4, 3), -25);
    assert.equal(pctChange(3, 4), 33.3);
    assert.equal(pctChange(0, 5), null);
});
