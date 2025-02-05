import { AgChartOptions, AgCharts, AgLineSeriesTooltipRendererParams } from 'ag-charts-enterprise';

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
        text: 'Total Distance: 70-80km, Highest Elevation: 4130m\nStart Point: Pokhara (1,000m), End Point: Annapurna Base Camp (4,130 m)',
    },
    series: [
        {
            type: 'line',
            xKey: 'distance',
            yKey: 'elevation',
            marker: {
                enabled: false,
            },
        },
    ],
    axes: [
        {
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
        {
            type: 'number',
            position: 'left',
            min: 800,
            max: 4500,
            nice: false,
        },
    ],
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
                        stroke: 'lime',
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
                        color: 'blue',
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
                x: 34,
                y: 2050,
                text: 'Himalaya',
                // Himalaya
            },
            {
                type: 'text',
                x: 34,
                y: 3200,
                text: '2,900 m\nalt. 100',
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
                x: 25,
                y: 1870,
                text: 'Chhomrong',
                // Chhomrong
            },
            {
                type: 'text',
                x: 25,
                y: 2370,
                text: '3,300 m\nalt. 300',
                // Chhomrong
            },
            {
                type: 'text',
                x: 44,
                y: 4130,
                text: '4,130 m\nalt. 230',
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
