import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-charts-community';
import { AngleCategoryAxisModule, RadialColumnSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';


ModuleRegistry.registerModules([AngleCategoryAxisModule, RadialColumnSeriesModule, RadiusNumberAxisModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Product Revenue',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'product',
            fillOpacity: 0.8,
            tooltip: {
                renderer: (params) => {
                    const [day, month] = params.datum.quarter.split(' ');
                    const key = day === '1' ? `${month}` : `Mid-${month}`;
                    return {
                        heading: day === '1' ? `${month}` : `Mid-${month}`,
                    };
                },
            },
        },
    ],
    axes: {
        radius: {
            type: 'radius-number',
            innerRadiusRatio: 0.5,
            interval: { step: 0.5 },
            label: {
                enabled: false,
            },
        },
        angle: {
            type: 'angle-category',
            paddingInner: 0.4,
            label: {
                formatter: ({ value }) => (value.includes('1 ') ? value.substring(2) : ''),
                spacing: 0,
            },
            gridLine: {
                enabled: true,
            },
        },
    },
};

AgCharts.create(options);
