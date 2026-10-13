import { describe, expect, test } from 'vitest';

import type { BoxBounds } from './boxBounds';
import { PanToBBoxScalingModeEnum, calcPanToBBoxRatios } from './panToBBox';

type Ratios = { min: number; max: number };

const { None, WhenViewportTooSmallScaleXYProportionally, WhenViewportTooSmallScaleXYDisproportionally } =
    PanToBBoxScalingModeEnum;

const viewport: BoxBounds = { x: 0, y: 0, width: 100, height: 100 };

function expectRatios(actual: Ratios, expected: Ratios) {
    expect(actual.min).toBeCloseTo(expected.min, 10);
    expect(actual.max).toBeCloseTo(expected.max, 10);
}

// Screen-space y-coordinates are y-down, zoom ratios are y-up: the viewport's top edge (y) is
// `ratio.max` and its bottom edge (y + height) is `ratio.min`.
function screenYToRatio(vp: BoxBounds, ratio: Ratios, screenY: number): number {
    return ratio.min + ((vp.y + vp.height - screenY) / vp.height) * (ratio.max - ratio.min);
}

describe('calcPanToBBoxRatios', () => {
    describe('y-axis', () => {
        // Each 100px viewport shows a quarter of the world, so 1px === 0.0025 ratio units.
        test('pans up when the target is above the viewport', () => {
            const target = { x: 10, y: -20, width: 10, height: 10 };
            const result = calcPanToBBoxRatios(None, viewport, { y: { min: 0, max: 0.25 } }, target);
            expectRatios(result.y, { min: 0.05, max: 0.3 });
        });

        test('pans down when the target is below the viewport', () => {
            const target = { x: 10, y: 110, width: 10, height: 10 };
            const result = calcPanToBBoxRatios(None, viewport, { y: { min: 0.5, max: 0.75 } }, target);
            expectRatios(result.y, { min: 0.45, max: 0.7 });
        });

        test('does not pan when the target is inside the viewport', () => {
            const target = { x: 10, y: 40, width: 10, height: 10 };
            const result = calcPanToBBoxRatios(None, viewport, { y: { min: 0.5, max: 0.75 } }, target);
            expectRatios(result.y, { min: 0.5, max: 0.75 });
        });

        test('clamps at the top of the world', () => {
            const target = { x: 10, y: -40, width: 10, height: 10 };
            const result = calcPanToBBoxRatios(None, viewport, { y: { min: 0.7, max: 0.95 } }, target);
            expectRatios(result.y, { min: 0.75, max: 1 });
        });

        test('clamps at the bottom of the world', () => {
            const target = { x: 10, y: 130, width: 10, height: 10 };
            const result = calcPanToBBoxRatios(None, viewport, { y: { min: 0.05, max: 0.3 } }, target);
            expectRatios(result.y, { min: 0, max: 0.25 });
        });

        test('handles a viewport that is not at the screen origin', () => {
            const offsetViewport = { x: 50, y: 30, width: 100, height: 100 };
            const target = { x: 60, y: 10, width: 10, height: 10 };
            const result = calcPanToBBoxRatios(None, offsetViewport, { y: { min: 0, max: 0.25 } }, target);
            expectRatios(result.y, { min: 0.05, max: 0.3 });
        });

        test('brings the target into the new viewport', () => {
            const before = { min: 0.3, max: 0.4 };
            for (const target of [
                { x: 10, y: -75, width: 10, height: 5 },
                { x: 10, y: 160, width: 10, height: 5 },
            ]) {
                const { y: after } = calcPanToBBoxRatios(None, viewport, { y: before }, target);
                const targetTop = screenYToRatio(viewport, before, target.y);
                const targetBottom = screenYToRatio(viewport, before, target.y + target.height);
                expect(after.max - after.min).toBeCloseTo(before.max - before.min, 10);
                expect(after.min).toBeLessThanOrEqual(targetBottom + 1e-10);
                expect(after.max).toBeGreaterThanOrEqual(targetTop - 1e-10);
            }
        });
    });

    describe('x-axis', () => {
        test('pans right when the target is right of the viewport', () => {
            const target = { x: 110, y: 10, width: 10, height: 10 };
            const result = calcPanToBBoxRatios(None, viewport, { x: { min: 0, max: 0.25 } }, target);
            expectRatios(result.x, { min: 0.05, max: 0.3 });
        });

        test('pans left when the target is left of the viewport', () => {
            const target = { x: -20, y: 10, width: 10, height: 10 };
            const result = calcPanToBBoxRatios(None, viewport, { x: { min: 0.5, max: 0.75 } }, target);
            expectRatios(result.x, { min: 0.45, max: 0.7 });
        });
    });

    test('pans both axes independently', () => {
        const target = { x: 110, y: -20, width: 10, height: 10 };
        const ratios = { x: { min: 0, max: 0.25 }, y: { min: 0, max: 0.25 } };
        const result = calcPanToBBoxRatios(None, viewport, ratios, target);
        expectRatios(result.x, { min: 0.05, max: 0.3 });
        expectRatios(result.y, { min: 0.05, max: 0.3 });
    });

    test('defaults missing ratios to the full range', () => {
        const target = { x: 10, y: -20, width: 10, height: 10 };
        const result = calcPanToBBoxRatios(None, viewport, {}, target);
        expectRatios(result.x, { min: 0, max: 1 });
        expectRatios(result.y, { min: 0, max: 1 });
    });

    test('keeps the viewport on an axis where the target is too large (disproportional)', () => {
        const target = { x: 110, y: -150, width: 10, height: 200 };
        const ratios = { x: { min: 0, max: 0.25 }, y: { min: 0.25, max: 0.5 } };
        const result = calcPanToBBoxRatios(WhenViewportTooSmallScaleXYDisproportionally, viewport, ratios, target);
        expectRatios(result.x, { min: 0.05, max: 0.3 });
        expectRatios(result.y, { min: 0.25, max: 0.5 });
    });

    test('pans in the y-up direction when scaling proportionally', () => {
        const target = { x: 10, y: -20, width: 10, height: 10 };
        const result = calcPanToBBoxRatios(
            WhenViewportTooSmallScaleXYProportionally,
            viewport,
            { y: { min: 0, max: 0.25 } },
            target
        );
        expectRatios(result.y, { min: 0.05, max: 0.3 });
    });
});
