import { describe, expect, it } from 'vitest';

import {
    HIGHLIGHT_GLOW,
    RENDER_OPTIONS,
    chartPixelAt,
    describeGlowSeries,
    getSeriesAt,
    glowSeries,
    hoverNode,
    shapesOf,
    useGlowCharts,
} from 'ag-charts-community-test';
import { Sector, Transformable } from 'ag-charts-core';

import { HIERARCHY_GLOW_SERIES } from '../test/glowSeriesCases';
import { getHierarchyRootNode } from '../test/seriesAccessors';
import { createEnterpriseChart } from '../test/utils';

const GLOW = { enabled: true, fill: '#0000ff', fillOpacity: 1, blur: 0, spread: 14 };
const BLUE = [0, 0, 255, 255];
const { padding } = RENDER_OPTIONS;

const treemap = HIERARCHY_GLOW_SERIES.find(({ name }) => name === 'treemap tile')!;
const sunburst = HIERARCHY_GLOW_SERIES.find(({ name }) => name === 'sunburst')!;

/** An itemStyler that gives the nodes named a glow, and the rest nothing. */
const glowing = (...names: string[]) => ({
    itemStyler: ({ datum }: { datum?: { name?: string } }) => (names.includes(datum?.name ?? '') ? { glow: GLOW } : {}),
});

describe('shadow and glow render (hierarchy series)', () => {
    const charts = useGlowCharts(createEnterpriseChart);
    const { create, chart, snapshot } = charts;

    describeGlowSeries(HIERARCHY_GLOW_SERIES, charts);

    /** The point just inside the tile `name`, 3px below the edge that it shares with the tile above, in canvas coordinates. */
    const insideTopOf = (name: string) => {
        const tile = [...getHierarchyRootNode(chart())!].find((node) => node.datum?.name === name)!;
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

        /** Hovers `hovered`, with `neighbour` glowing or not, and returns the pixel that `pixelOf` gives in its series. */
        const hoveredPixel = async (
            testCase: typeof treemap,
            { hovered, neighbour, neighbourGlows, styled, highlight }: Record<string, any>,
            pixelOf: () => readonly [number, number]
        ) => {
            const names = [...(styled ? [hovered] : []), ...(neighbourGlows ? [neighbour] : [])];
            await create([glowSeries(testCase, glowing(...names), highlight)], testCase.data, RENDER_OPTIONS);
            const node = [...getHierarchyRootNode(chart())!].find((candidate) => candidate.datum?.name === hovered)!;
            await hoverNode(chart(), node);
            return chartPixelAt(chart(), ...pixelOf());
        };

        describe.each(WAYS)('through $way', ({ styled, highlight }) => {
            it('is not covered by the glow of the tile above it in a treemap', async () => {
                const options = { hovered: 'A2', neighbour: 'A1', styled, highlight };

                const alone = await hoveredPixel(treemap, { ...options, neighbourGlows: false }, () =>
                    insideTopOf('A2')
                );

                expect(
                    await hoveredPixel(treemap, { ...options, neighbourGlows: true }, () => insideTopOf('A2'))
                ).toEqual(alone);
            });

            it('is not covered by the glow of its child in a sunburst', async () => {
                const options = { hovered: 'A', neighbour: 'A1', styled, highlight };

                const alone = await hoveredPixel(sunburst, { ...options, neighbourGlows: false }, insideRing);

                expect(await hoveredPixel(sunburst, { ...options, neighbourGlows: true }, insideRing)).toEqual(alone);
            });
        });

        // Through its itemStyler, the hovered node glows at rest too, and so is not covered when it is not hovered.
        describe('through the highlightedItem state, once the hover has moved to another node', () => {
            const highlight = WAYS[1].highlight;

            /** Hovers `hovered`, then `moved`, and returns the pixel that `pixelOf` gives, with `neighbour` glowing or not. */
            const movedPixel = async (
                testCase: typeof treemap,
                { hovered, moved, neighbour, neighbourGlows }: Record<string, any>,
                pixelOf: () => readonly [number, number]
            ) => {
                await create(
                    [glowSeries(testCase, glowing(...(neighbourGlows ? [neighbour] : [])), highlight)],
                    testCase.data,
                    RENDER_OPTIONS
                );
                const nodes = [...getHierarchyRootNode(chart())!];
                await hoverNode(
                    chart(),
                    nodes.find((candidate) => candidate.datum?.name === hovered)
                );
                await hoverNode(
                    chart(),
                    nodes.find((candidate) => candidate.datum?.name === moved)
                );
                return chartPixelAt(chart(), ...pixelOf());
            };

            it.each([
                [
                    'a tile of a treemap',
                    treemap,
                    { hovered: 'A2', moved: 'B1', neighbour: 'A1' },
                    () => insideTopOf('A2'),
                ],
                ['a sector of a sunburst', sunburst, { hovered: 'A', moved: 'B', neighbour: 'A1' }, insideRing],
            ])('covers %s that it left with the glow beside it again', async (_name, testCase, options, pixelOf) => {
                const alone = await movedPixel(testCase, { ...options, neighbourGlows: false }, pixelOf);

                expect(await movedPixel(testCase, { ...options, neighbourGlows: true }, pixelOf)).not.toEqual(alone);
            });
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
            const tile = [...getHierarchyRootNode(chart())!].find((node) => node.datum?.name === 'A1')!;
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
            const tile = [...getHierarchyRootNode(chart())!].find((node) => node.datum?.name === 'A1')!;
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
