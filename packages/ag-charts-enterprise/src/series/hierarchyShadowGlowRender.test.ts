import { describe, expect, it } from 'vitest';

import {
    HIGHLIGHT_GLOW,
    RENDER_OPTIONS,
    canvasImage,
    describeGlowSeries,
    glowSeries,
    hoverNode,
    useGlowCharts,
} from 'ag-charts-community-test';

import { HIERARCHY_GLOW_SERIES } from '../test/glowSeriesCases';
import { getHierarchyRootNode } from '../test/seriesAccessors';
import { createEnterpriseChart } from '../test/utils';

describe('shadow and glow render (hierarchy series)', () => {
    const charts = useGlowCharts(createEnterpriseChart);
    const { create, chart, snapshot } = charts;

    describeGlowSeries(HIERARCHY_GLOW_SERIES, charts);

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
        const GLOW = { enabled: true, fill: '#0000ff', fillOpacity: 1, blur: 0, spread: 14 };
        const treemap = HIERARCHY_GLOW_SERIES.find(({ name }) => name === 'treemap tile')!;

        const glowing = (...names: string[]) => ({
            itemStyler: ({ datum }: { datum?: { name?: string } }) =>
                names.includes(datum?.name ?? '') ? { glow: GLOW } : {},
        });

        /** The pixel just inside the tile `name`, at the edge that it shares with the tile above, in canvas coordinates. */
        const pixelBelow = async (name: string, ...glowingNames: string[]) => {
            await create([glowSeries(treemap, glowing(...glowingNames))], treemap.data, RENDER_OPTIONS);
            const tile = [...getHierarchyRootNode(chart())!].find((node) => node.datum?.name === name)!;
            const { x, y, width } = tile.bbox!;
            const { padding } = RENDER_OPTIONS;
            const { data } = canvasImage(chart());
            const offset = (Math.round(y + padding.top + 3) * 800 + Math.round(x + padding.left + width / 2)) * 4;
            return Array.from(data.slice(offset, offset + 4));
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
});
