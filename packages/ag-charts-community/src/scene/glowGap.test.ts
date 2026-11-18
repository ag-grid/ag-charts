import { describe, expect, it, vi } from 'vitest';

import { Line, Sector } from 'ag-charts-core';
import type { NormalisedDropShadowOptions, Shape } from 'ag-charts-core';

import { Marker } from '../chart/marker/marker';
import {
    BLUE_RGB,
    CLEAR,
    GLOW_CENTRE,
    GLOW_PROBES,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    TRANSLUCENT_BLUE,
    redGlow,
    useGlowScenes,
} from '../chart/test/glowGapFixtures';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { box } from '../util/test/shadowPixels';

type Build = (mixin: Partial<Shape>) => Shape;

const { x: CENTRE_X, y: CENTRE_Y } = GLOW_CENTRE;
const { inside, near, middle, outer, past } = GLOW_PROBES;

// The root casts the glows in an overlay above the items, where the footprint of each item that glows is cut out of them,
// so a glow with no gap does not show through its own item as it does when a group or a cutout casts it beneath.
const CUTS_OWN_FOOTPRINT = 'root';

// Each shape is 60 across the line through its centre.
const SHAPES: Record<string, Build> = {
    rect: (mixin) => box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, mixin),
    sector: (mixin) =>
        Object.assign(new Sector(), {
            centerX: CENTRE_X,
            centerY: CENTRE_Y,
            innerRadius: 0,
            outerRadius: 30,
            startAngle: 0,
            endAngle: 2 * Math.PI,
            stroke: undefined,
            strokeWidth: 0,
            ...mixin,
        }),
    marker: (mixin) => {
        const marker = Object.assign(new Marker(), { stroke: undefined, strokeWidth: 0, ...mixin });
        marker.setVisibilityAndPosition(true, 'square', 60, { x: CENTRE_X, y: CENTRE_Y });
        return marker;
    },
};

describe('glow gap', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    describe.each(GLOW_ROUTES)('cast by the %s', (route) => {
        describe.each(Object.entries(SHAPES))('around a %s', (_name, build) => {
            const item = (gap?: number, mixin: Partial<Shape> = {}) =>
                build({ fill: TRANSLUCENT_BLUE, fillGlow: redGlow(gap), ...mixin });

            it('should cast the glow like a shadow, and show it through a translucent item unless it is an overlay, with no gap', () => {
                const { at } = draw(route, item());

                expect(at(near)[3]).toBeGreaterThan(0);
                expect(at(middle)[3]).toBeGreaterThan(0);
                expect(at(past)).toEqual(CLEAR);
                // The red of the glow is beneath the blue of the item, or, in an overlay, cut out of it.
                if (route === CUTS_OWN_FOOTPRINT) expect(at(inside)[0]).toBe(0);
                else expect(at(inside)[0]).toBeGreaterThan(0);
            });

            it('should cut the footprint of the item out of the glow with a gap of 0', () => {
                const unset = draw(route, item());
                const [nearUnset, middleUnset] = [unset.at(near), unset.at(middle)];
                const { at } = draw(route, item(0));

                // The glow is the same around the item, and none of it shows through the item.
                expect(at(near)).toEqual(nearUnset);
                expect(at(middle)).toEqual(middleUnset);
                expect(at(past)).toEqual(CLEAR);
                const pixel = at(inside);
                expect(pixel.slice(0, 3)).toEqual(BLUE_RGB);
                expect(Math.abs(pixel[3] - 128)).toBeLessThanOrEqual(1);
            });

            it('should start the glow further out with a larger gap', () => {
                const { at } = draw(route, item(5));

                expect(at(inside).slice(0, 3)).toEqual(BLUE_RGB);
                expect(at(near)).toEqual(CLEAR);
                expect(at(middle)[3]).toBeGreaterThan(0);
                // The glow ends a spread past where it starts, which is the gap and the spread past the item.
                expect(at(outer)[3]).toBeGreaterThan(0);
                expect(at(past)).toEqual(CLEAR);
            });

            it('should clear the whole footprint of an item with no fill, which its stroke glows around', () => {
                const { at } = draw(route, item(0, { fill: undefined, stroke: TRANSLUCENT_BLUE, strokeWidth: 4 }));

                expect(at(near + 2)[3]).toBeGreaterThan(0);
                expect(at(past)).toEqual(CLEAR);
                // The glow of the stroke reaches 6px inside the edge, where the item has no fill to cover it.
                expect(at(-6)).toEqual(CLEAR);
            });
        });

        describe('with the spread at 0', () => {
            // A blurred glow, which reaches past the item by its blur alone, and a probe 2px left of the item, which is 60 across.
            const blurredGlow = (gap: number | undefined, spread = 0) => ({ ...redGlow(gap), blur: 8, spread });
            const LEFT_EDGE_PROBE: [number, number] = [CENTRE_X - 32, CENTRE_Y];

            // A fill that is transparent at the left of an item and opaque at the right, which an ungapped glow follows.
            const FADING = {
                type: 'gradient' as const,
                gradient: 'linear' as const,
                rotation: 90,
                colorStops: [
                    { color: 'rgba(0, 0, 255, 0)', stop: 0 },
                    { color: 'rgba(0, 0, 255, 1)', stop: 1 },
                ],
            };

            const expectNear = (actual: number[], expected: number[]) => {
                expect(expected[3]).toBeGreaterThan(0);
                expect(Math.abs(actual[3] - expected[3])).toBeLessThanOrEqual(3);
            };

            it('should cut the item out of a glow with a gap of 0 that dilates nothing, and cast it as with no gap', () => {
                const plain = (gap?: number) =>
                    box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, {
                        fill: TRANSLUCENT_BLUE,
                        fillGlow: blurredGlow(gap),
                    });
                const unset = draw(route, plain()).pixelAt(...LEFT_EDGE_PROBE);

                const { pixelAt } = draw(route, plain(0));

                expect(pixelAt(CENTRE_X, CENTRE_Y).slice(0, 3)).toEqual(BLUE_RGB);
                expectNear(pixelAt(...LEFT_EDGE_PROBE), unset);
            });

            // A gap casts the silhouette of the item, as a spread does, not its real paint, which an ungapped glow with no
            // spread casts. The silhouette of a spread of a hair stands for it.
            it.each([
                ['a gradient fill that fades out at the probe', { fill: FADING }],
                [
                    'a dashed stroke',
                    { fill: undefined, stroke: 'rgba(0, 0, 255, 0.5)', strokeWidth: 6, lineDash: [10, 10] },
                ],
            ])('should cast the glow of %s as a spread does with a gap of 0', (_name, paint) => {
                const alphasLeftOfItem = (glow: ReturnType<typeof blurredGlow>) => {
                    const { pixelAt } = draw(
                        route,
                        box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, { ...paint, fillGlow: glow })
                    );
                    return Array.from({ length: 16 }, (_, i) => pixelAt(LEFT_EDGE_PROBE[0], CENTRE_Y - 30 + i * 4)[3]);
                };
                const real = alphasLeftOfItem(blurredGlow(undefined));
                const dilated = alphasLeftOfItem(blurredGlow(undefined, 0.01));

                const gapped = alphasLeftOfItem(blurredGlow(0));

                expect(Math.max(...gapped.map((alpha, i) => Math.abs(alpha - dilated[i])))).toBeLessThanOrEqual(3);
                expect(Math.max(...dilated.map((alpha, i) => alpha - real[i]))).toBeGreaterThan(10);
            });
        });

        // In an overlay each glow is cut out of itself, so an unset gap and a gap of 0 differ only where the dilation reaches.
        it.skipIf(route === CUTS_OWN_FOOTPRINT)(
            'should keep an unset gap and a gap of 0 apart in one batch, as it keeps their spreads',
            () => {
                const left = box(60, CENTRE_Y - 30, 60, 60, { fill: TRANSLUCENT_BLUE, fillGlow: redGlow() });
                const right = box(280, CENTRE_Y - 30, 60, 60, { fill: TRANSLUCENT_BLUE, fillGlow: redGlow(0) });
                const { pixelAt } = draw(route, left, right);

                expect(pixelAt(90, CENTRE_Y)[0]).toBeGreaterThan(0);
                expect(pixelAt(310, CENTRE_Y).slice(0, 3)).toEqual(BLUE_RGB);
            }
        );

        // The cutout route erases beneath the item by design, so it is left out.
        describe.skipIf(route === 'cutout')('beneath a translucent item with a gap of 0', () => {
            const gapped = () =>
                box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, { fill: TRANSLUCENT_BLUE, fillGlow: redGlow(0) });
            const bare = () => box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, { fill: TRANSLUCENT_BLUE });
            const GREEN = { enabled: true, fill: 'rgba(0, 255, 0, 1)', xOffset: 140, yOffset: 0, blur: 0 };
            // Its shadow falls inside the footprint of the gapped item.
            const shadowCaster = () => box(60, CENTRE_Y - 10, 20, 20, { fill: 'black', fillShadow: GREEN });
            // Its glow reaches 20px past its right edge, into the footprint of the gapped item.
            const glowCaster = () =>
                box(120, CENTRE_Y - 15, 30, 30, { fill: 'black', fillGlow: { ...redGlow(), spread: 30 } });

            // An overlay cuts the footprint of every item that glows out of every glow, so the glow of another item does not show.
            it.each(
                [
                    ['the shadow of another item', shadowCaster, [215, CENTRE_Y], 1],
                    ['the glow of another item', glowCaster, [175, CENTRE_Y], 0],
                ].filter(([name]) => route !== CUTS_OWN_FOOTPRINT || String(name).includes('shadow')) as [
                    string,
                    () => Shape,
                    [number, number],
                    number,
                ][]
            )('should leave %s showing through the item', (_name, other, probe, channel) => {
                const expected = draw(route, other(), bare()).pixelAt(probe[0], probe[1]);
                expect(expected[channel]).toBeGreaterThan(100);

                const { pixelAt } = draw(route, other(), gapped());

                expect(pixelAt(probe[0], probe[1])).toEqual(expected);
            });
        });

        describe('around the sharp point of a stroked star', () => {
            const OPAQUE_BLUE = 'rgb(0, 0, 255)';
            const star = (paint: Partial<Shape>, glow?: NormalisedDropShadowOptions) => {
                const marker = Object.assign(new Marker(), {
                    fill: OPAQUE_BLUE,
                    stroke: OPAQUE_BLUE,
                    strokeWidth: 1,
                    ...paint,
                    fillGlow: glow,
                });
                marker.setVisibilityAndPosition(true, 'star', 80, { x: CENTRE_X, y: CENTRE_Y });
                return marker;
            };
            /** The y of the top point of the star: the first pixel above the centre that is not opaque. */
            const tipOf = (pixelAt: (x: number, y: number) => number[]) => {
                let y = CENTRE_Y;
                while (pixelAt(CENTRE_X, y)[2] > 200) y -= 1;
                return y;
            };

            it('should cut the point as the stroke paints it, and leave the glow around it unbroken', () => {
                const gap = 3;
                const { pixelAt } = draw(route, star({}, { ...redGlow(gap), spread: 4, blur: 8 }));
                const tip = tipOf(pixelAt);
                const alphaAt = (dx: number, distance: number) => pixelAt(CENTRE_X + dx, tip - distance)[3];

                // The cut has the join and miter limit of the stroke, so it follows the point the stroke paints: nothing is
                // lit within a gap of it, and the glow of the band that the cut leaves is there beyond.
                for (let distance = 0; distance <= gap; distance++) expect(alphaAt(0, distance)).toBe(0);
                expect(alphaAt(0, 3 * gap)).toBeGreaterThan(40);
                // The band is closed round the point: it is not broken over the point, or beside it.
                for (const dx of [-3, 0, 3]) expect(alphaAt(dx, 3 * gap + 2)).toBeGreaterThan(0);
            });

            // A glow of 8 that starts a gap of 3 from a star whose 6px miter-joined stroke paints a spike past each vertex.
            const THICK_GLOW = { ...redGlow(3), spread: 8, blur: 0 };
            const THICK_GAP = 3;
            const THICK_SPREAD = 8;
            const THICK_STROKE = { stroke: OPAQUE_BLUE, strokeWidth: 6, miterLimit: 10 };

            type Pixels = (x: number, y: number) => number[];
            // What a pixel is: the item, the glow, or neither, which is where the cut is, and beyond the glow.
            const classOf = ([red, , blue, alpha]: number[]) => {
                if (red > 0) return 'glow';
                return blue > 0 && alpha >= 128 ? 'item' : 'none';
            };
            const WINDOW = { left: CENTRE_X - 40, right: CENTRE_X + 40, top: CENTRE_Y - 80, bottom: CENTRE_Y };

            /** The distance from each pixel of a glow in the window to the nearest pixel that the item paints. */
            const glowDistances = (bare: Pixels, glowing: Pixels) => {
                const painted: [number, number][] = [];
                const glow: [number, number][] = [];
                for (let y = WINDOW.top; y <= WINDOW.bottom; y++) {
                    for (let x = WINDOW.left; x <= WINDOW.right; x++) {
                        if (bare(x, y)[3] >= 128) painted.push([x, y]);
                        else if (classOf(glowing(x, y)) === 'glow') glow.push([x, y]);
                    }
                }
                return glow.map(([x, y]) => Math.min(...painted.map(([px, py]) => Math.hypot(x - px, y - py))));
            };

            /** Going up each column over the star's point, the pixels are the item, the cut, the glow, then nothing. */
            const expectRingOverPoint = (pixelAt: Pixels, gap: number, spread: number) => {
                for (const dx of [-6, -3, 0, 3, 6]) {
                    const runs: { class: string; length: number }[] = [];
                    for (let y = CENTRE_Y; y >= WINDOW.top; y--) {
                        const pixelClass = classOf(pixelAt(CENTRE_X + dx, y));
                        const last = runs.at(-1);
                        if (last?.class === pixelClass) last.length++;
                        else runs.push({ class: pixelClass, length: 1 });
                    }
                    const column = runs.map((run) => run.class).join(',');
                    expect(column, `the column ${dx} from the axis`).toBe('item,none,glow,none');
                    // The cut is a gap, and the glow a spread, in a column over the point, where they are at least as long as that.
                    expect(runs[1].length, `the cut in the column ${dx} from the axis`).toBeGreaterThanOrEqual(gap);
                    expect(runs[2].length, `the glow in the column ${dx} from the axis`).toBeGreaterThanOrEqual(
                        spread - 1
                    );
                }
            };

            it('should keep the glow a gap clear of the spike that a thick stroke paints at a point, with a ring unbroken over it', () => {
                const bare = draw(route, star(THICK_STROKE)).pixelAt;
                const { pixelAt } = draw(route, star(THICK_STROKE, THICK_GLOW));

                // No pixel within a gap of the item, with its spike, is lit; a pixel of the sub-pixel edge of the spike is a pixel off.
                expect(Math.min(...glowDistances(bare, pixelAt))).toBeGreaterThanOrEqual(THICK_GAP - 1);
                expectRingOverPoint(pixelAt, THICK_GAP, THICK_SPREAD);
            });

            it('should keep the glow a gap, and not more, from the point of a star with no stroke, with a ring unbroken over it', () => {
                const plain = { stroke: undefined, strokeWidth: 0 };
                const bare = draw(route, star(plain)).pixelAt;
                const { pixelAt } = draw(route, star(plain, THICK_GLOW));

                expect(Math.min(...glowDistances(bare, pixelAt))).toBeGreaterThanOrEqual(THICK_GAP - 1);
                expectRingOverPoint(pixelAt, THICK_GAP, THICK_SPREAD);

                // Over the point, the rows with nothing in them between the point and the glow are the gap, within a pixel.
                let y = CENTRE_Y;
                while (bare(CENTRE_X, y)[3] > 0) y--;
                const tip = y + 1;
                let cut = 0;
                for (y = tip - 1; classOf(pixelAt(CENTRE_X, y)) !== 'glow'; y--) cut++;
                expect(Math.abs(cut - THICK_GAP)).toBeLessThanOrEqual(1);
            });

            it('should cut the whole point of a translucent star out of the glow with a gap of 0', () => {
                // A stroke of 6 with a miter join spikes well past the round join that dilates it, and the item paints that spike.
                const stroke = { fill: TRANSLUCENT_BLUE, stroke: TRANSLUCENT_BLUE, strokeWidth: 6, miterLimit: 10 };
                const tip = tipOf(draw(route, star(stroke)).pixelAt);
                const { pixelAt } = draw(route, star(stroke, redGlow(0)));

                // A few pixels inside the spike that the stroke paints, where the glow would show through as red.
                const inSpike = pixelAt(CENTRE_X, tip + 4);
                expect(inSpike[3]).toBeGreaterThan(0);
                expect(inSpike[0]).toBe(0);
            });
        });

        // The shape's own cast makes its silhouette canvas, then the canvas that the gap is cut on, which the browser can refuse.
        it.runIf(route === 'cutout')('should cast the glow without the cut when no canvas can cut it', () => {
            const getContext = OffscreenCanvas.prototype.getContext;
            const canvases: OffscreenCanvas[] = [];
            const refuseGapCanvas = vi.spyOn(OffscreenCanvas.prototype, 'getContext').mockImplementation(function (
                this: OffscreenCanvas,
                ...args: Parameters<typeof getContext>
            ) {
                if (!canvases.includes(this)) canvases.push(this);
                return canvases.indexOf(this) === 1 ? null : getContext.apply(this, args);
            } as typeof getContext);
            let at: ReturnType<typeof draw>['at'];
            try {
                ({ at } = draw(route, SHAPES.rect({ fill: TRANSLUCENT_BLUE, fillGlow: redGlow(0) })));
            } finally {
                refuseGapCanvas.mockRestore();
            }

            expect(canvases.length).toBeGreaterThan(1);
            // The glow is cast as it is with no gap, so it shows through the translucent item.
            expect(at(near)[3]).toBeGreaterThan(0);
            expect(at(middle)[3]).toBeGreaterThan(0);
            expect(at(past)).toEqual(CLEAR);
            expect(at(inside)[0]).toBeGreaterThan(0);
        });

        it.each([Number.NaN, Number.POSITIVE_INFINITY])('should cast no glow with a gap of %s', (gap) => {
            const { at } = draw(route, SHAPES.rect({ fill: TRANSLUCENT_BLUE, fillGlow: redGlow(gap) }));

            expect(at(near)).toEqual(CLEAR);
            expect(at(middle)).toEqual(CLEAR);
        });

        // A Line has no Path2D to dilate, so a cutout casts its glow inline with its stroke, as it casts one with a spread
        // and no gap: it reaches no further than its own stroke, and the gap changes nothing. A batch dilates its stroke.
        const line = (gap?: number, lineCap?: Line['lineCap']) =>
            Object.assign(new Line(), {
                ...(lineCap != null && { lineCap }),
                x1: 120,
                y1: CENTRE_Y,
                x2: 280,
                y2: CENTRE_Y,
                stroke: TRANSLUCENT_BLUE,
                strokeWidth: 6,
                fillGlow: redGlow(gap),
            });
        // Pixels above the line: 3px up is its edge, so the glow starts a gap past it.
        const up = (distance: number) => [CENTRE_X, CENTRE_Y - 3 - distance] as const;

        it.skipIf(route === 'cutout')('should widen the stroke of a line by the gap and the spread', () => {
            const unset = draw(route, line());
            expect(unset.pixelAt(...up(2))[3]).toBeGreaterThan(0);
            // The glow shows through the stroke, unless an overlay cuts the stroke out of it.
            if (route === CUTS_OWN_FOOTPRINT) expect(unset.pixelAt(CENTRE_X, CENTRE_Y)[0]).toBe(0);
            else expect(unset.pixelAt(CENTRE_X, CENTRE_Y)[0]).toBeGreaterThan(0);

            const gapped = draw(route, line(5));
            expect(gapped.pixelAt(...up(2))).toEqual(CLEAR);
            expect(gapped.pixelAt(...up(7))[3]).toBeGreaterThan(0);
            expect(gapped.pixelAt(CENTRE_X, CENTRE_Y).slice(0, 3)).toEqual(BLUE_RGB);
        });

        // A cutout casts the glow of a line inline, so the gap doesn't cut it. The line runs from x 120 to 280, 6 thick.
        describe.skipIf(route === 'cutout')('past the end of a line', () => {
            const LINE_END = 280;
            const row = (pixelAt: (x: number, y: number) => number[], x: number) => pixelAt(x, CENTRE_Y);

            it.each([0, 2, 5])(
                'should end the cut of a butt cap a gap of %d past the end, not a half-stroke and a gap',
                (gap) => {
                    const { pixelAt } = draw(route, line(gap, 'butt'));

                    expect(row(pixelAt, LINE_END - 2).slice(0, 3)).toEqual(BLUE_RGB);
                    for (let distance = 0; distance < gap; distance++) {
                        expect(row(pixelAt, LINE_END + distance), `${distance}px past the end`).toEqual(CLEAR);
                    }
                    for (const distance of [gap, gap + 1, gap + 3]) {
                        expect(row(pixelAt, LINE_END + distance)[3], `${distance}px past the end`).toBeGreaterThan(0);
                    }
                }
            );

            it('should treat a line with no cap set as a line with a butt cap', () => {
                const [unset, butt] = [undefined, 'butt' as const].map((cap) => {
                    const { pixelAt } = draw(route, line(5, cap));
                    return Array.from({ length: 20 }, (_, i) => row(pixelAt, LINE_END - 5 + i));
                });

                expect(unset).toEqual(butt);
            });

            // Square and round caps reach a half-stroke past the end, 3px, and the gap is past where they end.
            it.each(['square', 'round'] as const)('should end the cut of a %s cap a gap past the cap', (cap) => {
                const gap = 5;
                const { pixelAt } = draw(route, line(gap, cap));
                const capEnd = LINE_END + 3;

                expect(row(pixelAt, capEnd - 2)[2]).toBeGreaterThan(0);
                for (let distance = 0; distance < gap - 1; distance++) {
                    expect(row(pixelAt, capEnd + distance), `${distance}px past the cap`).toEqual(CLEAR);
                }
                for (const distance of [gap + 1, gap + 4]) {
                    expect(row(pixelAt, capEnd + distance)[3], `${distance}px past the cap`).toBeGreaterThan(0);
                }
            });

            it('should cast the glow past the end of a butt cap with no gap', () => {
                const { pixelAt } = draw(route, line(undefined, 'butt'));

                // A glow with no gap is cut nowhere past the end, apart from the footprint that a root cuts out of it.
                for (const distance of [4, 8, 12]) {
                    expect(row(pixelAt, LINE_END + distance)[3], `${distance}px past the end`).toBeGreaterThan(0);
                }
                expect(row(pixelAt, LINE_END + 20)).toEqual(CLEAR);
            });
        });

        it.runIf(route === 'cutout')('should cast the glow of a line inline, with no spread and no gap', () => {
            for (const gap of [undefined, 0, 5]) {
                const { pixelAt } = draw(route, line(gap));
                expect(pixelAt(...up(2))).toEqual(CLEAR);
            }
        });
    });
});
