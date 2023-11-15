import { AgCharts, AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    width: 600,
    data: [
        { label: 'USA', value: 56.9 },
        { label: 'UK', value: 22.5 },
        { label: 'China', value: 6.8 },
        { label: 'Russia', value: 8.5 },
        { label: 'India', value: 2.6 },
        { label: 'Germany', value: 18.2 },
        { label: 'France', value: 12.5 },
        { label: 'Canada', value: 3.9 },
        { label: 'Spain', value: 7.9 },
        { label: 'South Africa', value: 21.9 },
        { label: 'Portugal', value: 7.4 },
        { label: 'Netherlands', value: 4.7 },
        { label: 'Finland', value: 3.9 },
        { label: 'Sweden', value: 3.3 },
        { label: 'Norway', value: 3.2 },
        { label: 'Greece', value: 1.9 },
        { label: 'Italy', value: 2.5 },
    ],
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
            strokeWidth: 3,
            calloutLabel: {
                enabled: false,
            },
        },
    ],
};

var chart = AgCharts.create(options);

function updateWidth(event: any) {
    var value = +event.target.value;

    options.width = value;
    AgCharts.update(chart, options);

    document.getElementById('sliderValue')!.innerHTML = String(value);
}
