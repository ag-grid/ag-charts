import {
    AgCharts,
    AgQuadrantChartOptions,
    AgSeriesAreaBackgroundRegionLabelPosition,
    ModuleRegistry,
    QuadrantChartModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Product Portfolio Review' },
    subtitle: { text: 'Year-on-year revenue growth against change in gross margin' },
    xKey: 'revenueGrowth',
    xName: 'Revenue growth',
    yKey: 'marginChange',
    yName: 'Margin change',
    labelKey: 'category',
    labelName: 'Category',
    xAxis: { title: { text: 'Revenue growth (%)' } },
    yAxis: { title: { text: 'Margin change (% points)' } },
    regions: {
        topLeft: { label: { text: 'Shrinking, Wider Margins' } },
        topRight: { label: { text: 'Growing, Wider Margins' } },
        bottomLeft: { label: { text: 'Shrinking, Thinner Margins' } },
        bottomRight: { label: { text: 'Growing, Thinner Margins' } },
    },
    tooltip: {
        renderer: (params) => {
            return {
                data: [
                    { label: 'Category', value: params.datum.category },
                    { label: 'Revenue growth', value: `${params.datum.revenueGrowth}%` },
                    { label: 'Margin change', value: `${params.datum.marginChange}%` },
                ],
            };
        },
    },
};

const chart = AgCharts.createQuadrantChart(options);

function updateLabelPosition(position: AgSeriesAreaBackgroundRegionLabelPosition) {
    options.regions!.topLeft!.label!.position = position;
    options.regions!.topRight!.label!.position = position;
    options.regions!.bottomLeft!.label!.position = position;
    options.regions!.bottomRight!.label!.position = position;
    chart.update(options);
}
