// Source: https://en.wikipedia.org/wiki/List_of_busiest_passenger_flight_routes
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const numberFormatter = new Intl.NumberFormat('en-US', { useGrouping: true });

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Busiest International Flight Routes',
    },
    subtitle: {
        text: 'Annual passenger traffic between major airports',
    },
    footnote: {
        text: 'Source: Wikipedia - List of busiest passenger flight routes',
    },
    data: [
        { from: 'HKG', to: 'TPE', passengers: 7566000 },
        { from: 'CAI', to: 'JED', passengers: 5145000 },
        { from: 'DXB', to: 'LHR', passengers: 3192195 },
        { from: 'LHR', to: 'JFK', passengers: 3078693 },
        { from: 'SIN', to: 'CGK', passengers: 3064213 },
        { from: 'BKK', to: 'HKG', passengers: 2789792 },
        { from: 'KUL', to: 'SIN', passengers: 2755411 },
        { from: 'JFK', to: 'CDG', passengers: 2636491 },
        { from: 'LHR', to: 'DXB', passengers: 2338127 },
        { from: 'LAX', to: 'LHR', passengers: 1645002 },
    ],
    theme: {
        palette: {
            fills: [
                '#4E79A7',
                '#F28E2C',
                '#E15759',
                '#76B7B2',
                '#59A14F',
                '#EDC949',
                '#AF7AA1',
                '#FF9DA7',
                '#9C755F',
                '#BAB0AB',
            ],
            strokes: [
                '#3D5F84',
                '#C4711C',
                '#B34547',
                '#5E928E',
                '#467F3E',
                '#BDA03A',
                '#8C6180',
                '#CC7D85',
                '#7A5D4C',
                '#948A88',
            ],
        },
    },
    tooltip: {
        enabled: true,
        position: {
            anchorTo: 'pointer',
            placement: ['right', 'left', 'top', 'bottom'],
            xOffset: 10,
            yOffset: -10,
        },
    },
    series: [
        {
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'passengers',
            sizeName: 'Passengers',
            node: {
                width: 45,
                strokeWidth: 2,
                strokeOpacity: 0.8,
            },
            link: {
                fillOpacity: 0.4,
                strokeOpacity: 0.7,
                strokeWidth: 1,
                itemStyler: ({ datum, sizeKey }) => {
                    const value = Number(datum[sizeKey!]);
                    const maxValue = 7566000;
                    const minValue = 1645002;
                    const numberValue = !isNaN(value) ? value : 0;
                    const opacity = 0.2 + 0.6 * ((numberValue - minValue) / (maxValue - minValue));
                    return {
                        fillOpacity: opacity,
                        strokeOpacity: opacity + 0.2,
                    };
                },
            },
            label: {
                spacing: 12,
            },
            tooltip: {
                renderer: (params) => {
                    const { datum, sizeKey, sizeName } = params;
                    const value = datum[sizeKey!];
                    return {
                        data: [
                            { label: 'Route', value: `${datum.from} → ${datum.to}` },
                            { label: sizeName!, value: numberFormatter.format(value) },
                            { label: 'Traffic', value: `${(value / 1000000).toFixed(2)}M passengers/year` },
                        ],
                    };
                },
            },
        },
    ],
};

AgCharts.create(options);
