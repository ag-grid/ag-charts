import { type AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { waitForChartStability } from './utils';

type TSeries = {
    legendItemName?: string;
};
type TestLegendItemNameOptions = {
    prepare: (opts: AgChartOptions) => AgChartOptions;
    chartOptions: AgChartOptions & { series: TSeries[] };
};

export async function testLegendItemName(testOptions: TestLegendItemNameOptions) {
    const { prepare, chartOptions } = testOptions;

    expect(chartOptions.series.length).toBe(3);
    chartOptions.series[0].legendItemName = 'Alfa';
    chartOptions.series[1].legendItemName = 'Bravo';
    chartOptions.series[2].legendItemName = 'Charlie';

    const chart = AgCharts.create(prepare(chartOptions));
    await waitForChartStability(chart);

    const a11yButtons = Array.from(document.querySelectorAll('.ag-charts-proxy-legend-toolbar button'));
    expect(a11yButtons.at(0)?.textContent).toBe('Alfa, Legend item 1 of 3');
    expect(a11yButtons.at(1)?.textContent).toBe('Bravo, Legend item 2 of 3');
    expect(a11yButtons.at(2)?.textContent).toBe('Charlie, Legend item 3 of 3');
    expect(a11yButtons.length).toBe(3);

    return chart;
}
