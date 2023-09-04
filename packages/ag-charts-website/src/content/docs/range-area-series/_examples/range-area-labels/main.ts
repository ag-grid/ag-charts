import { AgChartOptions, AgEnterpriseCharts, AgRangeAreaSeriesLabelFormatterParams } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Range Area Labels',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
            marker: {
                size: 5,
            },
            label: {
                formatter: ({ itemId, value }: AgRangeAreaSeriesLabelFormatterParams) => {
                    return `${itemId === 'low' ? 'L' : 'H'}: ${value.toFixed(0)}`;
                }
            }
        },
    ],
};

AgEnterpriseCharts.create(options);
