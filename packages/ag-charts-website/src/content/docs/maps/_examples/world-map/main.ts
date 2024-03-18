import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { currencyData, getCurrencyData } from './data';
import { cables, capitals, topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    background: { fill: 'rgb(246,255,255)' },
    topology,
    series: [
        {
            type: 'map-shape-background',
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            title: 'Other Currency',
            fillOpacity: 0.7,
            stroke: 'black',
            data: topology.features.map((t) => {
                return { name: t.properties.name };
            }),
            idKey: 'name',
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            showInLegend: false,
            fillOpacity: 0.7,
            stroke: 'black',
            title: 'Dollar',
            idKey: 'name',
            data: getCurrencyData('dollar'),
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            showInLegend: false,
            fillOpacity: 0.7,
            stroke: 'black',
            title: 'Euro',
            idKey: 'name',
            data: getCurrencyData('euro'),
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            showInLegend: false,
            fillOpacity: 0.7,
            stroke: 'black',
            title: 'Franc',
            idKey: 'name',
            data: getCurrencyData('franc'),
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            showInLegend: false,
            fillOpacity: 0.7,
            stroke: 'black',
            title: 'Pound',
            idKey: 'name',
            data: getCurrencyData('pound'),
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            showInLegend: false,
            fillOpacity: 0.7,
            stroke: 'black',
            title: 'Dinar',
            idKey: 'name',
            data: getCurrencyData('dinar'),
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            showInLegend: false,
            fillOpacity: 0.7,
            stroke: 'black',
            title: 'Peso',
            idKey: 'name',
            data: getCurrencyData('peso'),
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            showInLegend: false,
            fillOpacity: 0.7,
            stroke: 'black',
            title: 'Rupee',
            idKey: 'name',
            data: getCurrencyData('rupee'),
        },
        {
            type: 'map-shape',
            legendItemName: 'Shapes',
            showInLegend: false,
            fillOpacity: 0.7,
            stroke: 'black',
            title: 'Rial',
            idKey: 'name',
            data: getCurrencyData('rial'),
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
            fillOpacity: 1,
            stroke: 'black',
        },
        {
            type: 'map-line',
            topology: cables,
            legendItemName: 'Lines',
            data: cables.features.map((t) => {
                return { name: t.properties.name };
            }),
            idKey: 'name',
            title: 'Submarine Cables',
        },
        {
            type: 'map-marker',
            topology: capitals,
            legendItemName: 'Markers',
            showInLegend: false,
            data: capitals.features.map((t) => {
                return { name: t.properties.city };
            }),
            idKey: 'name',
            title: 'Capital City',
            topologyIdKey: 'city',
            fillOpacity: 1,
            fill: 'orange',
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
