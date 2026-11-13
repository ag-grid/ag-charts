import { afterEach, describe, expect, it } from 'vitest';

import { Rect, Sector, Transformable } from 'ag-charts-core';
import type { AgGlowOptions } from 'ag-charts-types';

import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { expectSamePixels } from '../test/expectSamePixels';
import { ALI_GLOW, RENDER_OPTIONS, canvasImage, hoverDatum } from '../test/glowRender';
import { getSeriesAt } from '../test/seriesAccessors';
import { SERIES_SHADOW, shapesOf } from '../test/shadowFixtures';
import {
    chartPixelAt,
    createChart,
    deproxy,
    hoverLegendItem,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const RED = [255, 0, 0, 255];
const BLUE = [0, 0, 255, 255];
const GREEN = [0, 128, 0, 255];
const WHITE = [255, 255, 255, 255];

/** Opaque and unblurred, so that the edges of a glow can be read off a pixel. */
const hard = (glow: AgGlowOptions = {}): AgGlowOptions => ({
    enabled: true,
    fill: '#ff0000',
    fillOpacity: 1,
    blur: 0,
    ...glow,
});

/** The axes of a chart of a single marker at the middle of the series area, with no gridline through it. */
const CENTRED = {
    x: { type: 'number', min: 0, max: 4, gridLine: { enabled: false } },
    y: { type: 'number', min: 0, max: 8, gridLine: { enabled: false } },
};

/** The glow reaches 40px beyond an item, so the chart sits 60px inside the crop on three sides, and has room beneath. */
const ROOM = { ...RENDER_OPTIONS, padding: { top: 60, left: 60, right: 440, bottom: 350 } };

describe('glow refinements', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    const create = async (options: object) => {
        chart?.destroy();
        chart = deproxy(await createChart({ ...ROOM, ...options } as any));
        await waitForChartStability(chart);
        return chart;
    };

    const pixel = (x: number, y: number) => chartPixelAt(chart, x, y);
    const boundsOf = (node: Rect | Marker) => Transformable.toCanvas(node);
    const barBounds = (seriesIndex = 0) => boundsOf(shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, Rect)[0]);
    const markerCentre = (index: number) => {
        const { x, y, width } = boundsOf(shapesOf(getSeriesAt(chart).contentGroup, Marker)[index]);
        return { x: x + width / 2, y: y + width / 2 };
    };

    describe('the inner edge of a glow gap', () => {
        // The glow of the design feedback, in red, as a glow with no fill takes the fill of its item.
        const GLOW = hard(ALI_GLOW);
        const { gap = 0, spread = 0 } = GLOW;
        const HEADROOM = { axes: { y: { type: 'number', min: 0, max: 8 } } };

        // The glow is cast three ways: for every item of the series, for an item by its itemStyler, and for the hovered item.
        const PLACEMENTS: [string, object, boolean][] = [
            ['the series glow', { glow: GLOW }, false],
            ['the glow an itemStyler returns', { itemStyler: () => ({ glow: GLOW }) }, false],
            ['the glow of the hovered item', { highlight: { highlightedItem: { glow: GLOW } } }, true],
        ];

        const createBar = async (series: object, hover: boolean) => {
            await create({
                data: [{ category: 'A', value: 4 }],
                ...HEADROOM,
                series: [{ type: 'bar', xKey: 'category', yKey: 'value', ...series }],
            });
            if (hover) await hoverDatum(chart);
            return barBounds();
        };

        // Ali's glow is 16px wide and starts 24px clear of the item. A probe 3px inside the corner of the square that the gap cuts
        // out of it, measured from the corner of the item, is cleared where the inner edge is square, and in the glow where it is round.
        const innerCorner = ({ x, y }: { x: number; y: number }): [number, number] => [x - gap + 3, y - gap + 3];
        const outerCorner = ({ x, y }: { x: number; y: number }): [number, number] => [
            x - gap - spread + 3,
            y - gap - spread + 3,
        ];

        it.each(PLACEMENTS)(
            'cuts a square corner for a bar with no corner radius, from %s',
            async (_name, series, hover) => {
                const bar = await createBar(series, hover);

                expect(pixel(...outerCorner(bar))).toEqual(RED);
                expect(pixel(...innerCorner(bar))).toEqual(WHITE);
                // Down the side of the bar, where the edges are straight, the glow is the band between them.
                const middle = bar.y + bar.height / 2;
                expect(pixel(bar.x - gap - spread / 2, middle)).toEqual(RED);
                expect(pixel(bar.x - gap + 3, middle)).toEqual(WHITE);
                expect(pixel(bar.x - gap - spread - 3, middle)).toEqual(WHITE);
            }
        );

        it.each(PLACEMENTS)(
            'keeps a curved corner for a bar with a corner radius, from %s',
            async (_name, series, hover) => {
                const bar = await createBar({ ...series, cornerRadius: 12 }, hover);

                // The curve of the item carries to the inner edge, so the corner of the square that the gap would cut is in the glow.
                expect(pixel(...innerCorner(bar))).toEqual(RED);
                const middle = bar.y + bar.height / 2;
                expect(pixel(bar.x - gap + 3, middle)).toEqual(WHITE);
                expect(pixel(bar.x - gap - spread / 2, middle)).toEqual(RED);
            }
        );

        it('keeps a curved inner edge round a circle marker', async () => {
            await create({
                data: [{ x: 2, y: 4 }],
                axes: CENTRED,
                series: [
                    { type: 'scatter', xKey: 'x', yKey: 'y', shape: 'circle', size: 60, fillOpacity: 1, glow: GLOW },
                ],
            });
            const { x, y, width } = boundsOf(shapesOf(getSeriesAt(chart).contentGroup, Marker)[0]);
            const [centreX, centreY, radius] = [x + width / 2, y + width / 2, width / 2];
            const at = (distance: number, angle: number) =>
                pixel(centreX + distance * Math.cos(angle), centreY + distance * Math.sin(angle));

            // The same distance from the item, whichever way it is measured: the glow is a ring.
            for (const angle of [0, Math.PI / 4, Math.PI / 2, (5 * Math.PI) / 4]) {
                expect(at(radius + gap - 3, angle), `${angle} inside the gap`).toEqual(WHITE);
                expect(at(radius + gap + spread / 2, angle), `${angle} in the glow`).toEqual(RED);
                expect(at(radius + gap + spread + 3, angle), `${angle} beyond the glow`).toEqual(WHITE);
            }
        });

        describe('at the point of a star, which is sharper than 60 degrees', () => {
            const createStar = (glow?: AgGlowOptions) =>
                create({
                    data: [{ x: 2, y: 4 }],
                    axes: CENTRED,
                    series: [
                        {
                            type: 'scatter',
                            xKey: 'x',
                            yKey: 'y',
                            shape: 'star',
                            size: 60,
                            fill: '#0000ff',
                            fillOpacity: 1,
                            strokeWidth: 0,
                            glow,
                        },
                    ],
                });

            /** The canvas y of the point of the star, found by scanning down its axis from above it, and the x of the axis. */
            const pointOfStar = () => {
                const { x, y, width } = boundsOf(shapesOf(getSeriesAt(chart).contentGroup, Marker)[0]);
                const axisX = Math.round(x + width / 2);
                for (let probeY = Math.floor(y) - 4; probeY < y + width; probeY++) {
                    if (pixel(axisX, probeY).toString() !== WHITE.toString()) return { axisX, tipY: probeY };
                }
                throw new Error('The star is not drawn');
            };

            it('cuts the glow no further past the point than the gap, and leaves the glow unbroken across it', async () => {
                await createStar();
                const { axisX, tipY } = pointOfStar();
                await createStar(GLOW);
                expect(pixel(axisX, tipY + 3)).toEqual(BLUE);

                // Each column over the point, and a little to either side of it: going up from the star, the cut ends, and the
                // glow begins, no further than a gap from the point, and there is glow right up to the end of the spread.
                for (const dx of [-12, -8, -4, 0, 4, 8, 12]) {
                    let y = tipY;
                    while (pixel(axisX + dx, y).toString() !== RED.toString() && y > tipY - gap - spread) y--;
                    expect(
                        tipY - y,
                        `the glow of the column ${dx} from the axis begins within the gap`
                    ).toBeLessThanOrEqual(gap);
                    expect(
                        pixel(axisX + dx, y - 1),
                        `the glow of the column ${dx} from the axis is wider than a pixel`
                    ).toEqual(RED);
                }

                // Beyond the reach of the glow there is none.
                expect(pixel(axisX, tipY - gap - spread - 4)).toEqual(WHITE);
            });
        });
    });

    describe('a glow above the items that do not glow', () => {
        const SPREAD = 20;
        const HEADROOM = {
            axes: { y: { type: 'number', min: 0, max: 8 } },
            data: [{ category: 'A', value: 6, other: 3 }],
        };

        // Two grouped bars, 10px apart: the glow of one reaches 20px, over the bar beside it.
        const bars = (glowing: 0 | 1, placement: (glow: AgGlowOptions) => object) =>
            ['value', 'other'].map((yKey, index) => ({
                type: 'bar',
                xKey: 'category',
                yKey,
                fill: index === 0 ? '#0000ff' : '#008000',
                fillOpacity: 1,
                ...(index === glowing ? placement(hard({ spread: SPREAD })) : {}),
            }));

        const PLACEMENTS: [string, (glow: AgGlowOptions) => object][] = [
            ['the series glow', (glow) => ({ glow })],
            ['the glow an itemStyler returns', (glow) => ({ itemStyler: () => ({ glow }) })],
        ];

        describe.each(PLACEMENTS)('from %s', (_name, placement) => {
            it.each([
                [0, 'the bar drawn first, over the bar drawn after it'],
                [1, 'the bar drawn last, over the bar drawn before it'],
            ] as const)('covers the bar beside it: %s', async (glowing, _description) => {
                await create({ ...HEADROOM, series: bars(glowing, placement) });
                const [first, second] = [barBounds(0), barBounds(1)];
                const glows = glowing === 0 ? first : second;
                const bottom = Math.min(first.y + first.height, second.y + second.height) - 6;
                // 3px into the bar beside the glowing one, from the edge they share.
                const near = glowing === 0 ? second.x + 3 : first.x + first.width - 3;
                const far = glowing === 0 ? second.x + SPREAD + 12 : first.x + first.width - SPREAD - 12;

                expect(pixel(near, bottom)).toEqual(RED);
                // The bar beside it is its own colour again where the glow stops, and the glowing bar is not covered.
                expect(pixel(far, bottom)).toEqual(glowing === 0 ? GREEN : BLUE);
                expect(pixel(glows.x + glows.width / 2, bottom)).toEqual(glowing === 0 ? BLUE : GREEN);
                expect(pixel(glowing === 0 ? glows.x + glows.width - 3 : glows.x + 3, bottom)).toEqual(
                    glowing === 0 ? BLUE : GREEN
                );
            });
        });

        describe.each(PLACEMENTS)('with a hovered bar that is not brought to front, from %s', (_name, placement) => {
            it.each([0, 1] as const)(
                'is not covered by the glow of the bar beside it, with bar %s hovered',
                async (hovered) => {
                    const both = (index: number) => ({
                        ...placement(hard({ spread: SPREAD })),
                        highlight: { bringToFront: false },
                        fill: index === 0 ? '#0000ff' : '#008000',
                    });
                    await create({
                        ...HEADROOM,
                        series: ['value', 'other'].map((yKey, index) => ({
                            type: 'bar',
                            xKey: 'category',
                            yKey,
                            fillOpacity: 1,
                            ...both(index),
                        })),
                    });
                    const [first, second] = [barBounds(0), barBounds(1)];
                    const bottom = Math.min(first.y + first.height, second.y + second.height) - 6;
                    // 3px into the hovered bar, from the edge it shares with the bar beside it, whose glow reaches it.
                    const x = hovered === 0 ? first.x + first.width - 3 : second.x + 3;
                    const colour = hovered === 0 ? BLUE : GREEN;
                    expect(pixel(x, bottom)).toEqual(colour);

                    await hoverDatum(chart, hovered);
                    expect(pixel(x, bottom)).toEqual(colour);
                }
            );
        });

        describe.each(PLACEMENTS)(
            'with a hovered marker that a highlight makes larger, not brought to front, from %s',
            (_name, placement) => {
                const [REST, ENLARGED] = [20, 50];
                const create2 = (gap: number) =>
                    create({
                        axes: CENTRED,
                        data: [
                            { x: 1.5, y: 4 },
                            { x: 1.5 + gap, y: 4 },
                        ],
                        series: [
                            {
                                type: 'scatter',
                                xKey: 'x',
                                yKey: 'y',
                                shape: 'circle',
                                size: REST,
                                fill: '#008000',
                                fillOpacity: 1,
                                strokeWidth: 0,
                                highlight: {
                                    bringToFront: false,
                                    highlightedItem: {
                                        fill: '#0000ff',
                                        fillOpacity: 1,
                                        size: ENLARGED,
                                        strokeWidth: 0,
                                    },
                                },
                                ...placement(hard({ spread: SPREAD })),
                            },
                        ],
                    });

                it('is not covered by the glow of the marker beside it, over the whole of the larger marker', async () => {
                    // The two markers are laid 36px apart, however wide the chart is: each reaches 10px, so the glow of the one
                    // beside reaches 20px further, over the ring of the hovered marker between 10 and 25px from its centre.
                    await create2(1);
                    const unit = markerCentre(1).x - markerCentre(0).x;
                    await create2(36 / unit);
                    const [centre, beside] = [markerCentre(0), markerCentre(1)];
                    const distance = beside.x - centre.x;
                    // 18px from the hovered marker's centre, towards the marker beside it: outside the marker at rest, and 18px
                    // inside the glow of the marker beside it.
                    const ring = [centre.x + 18, centre.y] as const;
                    expect(distance).toBeCloseTo(36, 0);
                    expect(pixel(...ring)).toEqual(RED);

                    await hoverDatum(chart, 0);
                    expect(pixel(...ring)).toEqual(BLUE);
                    // The glow of the marker beside it still covers what is beyond the larger marker, which does not glow there.
                    expect(pixel(centre.x + ENLARGED / 2 + 3, centre.y)).toEqual(RED);
                });
            }
        );

        it('does not cut the invisible stroke of a glowing item out of its glow', async () => {
            const createBar = (strokeOpacity: number, placement: (glow: AgGlowOptions) => object) =>
                create({
                    ...HEADROOM,
                    series: [
                        {
                            type: 'bar',
                            xKey: 'category',
                            yKey: 'value',
                            fill: '#0000ff',
                            fillOpacity: 1,
                            stroke: '#000000',
                            strokeWidth: 20,
                            strokeOpacity,
                            ...placement(hard({ spread: SPREAD })),
                        },
                    ],
                });

            for (const [name, placement] of PLACEMENTS) {
                // The bounds of the bar take in its stroke, which is centred on the edge of the bar, so 4px in from them is within
                // the 10px of stroke outside the bar, where the glow, which reaches 20px from the bar, is to be seen if the stroke is not.
                const probe = () => {
                    const { x, y, height } = barBounds();
                    return pixel(x + 4, y + height / 2);
                };
                await createBar(1, placement);
                expect(probe(), `${name}, a visible stroke is painted over the glow`).toEqual([0, 0, 0, 255]);

                await createBar(0, placement);
                expect(probe(), `${name}, an invisible stroke is not cut out of it`).toEqual(RED);
            }
        });

        it('covers the bar beside it with the glow of the highlighted series', async () => {
            await create({
                ...HEADROOM,
                legend: { enabled: true, position: 'bottom' },
                series: bars(0, () => ({ highlight: { highlightedSeries: { glow: hard({ spread: SPREAD }) } } })),
            });
            await hoverLegendItem(chart, 0);
            await waitForChartStability(chart);
            const second = barBounds(1);
            const bottom = second.y + second.height - 6;

            expect(pixel(second.x + 3, bottom)).toEqual(RED);
        });

        it('covers the sectors beside a donut sector that glows, and not the sector itself', async () => {
            const data = [
                { category: 'A', value: 4 },
                { category: 'B', value: 5 },
                { category: 'C', value: 3 },
            ];
            const series = (glow?: AgGlowOptions) => ({
                type: 'donut',
                angleKey: 'value',
                fills: ['#0000ff', '#008000', '#ffa500'],
                strokeWidth: 0,
                fillOpacity: 1,
                itemStyler: ({ datum }: { datum: { category: string } }) =>
                    datum.category === 'B' && glow ? { glow } : {},
            });

            await create({ data, series: [series()] });
            const [a, b, c] = shapesOf(getSeriesAt(chart).contentGroup, Sector);
            const centre = Transformable.toCanvasPoint(b, b.centerX, b.centerY);
            const middle = (b.innerRadius + b.outerRadius) / 2;
            const at = (angle: number) =>
                pixel(centre.canvasX + middle * Math.cos(angle), centre.canvasY + middle * Math.sin(angle));
            const nearBy = 4 / middle;
            const probes = {
                before: at(b.startAngle - nearBy),
                inside: at((b.startAngle + b.endAngle) / 2),
                after: at(b.endAngle + nearBy),
            };
            // The sectors beside it, from the edge it shares with each.
            expect(a.endAngle).toBeCloseTo(b.startAngle);
            expect(c.startAngle).toBeCloseTo(b.endAngle);
            expect(probes.before).not.toEqual(RED);

            await create({ data, series: [series(hard({ spread: 14 }))] });
            const [, glowing] = shapesOf(getSeriesAt(chart).contentGroup, Sector);
            expect(glowing.startAngle).toBeCloseTo(b.startAngle);
            expect(at(b.startAngle - nearBy)).toEqual(RED);
            expect(at(b.endAngle + nearBy)).toEqual(RED);
            expect(at((b.startAngle + b.endAngle) / 2)).toEqual(probes.inside);
        });
    });

    describe('glows that meet', () => {
        const SPREAD = 14;
        const HALF = { ...hard({ spread: SPREAD }), fillOpacity: 0.5 };

        it('merges the glows of adjacent series into one, and keeps the items above it', async () => {
            await create({
                axes: { y: { type: 'number', min: 0, max: 8 } },
                data: [{ category: 'A', value: 6, other: 3 }],
                series: ['value', 'other'].map((yKey, index) => ({
                    type: 'bar',
                    xKey: 'category',
                    yKey,
                    fill: index === 0 ? '#0000ff' : '#008000',
                    fillOpacity: 1,
                    glow: HALF,
                })),
            });
            const [tall, short] = [barBounds(0), barBounds(1)];
            const beside = tall.x + tall.width + 5; // in the glow of the tall bar, and over the top of the short one's glow
            const above = short.y - 5; // in the glow of the short bar
            const clear = short.y - SPREAD - 20; // above the glow of the short bar

            const onlyTall = pixel(beside, clear);
            const onlyShort = pixel(short.x + short.width - 12, above);
            const both = pixel(beside, above);

            expect(onlyTall[3]).toBe(255);
            expect(onlyTall).not.toEqual(WHITE);
            expect(onlyShort).toEqual(onlyTall);
            // Where both reach, the glow is no stronger than where one does: the two are one glow, not two laid over each other.
            expect(both).toEqual(onlyTall);
            // The bars are above the glow.
            expect(pixel(tall.x + tall.width - 3, short.y + 20)).toEqual(BLUE);
            expect(pixel(short.x + 3, short.y + 20)).toEqual(GREEN);
        });

        it('draws the shadow of a series beneath the items and the glow of another', async () => {
            const SHADOW = { enabled: true, fill: '#000000', fillOpacity: 1, blur: 0, xOffset: 12, yOffset: 0 };
            const createPair = (shadow: object, glow?: AgGlowOptions) =>
                create({
                    axes: { y: { type: 'number', min: 0, max: 8 } },
                    data: [{ category: 'A', value: 3, other: 3 }],
                    series: [
                        { type: 'bar', xKey: 'category', yKey: 'value', fill: '#0000ff', fillOpacity: 1, shadow },
                        { type: 'bar', xKey: 'category', yKey: 'other', fill: '#008000', fillOpacity: 1, glow },
                    ],
                });

            // The shadow of the left bar falls 12px to the right: across the 10px between the two bars, and under the right bar.
            await createPair(SHADOW);
            const [left, right] = [barBounds(0), barBounds(1)];
            const [between, underRight, leftBody] = [
                [left.x + left.width + 2, left.y + 20],
                [right.x + 4, right.y + 20],
                [left.x + left.width - 4, left.y + 20],
            ] as const;
            expect(pixel(...between)).toEqual([0, 0, 0, 255]);
            expect(pixel(...underRight)).toEqual(GREEN);
            expect(pixel(...leftBody)).toEqual(BLUE);

            // The glow of the right bar is drawn over the shadow, and over the left bar, which does not glow.
            await createPair(SHADOW, hard({ spread: 16 }));
            expect(pixel(...between)).toEqual(RED);
            expect(pixel(...leftBody)).toEqual(RED);
            expect(pixel(...underRight)).toEqual(GREEN);
        });
    });

    describe('a chart that casts no glow', () => {
        const SERIES = {
            type: 'bar',
            xKey: 'category',
            yKey: 'value',
            shadow: SERIES_SHADOW,
        };
        const DATA = [
            { category: 'A', value: 4 },
            { category: 'B', value: 5 },
        ];
        const GLOWING = { ...SERIES, glow: hard({ spread: 12 }) };

        const render = async (series: object) => {
            await create({ data: DATA, series: [series] });
            return canvasImage(chart);
        };

        it.each([
            ['a disabled series glow', { glow: hard({ enabled: false }) }],
            ['an itemStyler that returns a disabled glow', { itemStyler: () => ({ glow: hard({ enabled: false }) }) }],
            ['an itemStyler that returns no glow', { itemStyler: () => ({}) }],
            [
                'disabled glows in every highlight state',
                {
                    highlight: Object.fromEntries(
                        ['highlightedItem', 'unhighlightedItem', 'highlightedSeries', 'unhighlightedSeries'].map(
                            (bucket) => [bucket, { glow: hard({ enabled: false }) }]
                        )
                    ),
                },
            ],
        ])('renders with %s as with no glow, beside a shadow', async (_name, glow) => {
            const unset = await render(SERIES);
            expectSamePixels(await render({ ...SERIES, ...glow }), unset);

            // While an item is hovered too.
            await hoverDatum(chart);
            const hovered = canvasImage(chart);
            await render(SERIES);
            await hoverDatum(chart);
            expectSamePixels(hovered, canvasImage(chart));
        });

        it('renders as a chart that never had a glow once the glow is removed', async () => {
            // Both are rendered by an update, as that draws the chart a little differently from its creation.
            const updated = async (before: object) => {
                chart?.destroy();
                const instance = await createChart({ ...ROOM, data: DATA, series: [before] } as any);
                chart = deproxy(instance);
                await waitForChartStability(chart);
                await instance.update({ ...ROOM, data: DATA, series: [SERIES] } as any);
                await waitForChartStability(chart);
                return canvasImage(chart);
            };

            const never = await updated(SERIES);
            expect((await render(GLOWING)).data).not.toEqual((await render(SERIES)).data);
            expectSamePixels(await updated(GLOWING), never);
        });
    });
});
