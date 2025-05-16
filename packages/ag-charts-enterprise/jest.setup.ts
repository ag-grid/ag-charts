import { expect, jest } from '@jest/globals';
import { Blob } from 'buffer';
import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';
import { Canvas, DOMMatrix, Path2D } from 'skia-canvas';
import { URL } from 'url';

import { toMatchImage } from 'ag-charts-community-test';

// Canvas globals
// note if we're using the JSDom setup, these are already set - and must not be reset
// @ts-expect-error types don't exactly align
global.OffscreenCanvas ??= Canvas;
// @ts-expect-error types don't exactly align
global.DOMMatrix ??= DOMMatrix;
// @ts-expect-error types don't exactly align
global.Path2D ??= Path2D;

// @ts-expect-error types don't exactly align
global.Blob = Blob;

// @ts-expect-error types don't exactly align
global.URL = URL;

const TOGGLE_POPOVER_ATTRIBUTE = 'data-presented-as-popover';
global.HTMLElement.prototype.togglePopover = function (visible) {
    visible ??= !this.hasAttribute(TOGGLE_POPOVER_ATTRIBUTE);

    if (visible) {
        this.setAttribute(TOGGLE_POPOVER_ATTRIBUTE, '');
    } else {
        this.removeAttribute(TOGGLE_POPOVER_ATTRIBUTE);
    }

    return visible;
};

declare module 'expect' {
    interface Matchers<R> {
        toMatchImage(expected: Buffer, options?: { writeDiff: boolean }): R;
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): R;
    }
}

expect.extend({ toMatchImageSnapshot, toMatchImage });

jest.mock('./src/license/licenseManager');
