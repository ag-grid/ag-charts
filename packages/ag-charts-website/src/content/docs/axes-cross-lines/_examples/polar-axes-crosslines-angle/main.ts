import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { LineSeriesModule, ModuleRegistry } from 'ag-charts-community';
import { AngleCategoryAxisModule, RadarLineSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([AngleCategoryAxisModule, LineSeriesModule, RadarLineSeriesModule, RadiusNumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Skill Analysis',
    },
    series: [
        {
            type: 'radar-line',
            angleKey: 'skill',
            radiusKey: 'value',
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
            shape: 'circle',
            crossLines: [
                {
                    type: 'range',
                    range: ['Technical Skills', 'Communication'],
                    label: {
                        text: 'Valuable Skills',
                    },
                },
            ],
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
            crossLines: [
                {
                    type: 'line',
                    value: 6,
                    stroke: 'red',
                    label: {
                        text: 'Minimal\nRequirement',
                        positionAngle: 180,
                    },
                },
            ],
        },
    },
};

const chart = AgCharts.create(options);
