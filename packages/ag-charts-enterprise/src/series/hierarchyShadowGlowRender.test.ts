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
const RED = { ...GLOW, fill: '#ff0000' };
const OFF = { ...GLOW, enabled: false };
/** The highlight state of the hovered node, with its glow on and off. */
const HIGHLIGHT_ON = { highlightedItem: { glow: GLOW } };
const HIGHLIGHT_OFF = { highlightedItem: { glow: OFF } };
/** A highlight style that leaves a node opaque, which the highlight otherwise dims, so that nothing shows through its fill. */
const OPAQUE_FILL = { opacity: 1, fillOpacity: 1, strokeOpacity: 1 };
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

    /** The point at the middle of the sunburst sector A1, `offset` px from its inner radius: negative is in the ring of its parent. */
    const insideRing = (offset = -4) => {
        const sectors = shapesOf(getSeriesAt(chart()).contentGroup, Sector);
        const innerRing = Math.min(...sectors.map(({ innerRadius }) => innerRadius));
        const leaves = sectors.filter(({ innerRadius }) => innerRadius > innerRing);
        const a1 = leaves.find((sector) => sector.startAngle === Math.min(...leaves.map((leaf) => leaf.startAngle)))!;
        const { canvasX, canvasY } = Transformable.toCanvasPoint(a1, a1.centerX, a1.centerY);
        const angle = (a1.startAngle + a1.endAngle) / 2;
        const radius = a1.innerRadius + offset;
        return [canvasX + radius * Math.cos(angle), canvasY + radius * Math.sin(angle)] as const;
    };

    /** The pixel 3px to the left of the node `name`, at the middle of its height: in the fill of its group if it is a tile. */
    const leftOf = (name: string) => {
        const { x, y, height } = nodeNamed(name)(chart()).bbox!;
        return [x + padding.left - 3, y + padding.top + height / 2] as const;
    };

    /** The pixel in the tile `name`, `dx` px from its left edge, at the middle of its height. */
    const insideLeftOf = (name: string, dx: number) => {
        const { x, y, height } = nodeNamed(name)(chart()).bbox!;
        return [x + padding.left + dx, y + padding.top + height / 2] as const;
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
        glow: object,
        highlight: Record<string, object> = {}
    ) => {
        await create(
            [
                glowSeries(testCase, placement, {
                    ...highlight,
                    highlightedItem: { glow, ...highlight.highlightedItem },
                }),
            ],
            testCase.data,
            RENDER_OPTIONS
        );
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
    });

    // `own` is the node that is hovered or beside the hovered one, and `beside` the other. The pixel is just inside `own`, on the edge
    // that it shares with `beside`, so that only the glow of `beside` or of `own` itself reaches it.
    describe.each([
        ['a tile of a treemap', treemap, 'A2', 'A1', () => insideTopOf('A2')],
        ['a group of a treemap', treemapGroup, 'B', 'A', () => insideEdgeOf('B')],
        ['a sector of a sunburst', sunburst, 'A', 'B', insideSectorEdge],
    ])('the glow of %s and of the node beside it', (_name, testCase, own, beside, pixelOf) => {
        const pixelHovering = (hovered: string, placement: object, glow: object) =>
            pixelWhileHovering(testCase, hovered, pixelOf, placement, glow);

        // With the series glow set every node glows, so the glow of the sibling reaches the hovered one: it must stay beneath its fill.
        it('does not cover the hovered node with the series glow of the node beside it', async () => {
            expect(await pixelHovering(own, { glow: RED }, GLOW)).toEqual(await pixelHovering(own, {}, GLOW));
        });

        // The control: without a glow of its own, the hovered node is covered by that of the node beside it. The glow of the hovered
        // node is the same in both renders, so only the series glow of the node that is not hovered differs.
        it('covers the hovered node with it where the hovered node does not glow', async () => {
            expect(await pixelHovering(own, { glow: RED }, OFF)).not.toEqual(await pixelHovering(own, {}, OFF));
        });

        // The glow of the hovered node is drawn over the fill of every other node, those that glow too included.
        it('shows the glow of the hovered node over the fill of the node beside it that glows', async () => {
            expect(await pixelHovering(beside, { glow: RED }, GLOW)).not.toEqual(
                await pixelHovering(beside, { glow: RED }, OFF)
            );
        });

        // The control: the glow of the node beside it does not change that pixel, which only the glow of the hovered node reaches.
        it('has no other glow than that of the hovered node at that pixel', async () => {
            expect(await pixelHovering(beside, { glow: RED }, OFF)).toEqual(await pixelHovering(beside, {}, OFF));
        });
    });

    // The glow of a hovered group is drawn over the tiles of the group beside it, as the glow of a hovered tile is over its neighbours.
    describe('the glow of a hovered treemap group', () => {
        // The group beside it dims with the hover: its tiles are made opaque, so that a glow beneath them could not show through.
        const OPAQUE = { unhighlightedItem: OPAQUE_FILL };
        const pixelOfB1 = (glow: object, dx: number) =>
            pixelWhileHovering(treemapGroup, 'A', () => insideLeftOf('B1', dx), {}, glow, OPAQUE);

        it('is drawn over the fill of a tile of the group beside it', async () => {
            expect(await pixelOfB1(GLOW, 3)).not.toEqual(await pixelOfB1(OFF, 3));
        });

        // The control, deeper in the tile than the glow reaches: the two renders are the same there.
        it('does not reach the middle of that tile', async () => {
            expect(await pixelOfB1(GLOW, 60)).toEqual(await pixelOfB1(OFF, 60));
        });

        // The tiles of the hovered group draw over its fill: the fill of the group is seen only in the padding between them.
        describe('with a fill', () => {
            const pixelWithFill = (fill: string, pixelOf: () => readonly [number, number]) =>
                pixelWhileHovering(treemapGroup, 'A', pixelOf, {}, OFF, { highlightedItem: { fill } });
            /** The pixel 8px inside the top left corner of the tile A1, clear of its label. */
            const insideCornerOfA1 = () => {
                const { x, y } = nodeNamed('A1')(chart()).bbox!;
                return [x + padding.left + 8, y + padding.top + 8] as const;
            };

            it('keeps the fill of the group beneath its tiles', async () => {
                expect(await pixelWithFill('#ff0000', insideCornerOfA1)).toEqual(
                    await pixelWithFill('#00ff00', insideCornerOfA1)
                );
            });

            // The control: the fill of the group shows in its padding, to the left of the tile.
            it('shows the fill of the group between its tiles and its edge', async () => {
                expect(await pixelWithFill('#ff0000', () => leftOf('A1'))).not.toEqual(
                    await pixelWithFill('#00ff00', () => leftOf('A1'))
                );
            });
        });
    });

    /** The pixel in the sector of A2, 3px from the radius that it shares with A1, and 3px beyond its inner radius. */
    const insideSectorBesideA1 = () => {
        const sectors = shapesOf(getSeriesAt(chart()).contentGroup, Sector);
        const innerRing = Math.min(...sectors.map(({ innerRadius }) => innerRadius));
        const leaves = sectors.filter(({ innerRadius }) => innerRadius > innerRing);
        const a1 = leaves.find((sector) => sector.startAngle === Math.min(...leaves.map((leaf) => leaf.startAngle)))!;
        const a2 = leaves.find((sector) => sector.startAngle === a1.endAngle)!;
        const { canvasX, canvasY } = Transformable.toCanvasPoint(a2, a2.centerX, a2.centerY);
        const radius = a2.innerRadius + 3;
        const angle = a2.startAngle + 3 / radius;
        return [canvasX + radius * Math.cos(angle), canvasY + radius * Math.sin(angle)] as const;
    };

    // The glows stack by depth: where the glow of a hovered leaf overlaps that of its branch, the leaf's is the one on top.
    describe.each([
        ['a tile of a treemap', treemap, () => leftOf('A')],
        ['a sector of a sunburst', sunburst, insideSectorBesideA1],
    ])('the glow of a hovered leaf, and that of its branch, in %s', (_name, testCase, pixelOf) => {
        // The pixel is reached by the glows of both the branch A and of its leaf A1.
        const pixel = (branchGlows: boolean, leafGlows: boolean) =>
            pixelWhileHovering(testCase, 'A1', pixelOf, branchGlows ? glowing('A') : {}, leafGlows ? RED : OFF);

        it('draws the glow of the leaf over that of its branch', async () => {
            expect(await pixel(true, true)).toEqual(await pixel(false, true));
        });

        // The controls: each glow reaches the pixel alone, so the equality above is the leaf's colour over the branch's.
        it('has the glow of the leaf at that pixel', async () => {
            expect(await pixel(false, true)).not.toEqual(await pixel(false, false));
        });

        it('has the glow of the branch at that pixel', async () => {
            expect(await pixel(true, false)).not.toEqual(await pixel(false, false));
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
            { way: 'the highlightedItem state', styled: false, highlight: HIGHLIGHT_ON },
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
                const glows = styled ? [hovered] : [];

                const alone = await hoveredPixel(testCase, { hover, glows, highlight }, pixelOf);

                expect(
                    await hoveredPixel(testCase, { hover, glows: [...glows, neighbour], highlight }, pixelOf)
                ).toEqual(alone);
            });
        });

        // The glow of the hovered node is drawn over the fill of a parent that glows too: nothing cuts it.
        describe('inside a parent that glows', () => {
            const PARENTS = [
                ['a tile in its group in a treemap', treemap, 'A1', 'A', () => leftOf('A1')],
                ['a sector in its parent ring in a sunburst', sunburst, 'A1', 'A', insideRing],
            ] as const;

            it.each(PARENTS)(
                'shows the glow of %s over the fill of the parent',
                async (_name, testCase, hovered, parent, pixelOf) => {
                    const hover = [hovered];

                    expect(
                        await hoveredPixel(testCase, { hover, glows: [parent], highlight: HIGHLIGHT_ON }, pixelOf)
                    ).not.toEqual(
                        await hoveredPixel(testCase, { hover, glows: [parent], highlight: HIGHLIGHT_OFF }, pixelOf)
                    );
                }
            );

            // The control, at the same pixel: the glow of the parent alone does not change it, so only the glow of the hovered node does.
            it.each(PARENTS)(
                'has no glow of the parent at the pixel of %s',
                async (_name, testCase, hovered, parent, pixelOf) => {
                    const hover = [hovered];

                    expect(
                        await hoveredPixel(testCase, { hover, glows: [parent], highlight: HIGHLIGHT_OFF }, pixelOf)
                    ).toEqual(await hoveredPixel(testCase, { hover, glows: [], highlight: HIGHLIGHT_OFF }, pixelOf));
                }
            );
        });

        // The glow of the hovered sector is drawn over the fill of a child that glows too: the pixel is 3px inside the sector of A1.
        describe('beside a child that glows', () => {
            const pixel = (highlight: object, glows: string[]) =>
                hoveredPixel(sunburst, { hover: ['A'], glows, highlight }, () => insideRing(3));

            it('shows the glow of the hovered sector over the fill of its child', async () => {
                expect(await pixel(HIGHLIGHT_ON, ['A1'])).not.toEqual(await pixel(HIGHLIGHT_OFF, ['A1']));
            });

            // The control, at the same pixel: the glow of the child alone does not reach it, as its own fill is above it.
            it('has no glow of the child at that pixel', async () => {
                expect(await pixel(HIGHLIGHT_OFF, ['A1'])).toEqual(await pixel(HIGHLIGHT_OFF, []));
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
        /** An itemStyler that takes the glow off the node `name` alone. */
        const withoutGlowOn = (name: string) => ({
            itemStyler: ({ datum }: { datum?: { name?: string } }) =>
                datum?.name === name ? { glow: { enabled: false } } : {},
        });

        /** The chart with `hover` hovered and the series glow, and `without` the glow of that node, as it is drawn. */
        const hoveredImage = async (testCase: typeof treemap, hover: string, highlight?: object, without?: string) => {
            const placement = without == null ? { glow: GLOW } : { glow: GLOW, ...withoutGlowOn(without) };
            await create([glowSeries(testCase, placement, highlight)], testCase.data, RENDER_OPTIONS);
            await hoverNode(chart(), nodeNamed(hover)(chart()));
            return canvasImage(chart());
        };

        // The glow of every other node is in both images, so the node is the one that they differ by.
        it.each([
            ['a sunburst', sunburst, 'B', { enabled: false }, 'B'],
            ['the groups of a treemap', treemapGroup, 'A', { enabled: false }, 'A'],
            ['the tiles of a treemap, with their highlight off,', treemap, 'A1', { enabled: false }, 'A1'],
            ['the tiles of a treemap, with a group hovered,', treemap, 'B', undefined, 'A1'],
        ])('casts the glow of %s', async (_name, testCase, hover, highlight, node) => {
            const withGlow = await hoveredImage(testCase, hover, highlight);

            expect(differingBytes(withGlow, await hoveredImage(testCase, hover, highlight, node))).toBeGreaterThan(0);
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

    // The shadow of a hovered node is cast beneath the fill of the node beside it, as that of a node that is not hovered is. The
    // highlight copy of a tile or sector is in a layer of its own, above the others: it casts its glow there, and no shadow.
    describe.each([
        [
            'a tile of a treemap',
            treemap,
            'A2',
            'A1',
            { xOffset: 0, yOffset: -40 },
            () => {
                const { x, y, width, height } = nodeNamed('A1')(chart()).bbox!;
                return [x + padding.left + width / 2, y + padding.top + height - 3] as const;
            },
            { unhighlightedItem: OPAQUE_FILL, unhighlightedBranch: OPAQUE_FILL },
        ],
        [
            'a group of a treemap',
            treemapGroup,
            'A',
            'B',
            { xOffset: 40, yOffset: 0 },
            () => insideEdgeOf('B'),
            { unhighlightedItem: OPAQUE_FILL },
        ],
        [
            'a sector of a sunburst',
            sunburst,
            'B',
            'A',
            { xOffset: 30, yOffset: 0 },
            () => {
                // 3px to the right of the vertical radius that A shares with B, in the ring of A and B.
                const sectors = shapesOf(getSeriesAt(chart()).contentGroup, Sector);
                const ring = sectors.find(({ innerRadius, outerRadius }) => innerRadius === 0 && outerRadius > 0)!;
                const { canvasX, canvasY } = Transformable.toCanvasPoint(ring, ring.centerX, ring.centerY);
                return [canvasX + 3, canvasY - (ring.innerRadius + ring.outerRadius) / 2] as const;
            },
            { unhighlightedItem: OPAQUE_FILL, unhighlightedBranch: OPAQUE_FILL },
        ],
    ])('the shadow of %s that is hovered', (_name, testCase, hovered, beside, offsets, pixelOf, opaque) => {
        const SHADOW = { enabled: true, fill: '#ff0000', fillOpacity: 1, blur: 0, ...offsets };
        /** An itemStyler that takes the fill off the node `beside`, so that what is beneath it shows. */
        const withoutFill = {
            itemStyler: ({ datum }: { datum?: { name?: string } }) =>
                datum?.name === beside ? { fill: 'rgba(0, 0, 0, 0)' } : {},
        };
        const pixelHovering = (shadow?: object, placement: object = {}) =>
            pixelWhileHovering(testCase, hovered, pixelOf, { shadow, ...placement }, OFF, opaque);

        it('does not show over the fill of the node beside it', async () => {
            expect(await pixelHovering(SHADOW)).toEqual(await pixelHovering());
        });

        // The control: the shadow reaches that pixel, and shows once the node beside it has no fill.
        it('reaches the pixel inside the node beside it', async () => {
            expect(await pixelHovering(SHADOW, withoutFill)).not.toEqual(await pixelHovering(undefined, withoutFill));
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
