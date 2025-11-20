import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AreaSeriesModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AnnotationsModule, ChartToolbarModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnnotationsModule, AreaSeriesModule, ChartToolbarModule, LineSeriesModule, NumberAxisModule]);

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Annapurna Sanctuary Trek, Nepal',
    },
    subtitle: {
        text: 'Views of the Annapurna massif, an immersive experience in the Himalayas',
    },
    footnote: {
        text: 'Total Distance: 70-80km, Highest Elevation: 4130m',
    },
    series: [
        {
            type: 'area',
            xKey: 'distance',
            yKey: 'elevation',
            strokeWidth: 1,
            fillOpacity: 0.1,
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            nice: false,
            interval: {
                values: [7, 15, 26, 36, 46, 56, 62, 69],
            },
            label: {
                formatter: ({ value }) =>
                    value === 15
                        ? 'Poon Hill\n(Sunrise View)'
                        : value === 46
                          ? 'Annapurna\nBase Camp'
                          : value === 69
                            ? 'Jhinu Danda\n(Hot Springs)'
                            : `${value} KM`,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            min: 800,
            max: 4700,
            nice: false,
        },
    },
    annotations: {
        enabled: true,
        toolbar: {
            enabled: false,
        },
    },
    theme: {
        overrides: {
            common: {
                annotations: {
                    line: {
                        stroke: '#4444C0',
                        strokeWidth: 1,
                        lineDash: [3, 1],
                    },
                    arrow: {
                        stroke: 'red',
                        strokeWidth: 1,
                        text: {
                            fontSize: 12,
                        },
                    },
                    text: {
                        color: '#4444C0',
                        fontSize: 12,
                    },
                },
            },
        },
    },
    initialState: {
        annotations: [
            {
                type: 'arrow',
                start: { x: 0, y: 1000 },
                end: { x: 7, y: 1000 },
                text: {
                    label: '7 KM\nDay 01',
                    position: 'center',
                },
            },
            {
                type: 'arrow',
                start: { x: 7, y: 1000 },
                end: { x: 15, y: 1000 },
                text: {
                    label: '8 KM',
                },
            },
            {
                type: 'arrow',
                start: { x: 15, y: 1000 },
                end: { x: 26, y: 1000 },
                text: {
                    label: '11 KM',
                },
            },
            {
                type: 'arrow',
                start: { x: 26, y: 1000 },
                end: { x: 36, y: 1000 },
                text: {
                    label: '10 KM',
                },
            },
            {
                type: 'arrow',
                start: { x: 36, y: 1000 },
                end: { x: 46, y: 1000 },
                text: {
                    label: '10 KM',
                },
            },
            {
                type: 'arrow',
                start: { x: 46, y: 1000 },
                end: { x: 62, y: 1000 },
                text: {
                    label: '16 KM',
                },
            },
            {
                type: 'arrow',
                start: { x: 62, y: 1000 },
                end: { x: 69, y: 1000 },
                text: {
                    label: '7 KM',
                },
            },
            {
                type: 'arrow',
                start: { x: 69, y: 1000 },
                end: { x: 77, y: 1000 },
                text: {
                    label: '8 KM\nDay 09',
                    position: 'center',
                },
            },
            {
                type: 'line',
                start: { x: 15, y: 3200 },
                end: { x: 15, y: 900 },
            },
            {
                type: 'line',
                start: { x: 36, y: 3200 },
                end: { x: 36, y: 2200 },
                // Himalaya
            },
            {
                type: 'text',
                text: 'Himalaya',
                x: 34.55,
                y: 2020,
                // Himalaya
            },
            {
                type: 'text',
                text: '2,900 m\nalt. 100',
                x: 35,
                y: 3280,
                // Himalaya
            },
            {
                type: 'line',
                start: { x: 26, y: 2370 },
                end: { x: 26, y: 1970 },
                // Chhomrong
            },
            {
                type: 'text',
                text: 'Chhomrong',
                x: 24,
                y: 1825,
                // Chhomrong
            },
            {
                type: 'text',
                text: '3,300 m\nalt. 300',
                x: 24.84,
                y: 2455,
                // Chhomrong
            },
            {
                type: 'line',
                start: {
                    x: 62,
                    y: 2754,
                },
                end: {
                    x: 62,
                    y: 1898,
                },
                // Bamboo
            },
            {
                type: 'text',
                text: 'Bamboo',
                visible: true,
                x: 60.5,
                y: 1735.7,
                // Bamboo
            },
            {
                type: 'text',
                text: '2,310 m\nalt. 40',
                visible: true,
                x: 60.5,
                y: 2829.3,
                // Bamboo
            },
            {
                type: 'text',
                text: '4,130 m\nalt. 230',
                x: 44.77,
                y: 4190,
                // Peak
            },
            {
                type: 'line',
                start: { x: 46, y: 4130 },
                end: { x: 46, y: 900 },
                // Annapurna Base Camp
            },
            {
                type: 'line',
                start: { x: 69, y: 1700 },
                end: { x: 69, y: 900 },
                // Jhinu Danda (Hot Springs)
            },
        ],
    },
};

AgCharts.create(options);
