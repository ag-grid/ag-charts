import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, getData, selectedMonths } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Number of Cars Sold',
    },
    subtitle: {
        text: '(click a marker to toggle its selected state)',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'units',
            listeners: {
                seriesNodeClick: (event) => {
                    toggleDatum(event.datum);
                },
            },
            marker: {
                size: 16,
                itemStyler: (params) => {
                    // Use a different size and color for selected nodes.
                    if (params.datum.selected) {
                        return {
                            fill: 'red',
                            size: 24,
                        };
                    }
                },
            },
            cursor: 'pointer',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

const chart = AgCharts.create(options);

function toggleDatum(datum?: DataType) {
    if (datum == null) {
        selectedMonths.clear();
    } else if (selectedMonths.has(datum.month)) {
        selectedMonths.delete(datum.month);
    } else {
        selectedMonths.add(datum.month);
    }

    options.data = getData();
    chart.update(options);
}
