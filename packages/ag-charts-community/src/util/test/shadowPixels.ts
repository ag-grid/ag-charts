import { type MockInstance, afterEach, vi } from 'vitest';

import { Rect, Shape } from 'ag-charts-core';
import type { AgDropShadowOptions } from 'ag-charts-types';

import { expectWarningsCalls } from './mockConsole';

export const BLACK = [0, 0, 0, 255];

export type Pixel = number[];

/** A shadow of half-opaque red with no blur, so that the alpha of a pixel is the strength of the shadow cast on it. */
export const redHalfShadow = (xOffset: number, yOffset = 0) => ({
    enabled: true,
    fill: 'rgba(255, 0, 0, 0.5)',
    xOffset,
    yOffset,
    blur: 0,
});

/** Whether a pixel is the colour at half strength, as left by the shadow of that colour at half opacity. */
export const isHalf = (pixel: Pixel, [red, green, blue]: readonly [number, number, number]) =>
    pixel[0] === red && pixel[1] === green && pixel[2] === blue && Math.abs(pixel[3] - 128) <= 1;

export const isHalfRed = (pixel: Pixel) => isHalf(pixel, [255, 0, 0]);

/** The strongest alpha in a run of RGBA bytes: with an unblurred shadow on a transparent layer, the strength of the shadow. */
export const maxAlpha = (data: ArrayLike<number>) => {
    let max = 0;
    for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i]);
    return max;
};

export const box = (x: number, y: number, width: number, height: number, mixin: Partial<Rect> = {}) => {
    const node = new Rect();
    Object.assign(node, { x, y, width, height, fill: 'black', stroke: undefined, strokeWidth: 0, ...mixin });
    return node;
};

/** A shadow of half-opaque black with no blur, so that the colour of a pixel is the strength of the shadows cast on it. */
export const shadowAt = (xOffset: number, yOffset = 0): AgDropShadowOptions => ({
    enabled: true,
    fill: 'rgba(0, 0, 0, 0.5)',
    xOffset,
    yOffset,
    blur: 0,
});

/** Whether a pixel is black at half strength, as left by one shadow of {@link shadowAt} on white, give or take rounding. */
export const isHalfBlack = (pixel: Pixel) => pixel.slice(0, 3).every((channel) => Math.abs(channel - 128) <= 2);

const ROOT_FAILURE = 'Error during the shadow root pass';

/**
 * Makes the cast of the shadow root fail once it has gathered what to cast, so that every group casts its own shadows,
 * as it does when the root can't cast. Only a key of the root reads the strength of its casters when there is no spread.
 * The root warns of the failure, which {@link expectRootFailures} checks and clears.
 */
const withoutRoot = () =>
    vi.spyOn(Shape.prototype, 'getSpreadMaskStrength').mockImplementation(() => {
        throw new Error('The root cannot cast');
    });

/** Checks that every warning so far was of the root failing, as {@link withoutRoot} makes it, and that there was one. */
function expectRootFailures() {
    const onlyRootFailures = {
        asymmetricMatch: (calls: unknown[][]) =>
            calls.length > 0 && calls.every(([message]) => String(message).includes(ROOT_FAILURE)),
        toString: () => `at least one warning, and every one of them "${ROOT_FAILURE}"`,
    };
    expectWarningsCalls().toEqual(onlyRootFailures);
}

/**
 * Registers an `afterEach` that checks every warning of the test was of the root failing, and that there was one, and
 * returns the function that arms the failure. Only the spy is restored: restoring every mock would disarm the console
 * check that `setupMockConsole` makes after each test. Call it from the body of a `describe`.
 */
export function useFailedRootCast() {
    let rootSpy: MockInstance | undefined;

    afterEach(() => {
        if (rootSpy == null) return;

        expectRootFailures();
        rootSpy.mockRestore();
        rootSpy = undefined;
    });

    return () => {
        rootSpy = withoutRoot();
    };
}
