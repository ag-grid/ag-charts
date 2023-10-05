import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartInstance } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgEnterpriseCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

const SERIES_CANADA = {
    data: [
        { month: 'Jan', temperature: 12.5, temperatureLower: 10.0, temperatureUpper: 15.0 },
        { month: 'Feb', temperature: 13.0, temperatureLower: 11.5, temperatureUpper: 15.5 },
        { month: 'Mar', temperature: 15.5, temperatureLower: 13.0, temperatureUpper: 18.0 },
        { month: 'Apr', temperature: 18.0, temperatureLower: 16.5, temperatureUpper: 19.5 },
        { month: 'May', temperature: 21.5, temperatureLower: 19.0, temperatureUpper: 24.0 },
        { month: 'Jun', temperature: 24.0, temperatureLower: 22.5, temperatureUpper: 26.0 },
        { month: 'Jul', temperature: 26.5, temperatureLower: 24.0, temperatureUpper: 29.0 },
        { month: 'Aug', temperature: 25.0, temperatureLower: 22.5, temperatureUpper: 28.0 },
        { month: 'Sep', temperature: 23.5, temperatureLower: 21.0, temperatureUpper: 27.0 },
        { month: 'Oct', temperature: 20.0, temperatureLower: 17.5, temperatureUpper: 22.5 },
        { month: 'Nov', temperature: 16.5, temperatureLower: 14.0, temperatureUpper: 19.0 },
        { month: 'Dec', temperature: 13.0, temperatureLower: 11.5, temperatureUpper: 15.5 },
    ],
    xKey: 'month',
    yKey: 'temperature',
    yName: 'Canada',
    errorBar: { yLowerKey: 'temperatureLower', yUpperKey: 'temperatureUpper' },
};

const SERIES_AUSTRALIA = {
    data: [
        { month: 'Jan', temperature: 8.0, temperatureLower: 6.5, temperatureUpper: 10.0 },
        { month: 'Feb', temperature: 8.5, temperatureLower: 7.0, temperatureUpper: 10.5 },
        { month: 'Mar', temperature: 10.0, temperatureLower: 8.5, temperatureUpper: 12.0 },
        { month: 'Apr', temperature: 12.0, temperatureLower: 10.5, temperatureUpper: 13.5 },
        { month: 'May', temperature: 14.5, temperatureLower: 13.0, temperatureUpper: 16.0 },
        { month: 'Jun', temperature: 16.5, temperatureLower: 15.0, temperatureUpper: 18.0 },
        { month: 'Jul', temperature: 18.0, temperatureLower: 16.5, temperatureUpper: 19.5 },
        { month: 'Aug', temperature: 17.0, temperatureLower: 15.5, temperatureUpper: 18.5 },
        { month: 'Sep', temperature: 15.5, temperatureLower: 14.0, temperatureUpper: 17.0 },
        { month: 'Oct', temperature: 12.5, temperatureLower: 11.0, temperatureUpper: 14.0 },
        { month: 'Nov', temperature: 10.0, temperatureLower: 8.5, temperatureUpper: 11.5 },
        { month: 'Dec', temperature: 8.5, temperatureLower: 7.0, temperatureUpper: 10.0 },
    ],
    xKey: 'month',
    yKey: 'temperature',
    yName: 'Australia',
    visible: true,
    errorBar: { yLowerKey: 'temperatureLower', yUpperKey: 'temperatureUpper' },
};

const SERIES_BOYLESLAW = {
    type: 'scatter',
    data: [
        { volume: 0.5, volumeLower: 0.45, volumeUpper: 0.55, pressure: 9.5, pressureLower: 10.3, pressureUpper: 8.7 },
        { volume: 1.0, volumeLower: 0.9, volumeUpper: 1.1, pressure: 8.1, pressureLower: 8.9, pressureUpper: 7.4 },
        { volume: 1.5, volumeLower: 1.35, volumeUpper: 1.65, pressure: 6.8, pressureLower: 7.5, pressureUpper: 6.2 },
        { volume: 2.0, volumeLower: 1.8, volumeUpper: 2.2, pressure: 5.5, pressureLower: 5.9, pressureUpper: 5.0 },
        { volume: 2.5, volumeLower: 2.25, volumeUpper: 2.75, pressure: 4.2, pressureLower: 4.7, pressureUpper: 3.8 },
        { volume: 3.0, volumeLower: 2.7, volumeUpper: 3.3, pressure: 3.1, pressureLower: 3.5, pressureUpper: 2.8 },
        { volume: 3.5, volumeLower: 3.15, volumeUpper: 3.85, pressure: 2.0, pressureLower: 2.3, pressureUpper: 1.8 },
        { volume: 4.0, volumeLower: 3.6, volumeUpper: 4.4, pressure: 1.2, pressureLower: 1.4, pressureUpper: 1.1 },
    ],
    xKey: 'volume',
    yKey: 'pressure',
    errorBar: {
        xLowerKey: 'volumeLower',
        xUpperKey: 'volumeUpper',
        yLowerKey: 'pressureLower',
        yUpperKey: 'pressureUpper',
    },
};

describe('ErrorBars', () => {
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
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const opts = prepareEnterpriseTestOptions({});

    it('should render 1 line series as expected', async () => {
        chart = AgEnterpriseCharts.create({ ...opts, series: [{ type: 'line', ...SERIES_CANADA }] });
        await compare();
    });

    it('should render 1 bar series as expected', async () => {
        chart = AgEnterpriseCharts.create({ ...opts, series: [{ type: 'bar', ...SERIES_CANADA }] });
        await compare();
    });

    it('should render 2 line series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                { type: 'line', ...SERIES_CANADA },
                { type: 'line', ...SERIES_AUSTRALIA },
            ],
        });
        await compare();
    });

    it('should render 2 bar series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                { type: 'bar', ...SERIES_CANADA },
                { type: 'bar', ...SERIES_AUSTRALIA },
            ],
        });
        await compare();
    });

    it('should render both scatter axes as expected', async () => {
        chart = AgEnterpriseCharts.create({ ...opts, series: [SERIES_BOYLESLAW] });
        await compare();
    });
});
