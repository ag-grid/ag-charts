import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgLinearGaugeLabelPlacement, AgLinearGaugeOptions } from 'ag-charts-community';
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

describe('LinearGaugeSeries', () => {
    setupMockConsole();
    let chart: any;

    const EXAMPLE_OPTIONS: AgLinearGaugeOptions = {
        ...(GALLERY_EXAMPLES.SIMPLE_LINEAR_GAUGE_EXAMPLE.options as any),
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

    describe('basic chart', () => {
        it('should render a gauge', async () => {
            const options: AgLinearGaugeOptions = { ...EXAMPLE_OPTIONS };
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

                const options: AgLinearGaugeOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.createGauge(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    describe.each(['horizontal', 'vertical'] as const)('series labels (%s)', (direction) => {
        it.each([
            'inside-start',
            'outside-start',
            'inside-end',
            'outside-end',
            'inside',
            'bar-inside',
            'bar-inside-end',
            'bar-outside-end',
            'bar-end',
        ] as AgLinearGaugeLabelPlacement[])('should render label at placement %s', async (placement) => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                direction,
                label: {
                    enabled: true,
                    placement,
                    color: '#888',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });

        it.each([
            'inside-start',
            'outside-start',
            'inside-end',
            'outside-end',
            'inside',
            'bar-inside',
            'bar-inside-end',
            'bar-outside-end',
            'bar-end',
        ] as AgLinearGaugeLabelPlacement[])('should render multi-line labels at placement %s', async (placement) => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                direction,
                label: {
                    text: 'Hello\nWorld!',
                    enabled: true,
                    placement,
                    color: '#888',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });
    });

    describe('fills', () => {
        it('should render custom discrete, fills with explicit stops', async () => {
            const options: AgLinearGaugeOptions = {
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
            const options: AgLinearGaugeOptions = {
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
            const options: AgLinearGaugeOptions = {
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
            const options: AgLinearGaugeOptions = {
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
});
