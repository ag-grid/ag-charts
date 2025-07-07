import { AgCartesianChartOptions, AgCharts, AgChartsLabelStylerParams } from 'ag-charts-community';

type DataType = { month: string; value: number };
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Data labels box options',
    },
    subtitle: {
        text: 'backgroundColor, borderColor, borderRadius, borderWidth, padding and shadow',
    },
    data: [
        { month: 'Jan', value: 29.9 },
        { month: 'Feb', value: 71.5 },
        { month: 'Mar', value: 106.4 },
        { month: 'Apr', value: 129.2 },
        { month: 'May', value: 144.0 },
        { month: 'Jun', value: 178.0 },
        { month: 'Jul', value: 135.6 },
        { month: 'Aug', value: 148.5 },
        { month: 'Sep', value: 216.4 },
        { month: 'Oct', value: 194.1 },
        { month: 'Nov', value: 95.6 },
        { month: 'Dec', value: 54.4 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'value',
            label: {
                itemStyler: (params: AgChartLabelStylerParams<DataType, never>) => {
                    if (params.datum.month === 'Sep') {
                        return {
                            border: {
                                stroke: 'red',
                                strokeWidth: 6,
                            },
                            padding: 15,
                            shadow: true,
                            fontWeight: 'bold',
                        };
                    }
                },
                enabled: true,
                cornerRadius: 8,
                // fill: 'rgba(252, 255, 197)',
                fill: {
                    type: 'gradient',
                    colorStops: [
                        { color: '#70C1FF', stop: 0.1 },
                        { color: '#FFD86F', stop: 0.3 },
                        { color: '#FF9A60', stop: 0.5 },
                        { color: '#D16BA5' },
                    ],
                },
                fillOpacity: 0.7,
                padding: 10,
                border: {
                    stroke: '#AAA',
                    strokeWidth: 3,
                    strokeOpacity: 0.2,
                },
                // yOffset: -6,
            },
        },
    ],
};

AgCharts.create(options);
