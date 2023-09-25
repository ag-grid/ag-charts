import { expect } from '@jest/globals';
import { toMatchImage } from 'ag-charts-community-test';
import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';

declare module 'expect' {
    interface Matchers<R> {
        toMatchImage(expected: Buffer, options?: { writeDiff: boolean }): R;
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): R;
    }
}

expect.extend({ toMatchImageSnapshot, toMatchImage });
