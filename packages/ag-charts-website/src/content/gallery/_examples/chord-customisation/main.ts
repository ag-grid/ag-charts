// Source: https://en.wikipedia.org/wiki/List_of_busiest_passenger_flight_routes
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const numberFormatter = new Intl.NumberFormat('en-US', { useGrouping: true });

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Busiest Flights',
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
    series: [
        {
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'passengers',
            sizeName: 'Passengers',
            node: {
                width: 40,
                strokeWidth: 1,
            },
            link: {
                fill: '#888',
                fillOpacity: 0.225,
                stroke: '#888',
                strokeOpacity: 0.55,
                strokeWidth: 1,
            },
            label: {
                fontWeight: 'bold',
                color: '#888',
                spacing: 10,
            },
        },
    ],
};

AgCharts.create(options);
