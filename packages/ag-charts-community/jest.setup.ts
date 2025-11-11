import { expect } from '@jest/globals';
import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';
import { URL } from 'node:url';
import { TextDecoder, TextEncoder } from 'node:util';
import { DOMMatrix, Image, Path2D } from 'skia-canvas';

import { ModuleRegistry } from 'ag-charts-core';
import { mockCanvas, toMatchImage } from 'ag-charts-test';

import { AllCommunityModules } from './src/module-bundles/all';

// @ts-expect-error types don't exactly align
globalThis.Canvas = mockCanvas.ConfiguredCanvas;

// @ts-expect-error types don't exactly align
globalThis.OffscreenCanvas = mockCanvas.ConfiguredCanvas;

// @ts-expect-error types don't exactly align
globalThis.DOMMatrix = DOMMatrix;

// @ts-expect-error types don't exactly align
globalThis.Image = Image;

// @ts-expect-error types don't exactly align
globalThis.Path2D = Path2D;

// @ts-expect-error types don't exactly align
globalThis.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder;

// @ts-expect-error types don't exactly align
globalThis.URL = URL;

const TOGGLE_POPOVER_ATTRIBUTE = 'data-presented-as-popover';
globalThis.HTMLElement.prototype.togglePopover = function (visible) {
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
        toMatchImage(expected: ImageData, options?: { writeDiff: boolean }): R;
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): R;
    }
}

expect.extend({ toMatchImageSnapshot, toMatchImage });

ModuleRegistry.registerModules(AllCommunityModules);
