import { expect, jest } from '@jest/globals';
import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';

import { toMatchImage } from 'ag-charts-community-test';

declare module 'expect' {
    interface Matchers<R> {
        toMatchImage(expected: Buffer, options?: { writeDiff: boolean }): R;
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): R;
    }
}

expect.extend({ toMatchImageSnapshot, toMatchImage });

jest.mock('./src/license/licenseManager');
