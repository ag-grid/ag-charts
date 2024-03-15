import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { londonBoroughData } from './londonBoroughData';
import { londonBoroughTopology } from './londonBoroughTopology';
import { otherCountiesData } from './otherCountiesData';
import { otherCountiesTopology } from './otherCountiesTopology';
import { tubeData } from './tubeData';
import { tubeTopology } from './tubeTopology';

const sizeDomain = [0, 141537];
const strokeWidth = 1;
const maxStrokeWidth = 4;

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
                fontSize: 10,
                minimumFontSize: 8,
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
                fontSize: 10,
                minimumFontSize: 8,
                color: 'rgba(128,128,128,0.2)',
                formatter: ({ value }) => {
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
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
            maxStrokeWidth,
        },
    ],
};

AgCharts.create(options);
