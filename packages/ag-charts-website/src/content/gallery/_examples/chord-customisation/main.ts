// Source: https://en.wikipedia.org/wiki/List_of_busiest_passenger_flight_routes
import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ChordSeriesModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([ChordSeriesModule]);
const numberFormatter = new Intl.NumberFormat('en-US', { useGrouping: true });

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Busiest International Flight Routes',
    },
    subtitle: {
        text: 'Annual passenger traffic between major airports',
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
    tooltip: {
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
            },
            link: {
                fillOpacity: 0.4,
                strokeOpacity: 0.7,
                strokeWidth: 1,
                itemStyler: ({ datum, sizeKey }) => {
                    const value = Number(datum[sizeKey!]);
                    const maxValue = 7566000;
                    const minValue = 1645002;
                    const numberValue = !Number.isNaN(value) ? value : 0;
                    const opacity = 0.5 + 0.6 * ((numberValue - minValue) / (maxValue - minValue));
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
                renderer: ({ datum, size, sizeName }) => {
                    const passengers = { label: sizeName ?? '', value: numberFormatter.format(size) };
                    if (!datum) return { data: [passengers] };
                    return {
                        data: [
                            { label: 'Route', value: `${datum.from} → ${datum.to}` },
                            { label: 'Traffic', value: `${(size / 1e6).toFixed(2)}M passengers/year` },
                        ],
                    };
                },
            },
        },
    ],
};

AgCharts.create(options);
