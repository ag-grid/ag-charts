import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { hoverDatum, strengthOfRed, visibleItems } from '../../test/glowRender';
import {
    chartPixelAt,
    createChart,
    expectWarningsCalls,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A glow or shadow with no blur, in red over a white chart, so that the strength it is cast at reads off the green channel.
const SHADOW = { enabled: true, fill: 'red', xOffset: 30, yOffset: 0, blur: 0 };
const GLOW = { enabled: true, fill: 'red', spread: 10, blur: 0 };
const FULL_RED = [255, 0, 0, 255];
const WHITE = [255, 255, 255, 255];

describe('glow and shadow strength under the fillOpacity of the item, in a chart', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const castBeside = async (series: object, chartOptions: object = {}, dimmed?: number, hoverLast = false) => {
        const options: AgChartOptions = {
            animation: { enabled: false },
            legend: { enabled: false },
            data: [
                { category: 'A', value: 8 },
                { category: 'B', value: 8 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'value',
                    fill: 'blue',
                    strokeWidth: 0,
                    highlight: { unhighlightedItem: { opacity: dimmed ?? 1 } },
                    ...series,
                },
            ],
            ...chartOptions,
        };
        if (chart == null) {
            chart = await createChart(options);
        } else {
            await chart.update(prepareTestOptions(options));
            await waitForChartStability(chart);
        }

        if (dimmed != null || hoverLast) await hoverDatum(chart, 0, hoverLast ? 1 : 0);

        const { x, y, width, height } = visibleItems(chart).at(-1)!;
        return chartPixelAt(chart, x + width + 5, y + height / 2);
    };

    const CASTS = {
        glow: (fillOpacity?: number) => ({ glow: { ...GLOW, fillOpacity } }),
        shadow: (fillOpacity?: number) => ({ shadow: { ...SHADOW, fillOpacity } }),
    };

    // The theme's black shadow at its unset fillOpacity of 0.5, so the red channel is what it takes away.
    const THEME_SHADOW = { enabled: true, xOffset: 30, yOffset: 0, blur: 0 };
    const shadowStrength = ([red]: number[]) => 1 - red / 255;

    const hoveredCast = (series: object, highlightedItem: object) =>
        castBeside(
            { fillOpacity: 0.5, ...series, highlight: { unhighlightedItem: { opacity: 1 }, highlightedItem } },
            {},
            undefined,
            true
        );

    describe('with a fillOpacity of 1 set, on bars at a fillOpacity of 0.5', () => {
        it.each(['glow', 'shadow'] as const)('should cast the %s as it casts it on opaque bars', async (name) => {
            const opaque = await castBeside({ ...CASTS[name](1), fillOpacity: 1 });
            const translucent = await castBeside({ ...CASTS[name](1), fillOpacity: 0.5 });

            expect(opaque).toEqual(FULL_RED);
            expect(translucent).toEqual(FULL_RED);
        });

        it('should cast a glow as set where the alpha is in the colour of the fill', async () => {
            expect(await castBeside({ ...CASTS.glow(1), fill: 'rgba(0, 0, 255, 0.5)' })).toEqual(FULL_RED);
        });

        it('should cast a glow as set where the fill is a gradient with alpha', async () => {
            const fill = {
                type: 'gradient',
                colorStops: [
                    { color: 'rgba(0, 0, 255, 0.4)', stop: 0 },
                    { color: 'rgba(0, 0, 255, 0.4)', stop: 1 },
                ],
            };

            expect(await castBeside({ ...CASTS.glow(1), fill })).toEqual(FULL_RED);
        });

        it('should cast a shadow as set where a theme override sets the fillOpacity, not the series', async () => {
            const theme = { overrides: { bar: { series: { shadow: { fillOpacity: 0.8 } } } } };

            expect(strengthOfRed(await castBeside({ shadow: SHADOW, fillOpacity: 0.5 }, { theme }))).toBeCloseTo(
                0.8,
                1
            );
        });
    });

    describe('with no fillOpacity set, on bars at a fillOpacity of 0.5', () => {
        it('should cast a glow at its default of 0.4, whatever the fillOpacity of the bars', async () => {
            expect(strengthOfRed(await castBeside({ ...CASTS.glow(), fillOpacity: 0.5 }))).toBeCloseTo(0.4, 1);
            expect(strengthOfRed(await castBeside({ ...CASTS.glow(), fillOpacity: 1 }))).toBeCloseTo(0.4, 1);
        });

        it('should cast a glow with no fill in the colour of the bar, at 0.4', async () => {
            const [r, g, b] = await castBeside({ glow: { enabled: true, spread: 10, blur: 0 }, fillOpacity: 0.5 });

            // Blue at 0.4 over white leaves 60% of red and green, and all of the blue.
            expect([r, g, b]).toEqual([153, 153, 255]);
        });

        it('should cast a shadow at the 0.5 of the theme times the fillOpacity of the bars', async () => {
            // A shadow in the theme's black, so the red channel is what it takes away.
            const shadow = { enabled: true, xOffset: 30, yOffset: 0, blur: 0 };

            expect((await castBeside({ shadow, fillOpacity: 0.5 }))[0]).toBeCloseTo(255 * (1 - 0.25), -1);
            expect((await castBeside({ shadow, fillOpacity: 1 }))[0]).toBeCloseTo(255 * (1 - 0.5), -1);
        });
    });

    describe('with only a fill set on the shadow, on bars at a fillOpacity of 0.5', () => {
        it('should cast it at the fillOpacity of the bars', async () => {
            expect(strengthOfRed(await castBeside({ shadow: SHADOW, fillOpacity: 0.5 }))).toBeCloseTo(0.5, 1);
            expect(await castBeside({ shadow: SHADOW, fillOpacity: 1 })).toEqual(FULL_RED);
        });
    });

    describe('from the shadow of the highlightedItem, on the hovered bar at a fillOpacity of 0.5', () => {
        it('should cast a fillOpacity of the bucket as set, over a shadow with the fillOpacity of the theme', async () => {
            const [red] = await hoveredCast({ shadow: THEME_SHADOW }, { shadow: { fillOpacity: 1 } });

            expect(red).toBeLessThanOrEqual(1);
        });

        it('should cast a fill of the bucket alone as unset, over a shadow with a fillOpacity set', async () => {
            const series = { shadow: { ...SHADOW, fillOpacity: 1 } };

            expect(strengthOfRed(await hoveredCast(series, { shadow: { fill: 'red' } }))).toBeCloseTo(0.5, 1);
        });
    });

    describe('with the opacity of the item', () => {
        it.each(['glow', 'shadow'] as const)('should halve a %s with a fillOpacity set', async (name) => {
            const series = CASTS[name](1);

            expect(strengthOfRed(await castBeside({ ...series, fillOpacity: 1 }, {}, 0.5))).toBeCloseTo(0.5, 1);
            expect(strengthOfRed(await castBeside({ ...series, fillOpacity: 0.5 }, {}, 0.5))).toBeCloseTo(0.5, 1);
        });

        it('should halve a glow at its default, and a shadow at the fillOpacity of the item as well', async () => {
            expect(strengthOfRed(await castBeside({ ...CASTS.glow(), fillOpacity: 0.5 }, {}, 0.5))).toBeCloseTo(0.2, 1);
            expect(strengthOfRed(await castBeside({ shadow: SHADOW, fillOpacity: 0.5 }, {}, 0.5))).toBeCloseTo(0.25, 1);
        });
    });

    describe('from an itemStyler', () => {
        it('should cast a glow as set with a fillOpacity, and at 0.4 without, on bars at 0.5', async () => {
            const styled = (glow: object) => ({ fillOpacity: 0.5, itemStyler: () => ({ glow }) });

            expect(await castBeside(styled({ ...GLOW, fillOpacity: 1 }))).toEqual(FULL_RED);
            expect(strengthOfRed(await castBeside(styled(GLOW)))).toBeCloseTo(0.4, 1);
        });

        it('should cast a shadow as set with a fillOpacity, and at the fillOpacity of the bars with only a fill', async () => {
            const styled = (shadow: object) => ({ fillOpacity: 0.5, itemStyler: () => ({ shadow }) });

            expect(await castBeside(styled({ ...SHADOW, fillOpacity: 1 }))).toEqual(FULL_RED);
            expect(strengthOfRed(await castBeside(styled(SHADOW)))).toBeCloseTo(0.5, 1);
        });
    });

    describe('from an itemStyler that returns or spreads the shadow or glow it was given', () => {
        type Styler = (given: { shadow?: object; glow?: object }) => object | undefined;
        const SHADOW_STYLERS: Record<string, Styler | undefined> = {
            'no styler': undefined,
            'returns the shadow': (p) => ({ shadow: p.shadow }),
            'spreads the shadow': (p) => ({ shadow: { ...p.shadow } }),
            'sets only the xOffset': () => ({ shadow: { xOffset: 30 } }),
        };

        const shadowCast = (shadow: object, itemStyler: Styler | undefined) =>
            castBeside({ shadow, fillOpacity: 0.5, itemStyler });

        it.each(Object.entries(SHADOW_STYLERS))(
            'should cast the theme shadow at 0.5 x the fillOpacity of the bars with %s',
            async (_name, itemStyler) => {
                expect(shadowStrength(await shadowCast(THEME_SHADOW, itemStyler))).toBeCloseTo(0.25, 1);
            }
        );

        it.each(['returns the shadow', 'spreads the shadow'])(
            'should cast a shadow with a fillOpacity of 1 at 1 as with no styler, where the styler %s',
            async (name) => {
                const shadow = { ...THEME_SHADOW, fillOpacity: 1 };

                expect(shadowStrength(await shadowCast(shadow, undefined))).toBeCloseTo(1, 1);
                expect(shadowStrength(await shadowCast(shadow, SHADOW_STYLERS[name]))).toBeCloseTo(1, 1);
            }
        );

        it.each([
            [
                'spreads the shadow and sets a fillOpacity',
                (p: { shadow?: object }) => ({ shadow: { ...p.shadow, fillOpacity: 0.8 } }),
            ],
            ['sets only a fillOpacity', () => ({ shadow: { fillOpacity: 0.8 } })],
        ])('should cast a fillOpacity of its own as set, where the styler %s', async (_name, itemStyler) => {
            for (const fillOpacity of [0.5, 1]) {
                const strength = shadowStrength(await castBeside({ shadow: THEME_SHADOW, fillOpacity, itemStyler }));

                expect(strength).toBeCloseTo(0.8, 1);
            }
        });

        it('should cast a fillOpacity equal to the unset theme value as unset, the same cast it was given', async () => {
            const itemStyler = () => ({ shadow: { fillOpacity: 0.5 } });

            expect(shadowStrength(await shadowCast(THEME_SHADOW, itemStyler))).toBeCloseTo(0.25, 1);
        });

        it('should cast the shadow of the highlightedItem on the hovered bar as it does with no styler', async () => {
            const hovered = (itemStyler: Styler | undefined) =>
                hoveredCast({ shadow: THEME_SHADOW, itemStyler }, { shadow: { xOffset: 20 } });
            const unstyled = await hovered(undefined);

            expect(shadowStrength(unstyled)).toBeCloseTo(0.25, 1);
            expect(await hovered(SHADOW_STYLERS['returns the shadow'])).toEqual(unstyled);
            expect(await hovered(SHADOW_STYLERS['spreads the shadow'])).toEqual(unstyled);
        });

        it.each([0.5, 0.6])(
            'should cast a shadow that the styler enables at a fillOpacity of %s at that value, given no shadow',
            async (fillOpacity) => {
                const itemStyler = () => ({ shadow: { ...THEME_SHADOW, fillOpacity } });

                expect(shadowStrength(await castBeside({ fillOpacity: 0.5, itemStyler }))).toBeCloseTo(fillOpacity, 1);
            }
        );

        // A glow always casts at its own alpha, whatever flag its shadow carries, so a styler cannot change its strength.
        it.each([
            ['returns the glow', (p: { glow?: object }) => ({ glow: p.glow })],
            ['spreads the glow', (p: { glow?: object }) => ({ glow: { ...p.glow } })],
        ])('should cast a glow at its default of 0.4 where the styler %s', async (_name, itemStyler) => {
            const series = { glow: { ...GLOW, fillOpacity: undefined }, fillOpacity: 0.5 };
            const unstyled = await castBeside(series);

            expect(strengthOfRed(unstyled)).toBeCloseTo(0.4, 1);
            expect(await castBeside({ ...series, itemStyler })).toEqual(unstyled);
        });
    });

    describe('with the flag that the theme computes, set in user options', () => {
        const KEYS = ['_fillOpacitySet', 'fillOpacitySet'];
        // 0.5 x the 0.5 of the bars, where the flag would cast at the shadow's own 0.5.
        const UNSET_CAST = 0.25;

        const expectDroppedWith = (key: string) => {
            expectWarningsCalls().toEqual([[expect.stringContaining(key)]]);
        };

        it.each(KEYS)('should drop %s from the shadow of the series, and cast as without it', async (key) => {
            const cast = await castBeside({ shadow: { ...THEME_SHADOW, [key]: true }, fillOpacity: 0.5 });

            expect(shadowStrength(cast)).toBeCloseTo(UNSET_CAST, 1);
            expectDroppedWith(key);
        });

        it.each([
            ['a value', true],
            ['a theme operator', { $path: './enabled' }],
        ])('should drop it from a theme override with %s, and cast as without it', async (_name, value) => {
            const theme = { overrides: { bar: { series: { shadow: { _fillOpacitySet: value } } } } };
            const cast = await castBeside({ shadow: THEME_SHADOW, fillOpacity: 0.5 }, { theme });

            expect(shadowStrength(cast)).toBeCloseTo(UNSET_CAST, 1);
            expectDroppedWith('_fillOpacitySet');
        });

        it('should drop it from the shadow of the highlightedItem, and cast as without it', async () => {
            const hovered = (bucket: object) =>
                hoveredCast({ shadow: THEME_SHADOW }, { shadow: { xOffset: 20, ...bucket } });
            const without = await hovered({});
            const flagged = await hovered({ _fillOpacitySet: true });

            expect(shadowStrength(without)).toBeCloseTo(UNSET_CAST, 1);
            expect(flagged).toEqual(without);
            expectDroppedWith('_fillOpacitySet');
        });

        it('should treat it in the shadow that an itemStyler returns as it treats any unknown key', async () => {
            const styled = (key: string) =>
                castBeside({ shadow: THEME_SHADOW, fillOpacity: 0.5, itemStyler: () => ({ shadow: { [key]: true } }) });

            const unknown = await styled('notAShadowOption');
            expectDroppedWith('notAShadowOption');
            const flagged = await styled('_fillOpacitySet');
            expectDroppedWith('_fillOpacitySet');

            expect(flagged).toEqual(unknown);
        });

        it('should accept the value that the theme computes, with no warning', async () => {
            const [red] = await castBeside({ shadow: { ...THEME_SHADOW, fillOpacity: 1 }, fillOpacity: 0.5 });

            expect(red).toBeLessThanOrEqual(1);
            expectWarningsCalls().toEqual([]);
        });
    });

    describe('for the shadow that an itemStyler is given', () => {
        it.each([
            ['set', { ...SHADOW, fillOpacity: 0.5 }],
            ['unset', SHADOW],
        ])('should carry no _fillOpacitySet flag where the fillOpacity of the series is %s', async (_name, shadow) => {
            const seen: object[] = [];
            const itemStyler = ({ shadow: given }: { shadow?: object }) => {
                if (given != null) seen.push(given);
                return undefined;
            };

            await castBeside({ shadow, itemStyler });

            expect(seen.length).toBeGreaterThan(0);
            for (const given of seen) expect(given).not.toHaveProperty('_fillOpacitySet');
        });
    });

    describe('with a fillOpacity of 0', () => {
        it.each(['glow', 'shadow'] as const)('should cast no %s', async (name) => {
            expect(await castBeside({ ...CASTS[name](0), fillOpacity: 0.5 })).toEqual(WHITE);
        });
    });
});
