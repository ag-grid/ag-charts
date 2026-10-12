import assert from 'node:assert/strict';
import test from 'node:test';

import { isReleaseBelow } from '../../packages/ag-charts-website/src/content/docs/benchmarks/benchmarkUtils';

// A published npm base below an example's minVersion must be skipped; a pre-release head must not. A base that
// runs an example for a series it lacks can hang for the whole per-example timeout, failing the merge step.
test('isReleaseBelow is true for a published release older than the minimum', () => {
    assert.equal(isReleaseBelow('14.2.0', '14.3.0'), true);
    assert.equal(isReleaseBelow('13.9.9', '14.0.0'), true);
});

test('isReleaseBelow is false for a release at or after the minimum', () => {
    assert.equal(isReleaseBelow('14.3.0', '14.3.0'), false);
    assert.equal(isReleaseBelow('15.0.0', '14.3.0'), false);
});

test('isReleaseBelow is false for a pre-release build, which already carries the feature', () => {
    assert.equal(isReleaseBelow('14.2.0-beta.20261008', '14.3.0'), false);
});

test('isReleaseBelow is false when the version is unknown', () => {
    assert.equal(isReleaseBelow('unknown', '14.3.0'), false);
});
