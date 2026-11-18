import { describe, expect, it } from 'vitest';

import {
    HIGHLIGHT_GLOW,
    RENDER_OPTIONS,
    SERIES_GLOW,
    SERIES_SHADOW,
    canvasImage,
    chartPixelAt,
    describeGlowSeries,
    differingBytes,
    expectSamePixels,
    getSeriesAt,
    glowSeries,
    hoverNode,
    shapesOf,
    useGlowCharts,
} from 'ag-charts-community-test';
import { Sector, Transformable } from 'ag-charts-core';

import { HIERARCHY_GLOW_SERIES, nodeNamed } from '../test/glowSeriesCases';
import { createEnterpriseChart } from '../test/utils';

const GLOW = { enabled: true, fill: '#0000ff', fillOpacity: 1, blur: 0, spread: 14 };
const BLUE = [0, 0, 255, 255];
const { padding } = RENDER_OPTIONS;

const treemap = HIERARCHY_GLOW_SERIES.find(({ name }) => name === 'treemap tile')!;
const sunburst = HIERARCHY_GLOW_SERIES.find(({ name }) => name === 'sunburst')!;
const treemapGroup = HIERARCHY_GLOW_SERIES.find(({ name }) => name === 'treemap group')!;

/** An itemStyler that gives the nodes named a glow, and the rest nothing. */
const glowing = (...names: string[]) => ({
    itemStyler: ({ datum }: { datum?: { name?: string } }) => (names.includes(datum?.name ?? '') ? { glow: GLOW } : {}),
});

describe('shadow and glow render (hierarchy series)', () => {
    const charts = useGlowCharts(createEnterpriseChart);
    const { create, chart, snapshot, render } = charts;

    describeGlowSeries(HIERARCHY_GLOW_SERIES, charts);

    /** The point just inside the tile `name`, 3px below the edge that it shares with the tile above, in canvas coordinates. */
    const insideTopOf = (name: string) => {
        const tile = nodeNamed(name)(chart());
        const { x, y, width } = tile.bbox!;
        return [x + padding.left + width / 2, y + padding.top + 3] as const;
    };

    /** The point in the ring of the parent of the sunburst sector A1, 4px inside the sector of A1, at the middle of it. */
    const insideRing = () => {
        const sectors = shapesOf(getSeriesAt(chart()).contentGroup, Sector);
        const innerRing = Math.min(...sectors.map(({ innerRadius }) => innerRadius));
        const leaves = sectors.filter(({ innerRadius }) => innerRadius > innerRing);
        const a1 = leaves.find((sector) => sector.startAngle === Math.min(...leaves.map((leaf) => leaf.startAngle)))!;
        const { canvasX, canvasY } = Transformable.toCanvasPoint(a1, a1.centerX, a1.centerY);
        const angle = (a1.startAngle + a1.endAngle) / 2;
        const radius = a1.innerRadius - 4;
        return [canvasX + radius * Math.cos(angle), canvasY + radius * Math.sin(angle)] as const;
    };

    /** The pixel 3px inside the group `name`, on the edge that it shares with the group beside it: the left of B, the right of A. */
    const insideEdgeOf = (name: string) => {
        const { x, y, width, height } = nodeNamed(name)(chart()).bbox!;
        const edge = name === 'B' ? x + 3 : x + width - 3;
        return [edge + padding.left, y + padding.top + height / 2] as const;
    };

    /** The pixel 3px inside the sector of A, on the radius that it shares with the sector of B. */
    const insideSectorEdge = () => {
        const sectors = shapesOf(getSeriesAt(chart()).contentGroup, Sector);
        const innerRing = Math.min(...sectors.map(({ innerRadius }) => innerRadius));
        const ring = sectors.filter(({ innerRadius }) => innerRadius === innerRing);
        const a = ring.find((sector) => sector.startAngle === Math.min(...ring.map((other) => other.startAngle)))!;
        const { canvasX, canvasY } = Transformable.toCanvasPoint(a, a.centerX, a.centerY);
        const radius = (a.innerRadius + a.outerRadius) / 2;
        const angle = a.endAngle - 3 / radius;
        return [canvasX + radius * Math.cos(angle), canvasY + radius * Math.sin(angle)] as const;
    };

    /** The pixel that `pixelOf` gives with `hovered` hovered, the series `placement` set and the glow of the highlighted item state. */
    const pixelWhileHovering = async (
        testCase: typeof treemap,
        hovered: string,
        pixelOf: () => readonly [number, number],
        placement: object,
        glow: object
    ) => {
        await create([glowSeries(testCase, placement, { highlightedItem: { glow } })], testCase.data, RENDER_OPTIONS);
        await hoverNode(chart(), nodeNamed(hovered)(chart()));
        return chartPixelAt(chart(), ...pixelOf());
    };

    // The glow of `highlightedItem` is the hovered-item snapshot of the suite: one snapshot for each of the other states.
    describe.each(HIERARCHY_GLOW_SERIES)('$name', (testCase) => {
        const otherSteps = testCase.highlightSteps!.filter(({ bucket }) => bucket !== 'highlightedItem');

        it.each(otherSteps)('renders the glow of $bucket', async ({ bucket }) => {
            await create([glowSeries(testCase, {}, { [bucket]: { glow: HIGHLIGHT_GLOW } })], testCase.data);
            await hoverNode(chart(), testCase.hoverDatum!(chart()));
            await snapshot();
        });

        // The bucket without a state is `unhighlightedItem`: it is cast on the nodes that are given `highlighted-branch`.
        it.skipIf(testCase.highlightSteps!.every(({ state }) => state !== undefined))(
            'never hands an itemStyler unhighlighted-item while a leaf is hovered',
            async () => {
                const seen = new Set<string | undefined>();
                const itemStyler = ({ highlightState }: { highlightState?: string }) => {
                    seen.add(highlightState);
                    return {};
                };
                await create([glowSeries(testCase, { itemStyler })], testCase.data);
                seen.clear();
                await hoverNode(chart(), testCase.hoverDatum!(chart()));
                expect(seen).toContain('highlighted-item');
                expect(seen).toContain('unhighlighted-branch');
                expect(seen).not.toContain('unhighlighted-item');
            }
        );
    });

    // The highlight bucket and the series both set a field of the glow: the node casts both, as a bucket that sets every field does.
    describe.each(HIERARCHY_GLOW_SERIES)(
        'the glow of the highlight states of $name, over its series glow',
        (testCase) => {
            const GREEN = '#00aa00';
            const hovered = (glow: object, bucketGlow: object, bucket: string) =>
                render(testCase, { glow }, { highlight: { [bucket]: { glow: bucketGlow } }, hover: true });

            it.each(testCase.highlightSteps!)(
                'casts the field of $bucket and the other fields of the series glow',
                async ({ bucket }) => {
                    const cascaded = await hovered(SERIES_GLOW, { fill: GREEN }, bucket);

                    expectSamePixels(cascaded, await hovered(SERIES_GLOW, { ...SERIES_GLOW, fill: GREEN }, bucket));
                    // The glow of the bucket shows, and its fill is its own.
                    expect(
                        differingBytes(cascaded, await hovered(SERIES_GLOW, { fill: GREEN, enabled: false }, bucket))
                    ).toBeGreaterThan(0);
                    expect(
                        differingBytes(cascaded, await hovered(SERIES_GLOW, { fill: '#0000aa' }, bucket))
                    ).toBeGreaterThan(0);
                }
            );
        }
    );

    describe('the series glow of a hovered tile, group or sector', () => {
        // The series glow is the one that the hovered node and the nodes beside it all cast: the highlight glow is its own.
        const SERIES = { shadow: SERIES_SHADOW, glow: SERIES_GLOW };

        it.each(HIERARCHY_GLOW_SERIES)('renders the series glow with the $name hovered', async (testCase) => {
            await create([glowSeries(testCase, SERIES, { highlightedItem: testCase.hoveredItem })], testCase.data);
            await hoverNode(chart(), testCase.hoverDatum!(chart()));
            await snapshot();
        });

        // With the series glow set every node glows, so the glow of the sibling reaches the hovered one: it must stay beneath its fill.
        describe.each([
            ['a tile of a treemap', treemap, 'A2', () => insideTopOf('A2')],
            ['a group of a treemap', treemapGroup, 'B', () => insideEdgeOf('B')],
            ['a sector of a sunburst', sunburst, 'A', insideSectorEdge],
        ])('%s that is hovered', (_name, testCase, hovered, pixelOf) => {
            const RED = { ...GLOW, fill: '#ff0000' };
            const hoveredPixel = (placement: object, glow: object) =>
                pixelWhileHovering(testCase, hovered, pixelOf, placement, glow);

            it('is not covered by the series glow of the node beside it', async () => {
                expect(await hoveredPixel({ glow: RED }, GLOW)).toEqual(await hoveredPixel({}, GLOW));
            });

            // The control: without a glow of its own, the hovered node is covered by that of the node beside it. The glow of the hovered
            // node is the same in both renders, so only the series glow of the node that is not hovered differs.
            it('is covered by it where the hovered node does not glow', async () => {
                const off = { ...GLOW, enabled: false };

                expect(await hoveredPixel({ glow: RED }, off)).not.toEqual(await hoveredPixel({}, off));
            });
        });
    });

    // The glow of the hovered node must not be drawn over the fill of a node at its depth that glows too: the pixel is the one
    // just inside that node, on the edge that it shares with the hovered node.
    describe.each([
        ['a tile of a treemap', treemap, 'A1', () => insideTopOf('A2')],
        ['a group of a treemap', treemapGroup, 'A', () => insideEdgeOf('B')],
        ['a sector of a sunburst', sunburst, 'B', insideSectorEdge],
    ])('the glow of %s that is hovered', (_name, testCase, hovered, pixelOf) => {
        const RED = { ...GLOW, fill: '#ff0000' };
        const off = { ...GLOW, enabled: false };
        const besidePixel = (placement: object, glow: object) =>
            pixelWhileHovering(testCase, hovered, pixelOf, placement, glow);

        it('stays beneath the fill of the node beside it that glows', async () => {
            expect(await besidePixel({ glow: RED }, GLOW)).toEqual(await besidePixel({ glow: RED }, off));
        });

        // The control: over a node that does not glow, the glow of the hovered node shows.
        it('shows over the node beside it that does not glow', async () => {
            expect(await besidePixel({}, GLOW)).not.toEqual(await besidePixel({}, off));
        });
    });

    // Where two sectors glow, each glow ends on the line in the middle of the gap between them, so no pixel of the gap has both.
    describe('the glow of a sunburst sector that is hovered, beside one that glows, with a gap between them', () => {
        const FAINT = { ...GLOW, fillOpacity: 0.4 };

        /** The pixel of the gap between the sectors of A and B that is on the side of B, in the ring of A, B and their glows. */
        const insideGapOnTheSideOfB = () => {
            const sectors = shapesOf(getSeriesAt(chart()).contentGroup, Sector);
            const innerRing = Math.min(...sectors.map(({ innerRadius }) => innerRadius));
            const ring = sectors.filter(({ innerRadius }) => innerRadius === innerRing);
            const a = ring.find((sector) => sector.startAngle === Math.min(...ring.map((other) => other.startAngle)))!;
            const { canvasX, canvasY } = Transformable.toCanvasPoint(a, a.centerX, a.centerY);
            const radius = (a.innerRadius + a.outerRadius) / 2;
            const angle = a.endAngle + 1 / radius;
            return [canvasX + radius * Math.cos(angle), canvasY + radius * Math.sin(angle)] as const;
        };

        const gapPixel = async (hover: boolean) => {
            const series = {
                ...glowSeries(sunburst, { glow: FAINT }, { highlightedItem: { glow: FAINT } }),
                sectorSpacing: 8,
            };
            await create([series], sunburst.data, RENDER_OPTIONS);
            if (hover) await hoverNode(chart(), nodeNamed('A')(chart()));
            return chartPixelAt(chart(), ...insideGapOnTheSideOfB());
        };

        // A glow of one sector over that of the other would add 0.4 of opacity to the pixel, a drop of 20 in each colour channel.
        it('does not double the glow in the gap', async () => {
            const [rest] = await gapPixel(false);

            expect(rest).toBeLessThan(255);
            expect(Math.abs((await gapPixel(true))[0] - rest)).toBeLessThan(10);
        });
    });

    describe('the glow of a tile that is not hovered', () => {
        const pixelBelow = async (name: string, ...glowingNames: string[]) => {
            await create([glowSeries(treemap, glowing(...glowingNames))], treemap.data, RENDER_OPTIONS);
            return chartPixelAt(chart(), ...insideTopOf(name));
        };

        it('covers a tile beside it that does not glow', async () => {
            const plain = await pixelBelow('A2');

            expect(await pixelBelow('A2', 'A1')).not.toEqual(plain);
        });

        it('does not cover a tile beside it that glows too', async () => {
            const plain = await pixelBelow('A2');

            expect(await pixelBelow('A2', 'A1', 'A2')).toEqual(plain);
        });
    });

    describe('the hovered tile or sector that glows, beside one that glows without being hovered', () => {
        // How the hovered node comes by its glow: through its itemStyler, as its neighbour does, or its highlight state alone.
        const WAYS = [
            { way: 'its itemStyler', styled: true, highlight: undefined },
            { way: 'the highlightedItem state', styled: false, highlight: { highlightedItem: { glow: GLOW } } },
        ];

        /**
         * Hovers each of the nodes in `hover` in turn, with the nodes in `glows` glowing through their itemStyler, and returns the
         * pixel that `pixelOf` gives in its series.
         */
        const hoveredPixel = async (
            testCase: typeof treemap,
            { hover, glows, highlight }: { hover: string[]; glows: string[]; highlight?: object },
            pixelOf: () => readonly [number, number]
        ) => {
            await create([glowSeries(testCase, glowing(...glows), highlight)], testCase.data, RENDER_OPTIONS);
            for (const name of hover) await hoverNode(chart(), nodeNamed(name)(chart()));
            return chartPixelAt(chart(), ...pixelOf());
        };

        describe.each(WAYS)('through $way', ({ styled, highlight }) => {
            it.each([
                ['the tile above it in a treemap', treemap, 'A2', 'A1', () => insideTopOf('A2')],
                ['its child in a sunburst', sunburst, 'A', 'A1', insideRing],
            ])('is not covered by the glow of %s', async (_name, testCase, hovered, neighbour, pixelOf) => {
                const hover = [hovered];
                const own = styled ? [hovered] : [];

                const alone = await hoveredPixel(testCase, { hover, glows: own, highlight }, pixelOf);

                expect(await hoveredPixel(testCase, { hover, glows: [...own, neighbour], highlight }, pixelOf)).toEqual(
                    alone
                );
            });
        });

        // The overlay cuts every glowing node out of the glow of the hovered one, whatever its depth.
        describe('inside a parent that glows', () => {
            const own = { highlightedItem: { glow: GLOW } };
            const off = { highlightedItem: { glow: { ...GLOW, enabled: false } } };
            /** The pixel 3px to the left of the tile `name`, in the fill of its group. */
            const leftOf = (name: string) => {
                const { x, y, height } = nodeNamed(name)(chart()).bbox!;
                return [x + padding.left - 3, y + padding.top + height / 2] as const;
            };

            it.each([
                ['a tile in its group in a treemap', treemap, 'A1', 'A', () => leftOf('A1')],
                ['a sector in its parent ring in a sunburst', sunburst, 'A1', 'A', insideRing],
            ])(
                'keeps the glow of %s beneath the fill of the parent',
                async (_name, testCase, hovered, parent, pixelOf) => {
                    const hover = [hovered];

                    expect(await hoveredPixel(testCase, { hover, glows: [parent], highlight: own }, pixelOf)).toEqual(
                        await hoveredPixel(testCase, { hover, glows: [parent], highlight: off }, pixelOf)
                    );
                }
            );

            // The control: with a parent that does not glow, the glow of the hovered node shows over its fill.
            it.each([
                ['a tile in its group in a treemap', treemap, 'A1', () => leftOf('A1')],
                ['a sector in its parent ring in a sunburst', sunburst, 'A1', insideRing],
            ])('shows the glow of %s over a parent that does not glow', async (_name, testCase, hovered, pixelOf) => {
                const hover = [hovered];

                expect(await hoveredPixel(testCase, { hover, glows: [], highlight: own }, pixelOf)).not.toEqual(
                    await hoveredPixel(testCase, { hover, glows: [], highlight: off }, pixelOf)
                );
            });
        });

        // Through its itemStyler, the hovered node glows at rest too, and so is not covered when it is not hovered.
        describe('through the highlightedItem state, once the hover has moved to another node', () => {
            const highlight = WAYS[1].highlight;

            it.each([
                ['a tile of a treemap', treemap, ['A2', 'B1'], () => insideTopOf('A2')],
                ['a sector of a sunburst', sunburst, ['A', 'B'], insideRing],
            ])('covers %s that it left with the glow beside it again', async (_name, testCase, hover, pixelOf) => {
                const alone = await hoveredPixel(testCase, { hover, glows: [], highlight }, pixelOf);

                expect(await hoveredPixel(testCase, { hover, glows: ['A1'], highlight }, pixelOf)).not.toEqual(alone);
            });
        });
    });

    // A series glow casts without a highlight glow of its own: its highlight is off, or the hovered node is of another part.
    describe('the series glow with no highlight glow to cast it', () => {
        /** The chart with `hover` hovered, and the series glow of `placement`, as it is drawn. */
        const hoveredImage = async (testCase: typeof treemap, placement: object, hover: string, highlight?: object) => {
            await create([glowSeries(testCase, placement, highlight)], testCase.data, RENDER_OPTIONS);
            await hoverNode(chart(), nodeNamed(hover)(chart()));
            return canvasImage(chart());
        };

        it.each([
            ['a sunburst', sunburst, 'B', { enabled: false }],
            ['the groups of a treemap', treemapGroup, 'A', { enabled: false }],
            ['the tiles of a treemap, with their highlight off,', treemap, 'A1', { enabled: false }],
            ['the tiles of a treemap, with a group hovered,', treemap, 'B', undefined],
        ])('casts the glow of %s', async (_name, testCase, hover, highlight) => {
            const withGlow = await hoveredImage(testCase, { glow: GLOW }, hover, highlight);

            expect(differingBytes(withGlow, await hoveredImage(testCase, {}, hover, highlight))).toBeGreaterThan(0);
        });
    });

    describe('the shadows of the tiles beside a tile that only glows', () => {
        // The shadow of the tile below lands on the tile above it, which glows with its own shadow off.
        const SHADOW = { enabled: true, fill: '#ff0000', fillOpacity: 1, blur: 0, xOffset: 0, yOffset: -40 };
        const glowOnly = {
            itemStyler: ({ datum }: { datum?: { name?: string } }) =>
                datum?.name === 'A1' ? { glow: GLOW, shadow: { enabled: false } } : {},
        };

        /** The pixel just inside the bottom edge of the tile A1, which the shadow of A2 reaches. */
        const insideA1 = async (shadow?: object) => {
            await create([glowSeries(treemap, { shadow, ...glowOnly })], treemap.data, RENDER_OPTIONS);
            const tile = nodeNamed('A1')(chart());
            const { x, y, width, height } = tile.bbox!;
            return chartPixelAt(chart(), x + padding.left + width / 2, y + padding.top + height - 3);
        };

        it('are cast beneath it, as they are beneath the tiles that cast a shadow', async () => {
            const plain = await insideA1();

            expect(await insideA1(SHADOW)).toEqual(plain);
        });
    });

    describe('the glow of a hierarchy outside the footprints of its items', () => {
        const everyNode = { itemStyler: () => ({ glow: GLOW }) };

        it('shows the glow of every tile round the outside of a treemap, and not on a tile', async () => {
            await create([glowSeries(treemap, {})], treemap.data, RENDER_OPTIONS);
            const tile = nodeNamed('A1')(chart());
            const { x, y, width, height } = tile.bbox!;
            // The series area is drawn at the padding, and a treemap fills it.
            const [left, top] = [padding.left, padding.top];
            const [right, bottom] = [left + 360, top + 250];
            const inTile = [Math.round(left + x + 6), Math.round(top + y + height / 2 + 20)] as const;
            const outside = [
                [left + width / 2, top - 6],
                [left - 6, top + y + height / 2],
                [right + 6, top + y + height / 2],
                [left + width / 2, bottom + 6],
            ] as const;

            const plain = chartPixelAt(chart(), ...inTile);

            await create([glowSeries(treemap, everyNode)], treemap.data, RENDER_OPTIONS);

            for (const [probeX, probeY] of outside) expect(chartPixelAt(chart(), probeX, probeY)).toEqual(BLUE);
            expect(chartPixelAt(chart(), ...inTile)).toEqual(plain);
        });

        describe('of a sunburst', () => {
            /** The pixel in the ring of the parent of A1, given the itemStyler that the sunburst is created with. */
            const parentPixel = async (itemStyler: object) => {
                await create([glowSeries(sunburst, itemStyler)], sunburst.data, RENDER_OPTIONS);
                return chartPixelAt(chart(), ...insideRing());
            };

            it('covers the ring of the parent of a sector that glows, where the parent does not', async () => {
                const plain = await parentPixel(glowing());

                expect(await parentPixel(glowing('A1'))).toEqual(BLUE);
                expect(plain).not.toEqual(BLUE);
            });

            it('does not cover the ring of a parent that glows too', async () => {
                const plain = await parentPixel(glowing());

                expect(await parentPixel(glowing('A', 'A1'))).toEqual(plain);
            });
        });
    });
});
