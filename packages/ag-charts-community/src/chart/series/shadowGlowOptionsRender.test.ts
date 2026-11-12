import { describe, expect, it } from 'vitest';

import { expectSamePixels } from '../test/expectSamePixels';
import { RENDER_OPTIONS, canvasImage, differingBytes, hoverDatum } from '../test/glowRender';
import { useGlowCharts } from '../test/glowRenderSuite';
import { CATEGORY_DATA, SERIES_GLOW, SERIES_SHADOW } from '../test/shadowFixtures';
import { createChart } from '../test/utils';

const BAR = { type: 'bar', xKey: 'category', yKey: 'value' };

// Headroom around the bars, for a shadow or a glow to be drawn in.
const OPTIONS = { ...RENDER_OPTIONS, axes: { y: { type: 'number', min: 0, max: 12 } } };

/** The options of the shadow, and of the glow, that a bar is given, and each change to them that should show in the render. */
const CASTS = {
    shadow: {
        cast: { ...SERIES_SHADOW, fillOpacity: 0.8, spread: 0 },
        changes: [
            { xOffset: 12 },
            { yOffset: 12 },
            { blur: 0 },
            { spread: 4 },
            { fill: '#cc2200' },
            { fillOpacity: 0.3 },
        ],
    },
    glow: {
        cast: SERIES_GLOW,
        changes: [{ blur: 0 }, { spread: 8 }, { fill: '#00aa00' }, { fillOpacity: 1 }],
    },
};

/** Where a bar is given its shadow and glow: on the series, or for the hovered item only. */
const PLACEMENTS: [string, (cast: object) => object, boolean][] = [
    ['the series', (cast) => cast, false],
    ['the hovered item', (cast) => ({ highlight: { highlightedItem: cast } }), true],
];

describe('shadow and glow options render', () => {
    const charts = useGlowCharts(createChart);
    const { create, chart } = charts;

    const draw = async (cast: object, place: (cast: object) => object, hover: boolean) => {
        await create([{ ...BAR, ...place(cast) }], CATEGORY_DATA, OPTIONS);
        if (hover) await hoverDatum(chart(), 0, 1);
        return canvasImage(chart());
    };

    describe.each(PLACEMENTS)('on %s', (_name, place, hover) => {
        describe.each(Object.entries(CASTS))('the %s', (name, { cast, changes }) => {
            const style = (change: object = {}) => ({ [name]: { ...cast, ...change } });

            it.each(changes)('renders differently when %o changes', async (change) => {
                const before = await draw(style(), place, hover);
                expect(differingBytes(before, await draw({}, place, hover))).toBeGreaterThan(0);
                expect(differingBytes(await draw(style(change), place, hover), before)).toBeGreaterThan(0);
            });
        });

        describe('the glow gap', () => {
            const glow = (gap?: number) => ({ glow: { ...SERIES_GLOW, gap } });

            it('renders a gap of 0 as it renders no gap', async () => {
                expectSamePixels(await draw(glow(0), place, hover), await draw(glow(), place, hover));
            });

            it('renders a gap above 0 differently from none', async () => {
                const none = await draw(glow(0), place, hover);
                expect(differingBytes(await draw(glow(4), place, hover), none)).toBeGreaterThan(0);
                expect(differingBytes(await draw(glow(12), place, hover), none)).toBeGreaterThan(0);
            });
        });
    });
});
