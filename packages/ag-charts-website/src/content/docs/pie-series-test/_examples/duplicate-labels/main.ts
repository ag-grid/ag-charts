import { AgCharts, AgChartOptions } from 'ag-charts-enterprise';

function getData() {
    return [
        { label: 'Android', value: 56.9, value2: 'duplicate' },
        { label: 'iOS', value: 56.9, value2: 'duplicate' },
    ];
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'value2',
            sectorLabelKey: 'value2',
            sectorLabel: {
                color: 'white',
                fontWeight: 'bold',
            },
        },
    ],
};

AgCharts.create(options);
