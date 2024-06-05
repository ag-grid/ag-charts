import { expect, jest } from '@jest/globals';
import { Blob } from 'buffer';
import { CanvasRenderingContext2D } from 'canvas';
import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';
import { Path2D, applyPath2DToCanvasRenderingContext } from 'path2d';
import { URL } from 'url';

import { toMatchImage } from 'ag-charts-community-test';

// @ts-expect-error
global.Blob = Blob;

// @ts-expect-error
global.Path2D = Path2D;

// @ts-expect-error
global.URL = URL;

applyPath2DToCanvasRenderingContext(CanvasRenderingContext2D);

declare module 'expect' {
    interface Matchers<R> {
        toMatchImage(expected: Buffer, options?: { writeDiff: boolean }): R;
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): R;
    }
}

expect.extend({ toMatchImageSnapshot, toMatchImage });

jest.mock('./src/license/licenseManager');
