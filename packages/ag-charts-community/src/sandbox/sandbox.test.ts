import { describe } from '@jest/globals';

import { DATA_MEAN_SEA_LEVEL } from '../chart/test/data';
import { createTestInstance } from './util/testUtil';

describe('Sandbox tests', () => {
    it('Should render `bar` series correctly', async () => {
        const chartInstance = createTestInstance({
            title: {
                text: 'Mean Sea Level (mm)',
            },
            data: DATA_MEAN_SEA_LEVEL,
            series: [
                {
                    type: 'bar',
                    xKey: 'time',
                    yKey: 'mm',
                    showInLegend: false,
                },
            ],
            axes: [
                { type: 'category', position: 'bottom', nice: false },
                { type: 'number', position: 'left' },
            ],
        });
        await chartInstance.chart.waitForUpdate();
        chartInstance.update({ title: { text: 'Changed text' } });
        await chartInstance.chart.waitForUpdate();
        expect(chartInstance.options.fullOptions.title.text).toBe('Changed text');
    });
});
