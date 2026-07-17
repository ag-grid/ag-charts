import { afterEach, describe, expect, it } from 'vitest';

import type { AgRadialGaugeOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgNumericValue } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RadialGaugeSeries', () => {
    setupMockConsole();
    let chart: any;

    const EXAMPLE_OPTIONS: AgRadialGaugeOptions = {
        ...(GALLERY_EXAMPLES.SIMPLE_RADIAL_GAUGE_EXAMPLE.options as any),
        bar: {
            fills: [{ color: '#27ae60' }, { color: '#f1c40f' }, { color: '#d35400' }],
        },
    };

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    const snapshot = async () => {
        await waitForChartStability(chart);

        return ctx.snapshot();
    };

    const compareImageDataUrl = async () => {
        await waitForChartStability(chart);
        const reference = await snapshot();

        const imageURL = await chart.getImageDataURL();
        const imagePNGData = Buffer.from(imageURL.split(',')[1], 'base64');
        expect(imagePNGData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        const imageRaw = ctx.getActiveCanvasInstances().find((canvas) => canvas.width > 100 && canvas.height > 100)!;
        expect(imageRaw.getContext('2d').getImageData(0, 0, imageRaw.width, imageRaw.height)).toMatchImage(reference);
    };

    describe('basic chart', () => {
        it('should render a gauge', async () => {
            const options: AgRadialGaugeOptions = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgRadialGaugeOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.createGauge(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe('series labels', () => {
        it('should render two series labels', async () => {
            const options: AgRadialGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                label: {
                    enabled: true,
                    formatter(params: any) {
                        return `${params.value.toFixed(0)}%`;
                    },
                },
                secondaryLabel: {
                    text: 'Score',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });
    });

    describe('fills', () => {
        it('should render custom discrete, fills with explicit stops', async () => {
            const options: AgRadialGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: 100,
                bar: {
                    fills: [
                        { color: '#0f0', stop: 20 },
                        { color: '#ff0', stop: 40 },
                        { color: '#f00', stop: 60 },
                    ],
                    fillMode: 'discrete',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });

        it('should render custom discrete, fills with implicit stops', async () => {
            const options: AgRadialGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: 100,
                bar: {
                    fills: [{ color: '#0f0' }, { color: '#ff0' }, { color: '#f00' }],
                    fillMode: 'discrete',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });

        it('should render custom discrete, fills with implicit end stops', async () => {
            const options: AgRadialGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: 100,
                bar: {
                    fills: [{ color: '#0f0', stop: 50 }, { color: '#ff0' }, { color: '#f00' }],
                    fillMode: 'discrete',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });

        it('should render custom discrete, fills with implicit start stops', async () => {
            const options: AgRadialGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: 100,
                bar: {
                    fills: [{ color: '#0f0' }, { color: '#ff0' }, { color: '#f00', stop: 50 }, { color: '#f0f' }],
                    fillMode: 'discrete',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });
    });

    describe('bigint values (AG-16608)', () => {
        // A value beyond Number.MAX_SAFE_INTEGER that would lose precision if narrowed to Number.
        const BIG_VALUE = 9_007_199_254_740_993n;
        const BIG_MAX = 9_007_199_254_740_999n;

        const renderAndGetCaption = async (overrides: Partial<AgRadialGaugeOptions>) => {
            const options: AgRadialGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: BIG_VALUE,
                scale: { min: 0n, max: BIG_MAX },
                ...overrides,
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.createGauge(options));
            await waitForChartStability(chart);
            return chart.series[0].getCaptionText();
        };

        it('should render with bigint value, scale and target without throwing', async () => {
            await renderAndGetCaption({ targets: [{ value: BIG_VALUE }] });
            await compare();
        });

        it('should render the bigint value label at full precision', async () => {
            const caption = await renderAndGetCaption({});
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with a bigint scale.interval.step without throwing', async () => {
            const caption = await renderAndGetCaption({
                scale: { min: 0n, max: BIG_MAX, interval: { step: 2_000_000_000_000_000n } },
            });
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with bigint scale.interval.values without throwing', async () => {
            const caption = await renderAndGetCaption({
                scale: {
                    min: 0n,
                    max: BIG_MAX,
                    interval: { values: [0n, 3_000_000_000_000_000n, 6_000_000_000_000_000n] },
                },
            });
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with bigint colour stop values without throwing', async () => {
            const caption = await renderAndGetCaption({
                bar: {
                    fills: [
                        { color: '#0f0', stop: 0n },
                        { color: '#ff0', stop: 4_000_000_000_000_000n },
                        { color: '#f00', stop: BIG_MAX },
                    ],
                    fillMode: 'discrete',
                },
            });
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with a bigint segmentation step without throwing', async () => {
            const caption = await renderAndGetCaption({
                segmentation: { enabled: true, interval: { step: 2_000_000_000_000_000n } },
            });
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with bigint segmentation values without throwing', async () => {
            const caption = await renderAndGetCaption({
                segmentation: {
                    enabled: true,
                    interval: { values: [3_000_000_000_000_000n, 6_000_000_000_000_000n] },
                },
            });
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should pass full-precision bigint tick values to the scale label formatter', async () => {
            const seenValues: AgNumericValue[] = [];
            const options: AgRadialGaugeOptions = {
                type: 'radial-gauge',
                value: BIG_VALUE,
                scale: {
                    min: 9_007_199_254_740_000n,
                    max: 9_007_199_254_741_000n,
                    label: {
                        formatter: ({ value }) => {
                            seenValues.push(value);
                            return `${value}`;
                        },
                    },
                },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.createGauge(options));
            await waitForChartStability(chart);

            expect(seenValues.length).toBeGreaterThan(0);
            expect(seenValues.every((value) => typeof value === 'bigint')).toBe(true);
            expect(
                seenValues.some((value) => typeof value === 'bigint' && value > BigInt(Number.MAX_SAFE_INTEGER))
            ).toBe(true);
        });
    });

    it('it should export image as expected (AG-12985)', async () => {
        const options: AgRadialGaugeOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.createGauge(options);
        await compareImageDataUrl();
    });
});
