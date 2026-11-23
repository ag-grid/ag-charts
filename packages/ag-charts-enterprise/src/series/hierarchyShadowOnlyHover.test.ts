import { describe, expect, it } from 'vitest';

import { RENDER_OPTIONS, chartPixelAt, hoverNode, useGlowCharts } from 'ag-charts-community-test';

import { nodeNamed } from '../test/glowSeriesCases';
import { createEnterpriseChart } from '../test/utils';

/** Three levels, so that the leaf A1 sits beside the group A2, which is one level deeper. */
const DATA = [
    {
        name: 'A',
        children: [
            { name: 'A1', size: 10 },
            {
                name: 'A2',
                children: [
                    { name: 'A21', size: 4 },
                    { name: 'A22', size: 4 },
                ],
            },
        ],
    },
    {
        name: 'B',
        children: [
            { name: 'B1', size: 8 },
            { name: 'B2', size: 4 },
        ],
    },
];

const { padding } = RENDER_OPTIONS;
const SHADOW = { enabled: true, fill: '#ff0000', fillOpacity: 1, blur: 0, xOffset: 40, yOffset: 0 };
/** A highlight style that leaves a node opaque, which the highlight otherwise dims, so that nothing shows through its fill. */
const OPAQUE = { opacity: 1, fillOpacity: 1, strokeOpacity: 1 };
const OPAQUE_HIGHLIGHT = {
    highlightedItem: OPAQUE,
    highlightedBranch: OPAQUE,
    unhighlightedItem: OPAQUE,
    unhighlightedBranch: OPAQUE,
};
/** A group has only the two item states. */
const OPAQUE_GROUP_HIGHLIGHT = { highlightedItem: OPAQUE, unhighlightedItem: OPAQUE };
const KEYS = { labelKey: 'name', sizeKey: 'size' };

const treemap = {
    type: 'treemap',
    ...KEYS,
    tile: { fillOpacity: 1, shadow: SHADOW, highlight: OPAQUE_HIGHLIGHT },
    group: { fill: '#cfd8dc', fillOpacity: 1, shadow: SHADOW, highlight: OPAQUE_GROUP_HIGHLIGHT },
};
const sunburst = { type: 'sunburst', ...KEYS, fillOpacity: 1, shadow: SHADOW, highlight: OPAQUE_HIGHLIGHT };

// With no glow set, no hover moves a fill or a shadow of any node, hovered or not: each snapshot is that of `latest`.
describe('the shadow of a hovered node, in a hierarchy of three levels with shadows and no glow', () => {
    const { create, chart, snapshot } = useGlowCharts(createEnterpriseChart);

    describe.each([
        ['treemap', treemap, ['A1', 'A21', 'A2', 'A', 'B1']],
        ['sunburst', sunburst, ['A1', 'A21', 'A2', 'A']],
    ])('of a %s', (_type, series, hovered) => {
        it.each(hovered)('with %s hovered', async (name) => {
            await create([series], DATA, RENDER_OPTIONS);
            await hoverNode(chart(), nodeNamed(name)(chart()));

            await snapshot();
        });
    });

    // The shadow of the tiles of a hovered group lands beneath the fill of the tiles of the group beside it, as at rest.
    describe('of the tiles of a hovered group, over the tile B1 of the group beside it', () => {
        /** The pixel in B1, 3px from its left edge, which the shadow of the tile A1 reaches, as it is offset 40px to the right. */
        const pixelHovering = async (hovered: string, { shadow = true, clearB1 = false } = {}) => {
            const itemStyler = ({ datum }: { datum?: { name?: string } }) =>
                clearB1 && datum?.name === 'B1' ? { fill: 'rgba(0, 0, 0, 0)' } : {};
            const tile = { ...treemap.tile, shadow: shadow ? SHADOW : undefined };
            await create([{ ...treemap, tile, itemStyler }], DATA, RENDER_OPTIONS);
            await hoverNode(chart(), nodeNamed(hovered)(chart()));
            const { x, y, height } = nodeNamed('B1')(chart()).bbox!;
            return chartPixelAt(chart(), x + padding.left + 3, y + padding.top + height / 2);
        };

        it.each(['A', 'A2', 'A1', 'A21'])('is beneath its fill with %s hovered', async (hovered) => {
            expect(await pixelHovering(hovered)).toEqual(await pixelHovering('B2'));
        });

        // The control, at the same pixel: the shadow of the tiles of A reaches it, and shows once B1 has no fill.
        it('reaches that pixel', async () => {
            expect(await pixelHovering('A', { clearB1: true })).not.toEqual(
                await pixelHovering('A', { clearB1: true, shadow: false })
            );
        });
    });
});
