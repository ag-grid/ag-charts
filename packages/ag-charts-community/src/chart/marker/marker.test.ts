import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExtendedPath2D, MARKER_SHAPES, getSharedMarkerPath, markerSnapAllowance } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';

import { fakeLayersManagerWithCanvas } from '../../scene/test/sceneFakes';
import { setupMockCanvas } from '../../util/test/mockCanvas';
import { Marker } from './marker';

describe('Marker', () => {
    describe('pixel snapping', () => {
        setupMockCanvas();
        afterEach(() => {
            vi.restoreAllMocks();
        });

        const STEPS = 40;

        /** The most px any edge of `shape` lands from its nominal position, over sub-pixel sizes and positions. */
        const worstMeasuredInset = (shape: keyof typeof MARKER_SHAPES, pixelRatio: number) => {
            const ctx = document.createElement('canvas').getContext('2d');
            if (ctx == null) throw new Error('no 2d context');
            const translate = vi.spyOn(ctx, 'translate');
            const drawn = vi.spyOn(ExtendedPath2D.prototype, 'getPath2D');
            const marker = new Marker();
            vi.spyOn(marker, 'layerManager', 'get').mockReturnValue(fakeLayersManagerWithCanvas({ pixelRatio }));
            marker.shape = shape;
            const anchor = Marker.anchor(shape);

            let worst = 0;
            for (let i = 0; i < STEPS; i++) {
                for (let j = 0; j < STEPS; j++) {
                    marker.x = 20 + i / STEPS;
                    marker.y = 20 + j / STEPS;
                    marker.size = 10 + (i * STEPS + j) / (STEPS * STEPS);
                    marker.updatePath();
                    marker.drawPath(ctx, testLogger);

                    const [tx, ty] = translate.mock.lastCall ?? [Number.NaN, Number.NaN];
                    const path = drawn.mock.contexts.at(-1);
                    if (!(path instanceof ExtendedPath2D)) throw new Error('no path drawn');
                    const box = path.computeBBox();
                    const { size } = marker;
                    const nominal = getSharedMarkerPath(shape, size).computeBBox();
                    const nx = marker.x - (anchor.x - 0.5) * size;
                    const ny = marker.y - (anchor.y - 0.5) * size;
                    worst = Math.max(
                        worst,
                        Math.abs(tx + box.x - (nx + nominal.x)),
                        Math.abs(ty + box.y - (ny + nominal.y)),
                        Math.abs(tx + box.x + box.width - (nx + nominal.x + nominal.width)),
                        Math.abs(ty + box.y + box.height - (ny + nominal.y + nominal.height))
                    );
                }
            }
            return worst;
        };

        const shapes = Object.keys(MARKER_SHAPES) as (keyof typeof MARKER_SHAPES)[];
        it.each(shapes.flatMap((shape) => [0.5, 0.75, 1, 2].map((pixelRatio) => ({ shape, pixelRatio }))))(
            '$shape at pixel ratio $pixelRatio: the snap allowance bounds how far a drawn edge moves, and closely',
            ({ shape, pixelRatio }) => {
                const measured = worstMeasuredInset(shape, pixelRatio);
                const allowance = markerSnapAllowance(shape, pixelRatio);
                expect(allowance).toBeGreaterThanOrEqual(measured);
                expect(allowance).toBeLessThanOrEqual(measured + 0.05);
            }
        );
    });

    describe('distanceSquared', () => {
        it('measures distance from the translated position, not the untransformed origin', () => {
            const marker = new Marker();
            marker.shape = 'square';
            marker.size = 20;
            marker.translationX = 100;
            marker.translationY = 100;

            // Pointer over the marker's rendered centre (its translation) reads as a hit.
            expect(marker.distanceSquared(100, 100)).toBe(0);

            // Pointer near the scene origin — far from the rendered marker — must not read as a hit.
            expect(marker.distanceSquared(0, 0)).toBeGreaterThan(0);
        });
    });

    describe('pickInflation (AG-8173 — the drawn stroke is part of the node)', () => {
        const makeMarker = (pickInflation: number) => {
            const marker = new Marker();
            marker.shape = 'circle';
            marker.size = 20;
            marker.x = 0;
            marker.y = 0;
            marker.pickInflation = pickInflation;
            return marker;
        };

        it('defaults to no inflation, so an unstroked node keeps exactly its size/2 hit region', () => {
            const marker = makeMarker(0);

            expect(marker.pickInflation).toBe(0);
            expect(marker.isPointInPath(10, 0)).toBe(true);
            expect(marker.isPointInPath(10.5, 0)).toBe(false);
            expect(marker.isPointInPath(12, 0)).toBe(false);
        });

        it('accepts a point inside the stroke band and still rejects one beyond it', () => {
            // A 10px stroke straddles the path, so the drawn outer radius is 10 + 5 = 15.
            const marker = makeMarker(5);

            expect(marker.isPointInPath(12, 0)).toBe(true);
            expect(marker.isPointInPath(15, 0)).toBe(true);
            expect(marker.isPointInPath(15.5, 0)).toBe(false);
            // Diagonally too — the region is a disc, not a box.
            expect(marker.isPointInPath(10, 10)).toBe(true);
            expect(marker.isPointInPath(11, 11)).toBe(false);
        });

        it('leaves distanceSquared — the nearest/numeric range metric — unchanged', () => {
            const plain = makeMarker(0);
            const inflated = makeMarker(5);

            for (const [x, y] of [
                [0, 0],
                [12, 0],
                [40, 30],
            ]) {
                expect(inflated.distanceSquared(x, y)).toBe(plain.distanceSquared(x, y));
            }
        });

        it('respects non-centred anchors', () => {
            // 'pin' is anchored at {x: 0.5, y: 1}, so its disc centre sits size/2 above `y`.
            const pin = new Marker();
            pin.shape = 'pin';
            pin.size = 20;
            pin.x = 0;
            pin.y = 0;
            pin.pickInflation = 5;

            expect(pin.isPointInPath(0, -10)).toBe(true);
            expect(pin.isPointInPath(0, -22)).toBe(true);
            expect(pin.isPointInPath(0, -26)).toBe(false);
        });
    });
});
