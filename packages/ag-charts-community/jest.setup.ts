import { expect } from '@jest/globals';
import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';

import { toMatchImage } from './src/chart/test/utils';

declare module 'expect' {
    interface Matchers<R> {
        toMatchImage(expected: Buffer, options?: { writeDiff: boolean }): R;
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): R;
    }
}

expect.extend({ toMatchImageSnapshot, toMatchImage });
