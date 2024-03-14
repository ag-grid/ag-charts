import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { londonBoroughData, otherCountiesData, tubeData } from './data';
import { londonBoroughTopology, otherCountiesTopology, tubeTopology } from './topology';

const sizeDomain = [0, 97.92];
const strokeWidth = 2;
const lineDash = [4, 10];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'London Underground',
    },
    subtitle: {
        text: 'Tube Lines',
        spacing: 10,
    },
    topology: tubeTopology,
    series: [
        {
            type: 'map-shape',
            topology: londonBoroughTopology,
            data: londonBoroughData,
            idKey: 'name',
            topologyIdKey: 'name',
            labelKey: 'name',
            fillOpacity: 0.2,
            strokeWidth: 2,
            label: {
                fontWeight: 'lighter',
                fontSize: 10,
                color: 'gray',
            },
        },
        {
            type: 'map-shape',
            topology: otherCountiesTopology,
            data: otherCountiesData,
            topologyIdKey: 'name',
            idKey: 'county',
            fillOpacity: 0,
            stroke: 'gray',
            strokeOpacity: 0.2,
            labelKey: 'county',
            label: {
                color: 'gray',
                fontWeight: 'lighter',
                fontSize: 10,
                formatter: ({ value }) => {
                    console.log(value);
                    return value === 'Chiltern' || value === 'Three Rivers' || value === 'Epping Forest' ? value : '';
                },
            },
        },
        {
            type: 'map-line',
            title: 'Bakerloo',
            data: tubeData['Bakerloo'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#B26300',
            sizeDomain,
            strokeWidth,
        },
        {
            type: 'map-line',
            title: 'Hammersmith & City',
            data: tubeData['Hammersmith & City'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#F589A6',
            sizeDomain,
            strokeWidth,
        },
        {
            type: 'map-line',
            title: 'Jubilee',
            data: tubeData['Jubilee'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#838D93',
            sizeDomain,
            strokeWidth,
        },
        {
            type: 'map-line',
            title: 'Victoria',
            data: tubeData['Victoria'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#039BE5',
            sizeDomain,
            strokeWidth,
        },
        {
            type: 'map-line',
            title: 'District',
            data: tubeData['District'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#007D32',
            sizeDomain,
            strokeWidth,
        },
        {
            type: 'map-line',
            title: 'Metropolitan',
            data: tubeData['Metropolitan'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#9B0058',
            sizeDomain,
            strokeWidth,
            lineDash,
        },
        {
            type: 'map-line',
            title: 'Northern',
            data: tubeData['Northern'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: 'black',
            sizeDomain,
            strokeWidth,
        },
        {
            type: 'map-line',
            title: 'Piccadilly',
            data: tubeData['Piccadilly'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#0019A8',
            sizeDomain,
            strokeWidth,
        },
        {
            type: 'map-line',
            title: 'Waterloo & City',
            data: tubeData['Waterloo & City'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#76D0BD',
            sizeDomain,
            strokeWidth,
        },
        {
            type: 'map-line',
            title: 'Circle',
            data: tubeData['Circle'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#FFC80A',
            sizeDomain,
            strokeWidth,
            lineDash,
        },
        {
            type: 'map-line',
            title: 'Central',
            data: tubeData['Central'],
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: '#DC241F',
            sizeDomain,
            strokeWidth,
            lineDash,
        },
    ],
};

AgCharts.create(options);
