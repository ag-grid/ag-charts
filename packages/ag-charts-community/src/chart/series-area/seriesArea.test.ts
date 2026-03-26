import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { SIMPLE_COLUMN_CHART_EXAMPLE, SIMPLE_PIE_CHART_EXAMPLE } from '../test/examples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const SERIES_AREA_OPTIONS = {
    seriesArea: {
        border: {
            stroke: 'red',
            strokeOpacity: 0.5,
            strokeWidth: 4,
        },
        cornerRadius: 8,
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
    },
};

describe('SeriesArea', () => {
    setupMockConsole();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
    };

    describe('cartesian', () => {
        it('should render as expected', async () => {
            chart = AgCharts.create({
                ...SIMPLE_COLUMN_CHART_EXAMPLE,
                ...SERIES_AREA_OPTIONS,
            });
            await compare({ ...IMAGE_SNAPSHOT_DEFAULTS, customDiffConfig: { threshold: 0.75 } });
        });
    });

    describe('polar', () => {
        it('should render as expected', async () => {
            chart = AgCharts.create({
                ...SIMPLE_PIE_CHART_EXAMPLE,
                ...SERIES_AREA_OPTIONS,
            });
            await compare();
        });
    });
});
