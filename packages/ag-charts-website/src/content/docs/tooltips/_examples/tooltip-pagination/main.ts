import {
    AgBubbleSeriesTooltipRendererParams,
    AgCartesianChartOptions,
    AgCharts,
    LegendModule,
} from 'ag-charts-community';
import { BubbleSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Most Populous Cities',
    },
    footnote: {
        text: 'Source: Simple Maps',
    },
    series: [
        {
            type: 'bubble',
            title: 'Most populous cities',
            xKey: 'lon',
            xName: 'Longitude',
            yKey: 'lat',
            yName: 'Latitude',
            sizeKey: 'population',
            sizeName: 'Population',
            labelKey: 'city',
            labelName: 'City',
            maxSize: 50,
            tooltip: {
                renderer: ({ datum }) => ({ title: datum.city }),
            },
        },
    ],
    tooltip: {
        pagination: true,
    },
};

const chart = AgCharts.create(options);

export function builtinRenderer() {
    options.series![0]!.tooltip!.renderer = ({ datum }: AgBubbleSeriesTooltipRendererParams<DataType>) => ({
        title: datum.city,
    });
    chart.update(options);
}

export function customRenderer() {
    options.series![0]!.tooltip!.renderer = (params: AgBubbleSeriesTooltipRendererParams<DataType>) => {
        const { datum } = params;

        const paging = params.pagination
            ? `<div>${params.pagination.currentPage} / ${params.pagination.totalPages}</div>`
            : '';

        return `
                <div style="padding: 8px; font-family: sans-serif;">
                    <div style="font-weight: bold; margin-bottom: 4px;">
                        ${datum.city}
                    </div>
                    <div>Population: ${datum.population.toLocaleString()}</div>
                    <div>Lat: ${datum.lat}</div>
                    <div>Lon: ${datum.lon}</div>
                    ${paging}
                </div>
            `;
    };
    chart.update(options);
}
