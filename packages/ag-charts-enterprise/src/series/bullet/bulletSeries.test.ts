import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartInstance } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    deproxy,
    extractImageData,
    hoverAction,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgEnterpriseCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';
import type { BulletSeries } from './bulletSeries';

expect.extend({ toMatchImageSnapshot });

describe('BulletSeries', () => {
    let chart: AgChartInstance | undefined;
    const ctx = setupMockCanvas();

    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.warn = jest.fn();
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        // eslint-disable-next-line no-console
        expect(console.warn).not.toBeCalled();
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    const getTooltipHtml = (): string => {
        const series = chart['series'][0];
        const datum = chart['series'][0].contextNodeData[0].nodeData[0];
        return series.getTooltipHtml(datum);
    };

    const opts = prepareEnterpriseTestOptions({});

    it('should render simple bullet', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    type: 'bullet',
                    data: [{ income: 11, objective: 7 }],
                    valueKey: 'income',
                },
            ],
        });
        await compare();
    });

    it('should render a vertical bullet by default', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    type: 'bullet',
                    data: [{ income: 11, objective: 7 }],
                    valueKey: 'income',
                    valueName: 'Actual income',
                    targetKey: 'objective',
                    targetName: 'Target income',
                    colorRanges: [{ color: 'red', stop: 5 }, { color: 'yellow', stop: 8 }, { color: 'green' }],
                },
            ],
        });
        await compare();
    });

    it('should render a horizontal bullet as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    type: 'bullet',
                    data: [{ income: 11, objective: 7 }],
                    valueKey: 'income',
                    valueName: 'Actual income',
                    targetKey: 'objective',
                    targetName: 'Target income',
                    direction: 'horizontal',
                    colorRanges: [{ color: 'red', stop: 5 }, { color: 'yellow', stop: 8 }, { color: 'green' }],
                },
            ],
        });
        await compare();
    });

    it('should clip everything to scale.max', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    type: 'bullet',
                    data: [{ income: 11, objective: 7 }],
                    scale: { max: 5 },
                    valueKey: 'income',
                    targetKey: 'objective',
                    colorRanges: [{ color: 'yellow', stop: 45 }],
                },
            ],
        });
        await compare();
    });

    it('should extend final color to scale.max', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    type: 'bullet',
                    data: [{ income: 11, objective: 7 }],
                    scale: { max: 20 },
                    valueKey: 'income',
                    targetKey: 'objective',
                    colorRanges: [{ color: 'red', stop: 5 }, { color: 'yellow', stop: 8 }, { color: 'green' }],
                },
            ],
        });
        await compare();
    });

    test('tooltip valueKey only', async () => {
        chart = deproxy(
            AgEnterpriseCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        valueKey: 'income',
                        data: [{ income: 11, objective: 7 }],
                    },
                ],
            })
        );
        await waitForChartStability(chart);

        const tooltipHtml = getTooltipHtml();
        expect(tooltipHtml).toEqual('<div class="ag-chart-tooltip-content"><b>income</b>: 11.00</div>');
    });

    test('tooltip no names', async () => {
        chart = deproxy(
            AgEnterpriseCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        valueKey: 'income',
                        targetKey: 'objective',
                        data: [{ income: 11, objective: 7 }],
                    },
                ],
            })
        );
        await waitForChartStability(chart);

        const tooltipHtml = getTooltipHtml();
        expect(tooltipHtml).toEqual(
            '<div class="ag-chart-tooltip-content"><b>income</b>: 11.00<br/><b>objective</b>: 7.00</div>'
        );
    });

    test('tooltip with names', async () => {
        chart = deproxy(
            AgEnterpriseCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        valueKey: 'income',
                        valueName: 'Actual income',
                        targetKey: 'objective',
                        targetName: 'Target income',
                        data: [{ income: 11, objective: 7 }],
                    },
                ],
            })
        );
        await waitForChartStability(chart);

        const tooltipHtml = getTooltipHtml();
        expect(tooltipHtml).toEqual(
            '<div class="ag-chart-tooltip-content"><b>Actual income</b>: 11.00<br/><b>Target income</b>: 7.00</div>'
        );
    });
});
