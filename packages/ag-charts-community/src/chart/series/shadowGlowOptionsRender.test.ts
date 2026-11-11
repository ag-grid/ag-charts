import { describe, expect, it } from 'vitest';

import { expectSamePixels } from '../test/expectSamePixels';
import { RENDER_OPTIONS, canvasImage, differingBytes, hoverDatum } from '../test/glowRender';
import { useGlowCharts } from '../test/glowRenderSuite';
import { CATEGORY_DATA } from '../test/shadowFixtures';
import { createChart } from '../test/utils';

const BAR = { type: 'bar', xKey: 'category', yKey: 'value' };

// Headroom around the bars, for a shadow or a glow to be drawn in.
const OPTIONS = { ...RENDER_OPTIONS, axes: { y: { type: 'number', min: 0, max: 12 } } };

const SHADOW = { enabled: true, fill: '#112233', fillOpacity: 0.8, xOffset: 4, yOffset: 4, blur: 6, spread: 0 };
const GLOW = { enabled: true, fill: '#aa0000', fillOpacity: 0.5, blur: 5, spread: 3 };

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
        describe('the shadow', () => {
            const shadow = (style: object = {}) => ({ shadow: { ...SHADOW, ...style } });

            it.each([
                { xOffset: 12 },
                { yOffset: 12 },
                { blur: 0 },
                { spread: 4 },
                { fill: '#cc2200' },
                { fillOpacity: 0.3 },
            ])('renders differently when %o changes', async (change) => {
                const before = await draw(shadow(), place, hover);
                expect(differingBytes(before, await draw({}, place, hover))).toBeGreaterThan(0);
                expect(differingBytes(await draw(shadow(change), place, hover), before)).toBeGreaterThan(0);
            });
        });

        describe('the glow', () => {
            const glow = (style: object = {}) => ({ glow: { ...GLOW, ...style } });

            it.each([{ blur: 0 }, { spread: 8 }, { fill: '#00aa00' }, { fillOpacity: 1 }, { gap: 4 }])(
                'renders differently when %o changes',
                async (change) => {
                    const before = await draw(glow(), place, hover);
                    expect(differingBytes(before, await draw({}, place, hover))).toBeGreaterThan(0);
                    expect(differingBytes(await draw(glow(change), place, hover), before)).toBeGreaterThan(0);
                }
            );

            it('renders a gap of 0 as it renders no gap', async () => {
                expectSamePixels(
                    await draw(glow({ gap: 0 }), place, hover),
                    await draw(glow({ gap: undefined }), place, hover)
                );
            });

            it('renders a gap above 0 differently from none', async () => {
                const none = await draw(glow({ gap: 0 }), place, hover);
                expect(differingBytes(await draw(glow({ gap: 4 }), place, hover), none)).toBeGreaterThan(0);
                expect(differingBytes(await draw(glow({ gap: 12 }), place, hover), none)).toBeGreaterThan(0);
            });
        });
    });
});
