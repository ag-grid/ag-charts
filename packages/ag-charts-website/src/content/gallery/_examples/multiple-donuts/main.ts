import { AgChartOptions, AgCharts, AgPieSeriesTooltipRendererParams } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();
const tooltip = {
    renderer({ datum, angleKey }: AgPieSeriesTooltipRendererParams<any>) {
        return { content: `${datum[angleKey]} Litres` };
    },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Water Usage',
    },
    subtitle: {
        text: 'Daily Water Usage Per Person Per Day In Litres',
    },
    series: [
        {
            data: data['countries'],
            type: 'donut',
            angleKey: 'value',
            sectorLabelKey: 'country',
            outerRadiusRatio: 1,
            innerRadiusRatio: 0.6,
            cornerRadius: 4,
            fillOpacity: 0.9,
            tooltip,
        },
        {
            data: data['continents'],
            type: 'donut',
            angleKey: 'value',
            sectorLabelKey: 'continent',
            outerRadiusRatio: 0.5,
            innerRadiusRatio: 0.1,
            cornerRadius: 4,
            tooltip,
        },
    ],
};

AgCharts.create(options);
