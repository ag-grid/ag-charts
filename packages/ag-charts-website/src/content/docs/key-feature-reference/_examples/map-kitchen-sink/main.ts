import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getCurrencyData } from './data';
import { cables, capitals, topology } from './topology';

const currencyLayers: Record<string, { title: string; fill: string }> = {
    euro: { title: 'Euro', fill: '#3F51B5' },
    dollar: { title: 'Dollar', fill: '#8BC34A' },
    franc: { title: 'Franc', fill: '#F44336' },
    pound: { title: 'Pound', fill: '#2196F3' },
    dinar: { title: 'Dinar', fill: '#9C27B0' },
    peso: { title: 'Peso', fill: '#FFC107' },
    rupee: { title: 'Rupee', fill: '#FF9800' },
    rial: { title: 'Rial', fill: '#009688' },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    topology,
    series: [
        {
            type: 'map-shape-background',
            fillOpacity: 0,
            stroke: '#66879933',
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            title: 'Other Currency',
            data: topology.features
                .map((t: any) => ({ name: t.properties.name }))
                .filter(({ name }: { name: string }) => currencyLayers[name] == null),
            idKey: 'name',
            fill: '#668799',
            fillOpacity: 0.4,
            highlightStyle: {
                item: {
                    fillOpacity: 1,
                },
            },
        },
        ...Object.entries(currencyLayers).map(([currency, { title, fill }]) => ({
            type: 'map-shape' as const,
            legendItemName: 'Shapes',
            showInLegend: false,
            title,
            idKey: 'name',
            data: getCurrencyData(currency),
            fill,
            fillOpacity: 0.4,
            highlightStyle: {
                item: {
                    fillOpacity: 1,
                },
            },
        })),
        {
            type: 'map-line',
            topology: cables,
            legendItemName: 'Lines',
            data: cables.features.map((t: any) => {
                return { name: t.properties.name };
            }),
            idKey: 'name',
            title: 'Submarine Cables',
            stroke: '#546E7A',
            strokeWidth: 0.5,
        },
        {
            type: 'map-marker',
            topology: capitals,
            legendItemName: 'Markers',
            showInLegend: false,
            data: capitals.features
                .map((t: any) => {
                    return { name: t.properties.city };
                })
                .filter(({ name }: any) => name != null),
            idKey: 'name',
            title: 'Capital City',
            topologyIdKey: 'city',
            size: 4,
            fill: '#546E7A',
            fillOpacity: 1,
            strokeWidth: 0,
        },
        {
            type: 'map-marker',
            legendItemName: 'Markers',
            title: 'Stock Exchange',
            data: [
                { name: 'New York', lat: 40.707, long: -74.011 },
                { name: 'Tokyo', lat: 35.681, long: 139.777 },
                { name: 'London', lat: 51.515, long: -0.09 },
                { name: 'Hong Kong', lat: 22.32, long: 114.171 },
                { name: 'India', lat: 28.624, long: 77.214 },
            ],
            latitudeKey: 'lat',
            longitudeKey: 'long',
            labelKey: 'name',
            labelName: 'Name',
            label: { enabled: false },
            shape: 'pin',
            size: 40,
            fill: '#EF5452',
            fillOpacity: 1,
            strokeWidth: 0,
        },
    ],
    legend: {
        enabled: true,
        item: {
            showSeriesStroke: true,
        },
    },
};

AgCharts.create(options);
