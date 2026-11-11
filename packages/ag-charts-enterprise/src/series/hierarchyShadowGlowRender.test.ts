import { describe, expect, it } from 'vitest';

import {
    HIGHLIGHT_GLOW,
    RENDER_OPTIONS,
    SERIES_GLOW,
    SERIES_SHADOW,
    canvasImage,
    differingBytes,
    endHover,
    expectSamePixels,
    hoverNode,
    useGlowCharts,
} from 'ag-charts-community-test';

import { getHierarchyRootNode } from '../test/seriesAccessors';
import { createEnterpriseChart } from '../test/utils';

// Two top-level branches, so that hovering a leaf of A leaves B as the other branch.
const DATA = [
    {
        name: 'A',
        children: [
            { name: 'A1', size: 10 },
            { name: 'A2', size: 6 },
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

interface Cast {
    shadow?: object;
    highlight?: object;
}

interface HierarchyCase {
    name: string;
    type: string;
    base: object;
    /** The options that place the shadow and highlight, as a series and a theme override both read them. */
    place: (cast: Cast) => object;
    /** The highlight states that take a `glow` where the case places them. */
    buckets: string[];
    /** The node the pointer is on: a leaf, or a group of the treemap. */
    hovered: string;
}

const KEYS = { labelKey: 'name', sizeKey: 'size' };

const CASES: HierarchyCase[] = [
    {
        name: 'sunburst',
        type: 'sunburst',
        base: { type: 'sunburst', ...KEYS },
        place: (cast) => cast,
        buckets: ['highlightedItem', 'unhighlightedItem', 'highlightedBranch', 'unhighlightedBranch'],
        hovered: 'A1',
    },
    {
        name: 'treemap tile',
        type: 'treemap',
        base: { type: 'treemap', ...KEYS },
        place: (cast) => ({ tile: cast }),
        buckets: ['highlightedItem', 'unhighlightedItem', 'highlightedBranch', 'unhighlightedBranch'],
        hovered: 'A1',
    },
    {
        name: 'treemap group',
        type: 'treemap',
        base: { type: 'treemap', ...KEYS },
        place: (cast) => ({ group: cast }),
        buckets: ['highlightedItem', 'unhighlightedItem'],
        hovered: 'A',
    },
];

describe('shadow and glow render (hierarchy series)', () => {
    const charts = useGlowCharts(createEnterpriseChart);
    const { create, chart, snapshot } = charts;

    describe.each(CASES)('$name', (testCase) => {
        const seriesOf = (cast: Cast) => ({ ...testCase.base, ...testCase.place(cast) });
        const glowOf = (bucket: string, glow: object = HIGHLIGHT_GLOW) => ({ highlight: { [bucket]: { glow } } });

        const draw = async (cast: Cast, { hover = false, themed = false } = {}) => {
            const options = themed
                ? { ...RENDER_OPTIONS, theme: { overrides: { [testCase.type]: { series: testCase.place(cast) } } } }
                : RENDER_OPTIONS;
            await create([themed ? seriesOf({}) : seriesOf(cast)], DATA, options);
            if (hover) await hoverOn(testCase.hovered);
            return canvasImage(chart());
        };

        const hoverOn = async (name: string) => {
            for (const node of getHierarchyRootNode(chart())!) {
                if (node.datum?.name === name) return hoverNode(chart(), node);
            }
            throw new Error(`No node named ${name}`);
        };

        it('renders the series shadow', async () => {
            await create([seriesOf({ shadow: SERIES_SHADOW })], DATA);
            await snapshot();
        });

        it.each(testCase.buckets)('renders the glow of %s', async (bucket) => {
            await create([seriesOf(glowOf(bucket))], DATA);
            await hoverOn(testCase.hovered);
            await snapshot();
        });

        it.each(testCase.buckets)('renders as at rest once the hover has ended, with a glow on %s', async (bucket) => {
            await create([seriesOf(glowOf(bucket))], DATA);
            const rest = canvasImage(chart());
            await hoverOn(testCase.hovered);
            const hovered = canvasImage(chart());
            expect(differingBytes(hovered, rest)).toBeGreaterThan(0);

            await endHover(chart());
            expectSamePixels(canvasImage(chart()), rest);

            await hoverOn(testCase.hovered);
            expectSamePixels(canvasImage(chart()), hovered);
        });

        it.each(testCase.buckets)('renders a disabled glow on %s as it renders none', async (bucket) => {
            const none = await draw({}, { hover: true });
            expect(differingBytes(await draw(glowOf(bucket), { hover: true }), none)).toBeGreaterThan(0);
            expectSamePixels(await draw(glowOf(bucket, { ...HIGHLIGHT_GLOW, enabled: false }), { hover: true }), none);
        });

        it('renders a disabled shadow as it renders none', async () => {
            const none = await draw({});
            expect(differingBytes(await draw({ shadow: SERIES_SHADOW }), none)).toBeGreaterThan(0);
            expectSamePixels(await draw({ shadow: { ...SERIES_SHADOW, enabled: false } }), none);
        });

        it('renders the shadow of the theme as that of the series', async () => {
            const series = await draw({ shadow: SERIES_SHADOW });
            expect(differingBytes(series, await draw({}))).toBeGreaterThan(0);
            expectSamePixels(await draw({ shadow: SERIES_SHADOW }, { themed: true }), series);
        });

        it('renders the highlight glow of the theme as that of the series', async () => {
            const cast = glowOf('highlightedItem', SERIES_GLOW);
            const series = await draw(cast, { hover: true });
            expect(differingBytes(series, await draw({}, { hover: true }))).toBeGreaterThan(0);
            expectSamePixels(await draw(cast, { hover: true, themed: true }), series);
        });
    });
});
