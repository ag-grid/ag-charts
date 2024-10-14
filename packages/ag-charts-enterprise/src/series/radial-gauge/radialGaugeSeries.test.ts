import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgRadialGaugeOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

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
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const snapshot = async () => {
        await waitForChartStability(chart);

        return ctx.nodeCanvas?.toBuffer('raw');
    };

    const compareImageDataUrl = async () => {
        await waitForChartStability(chart);
        const reference = await snapshot();

        const canvasCount = ctx.getActiveCanvasInstances().length;

        const imageURL = await chart.getImageDataURL();
        const imagePNGData = Buffer.from(imageURL.split(',')[1], 'base64');
        expect(imagePNGData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        const imageRaw = ctx.getActiveCanvasInstances()[canvasCount];
        expect(imageRaw.toBuffer('raw')).toMatchImage(reference);
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

    it('it should export image as expected (AG-12985)', async () => {
        const options: AgRadialGaugeOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.createFinancialChart(options);
        await compareImageDataUrl();
    });
});
