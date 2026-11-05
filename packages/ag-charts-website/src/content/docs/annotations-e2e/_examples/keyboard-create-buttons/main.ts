import { AgCharts } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { getData } from './data';

// Both axes span exactly 0 to 100, so a point's data value is its position as a percentage of the series area.
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    data: getData(),
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'number', position: 'bottom', min: 0, max: 100, nice: false },
        y: { type: 'number', position: 'left', min: 0, max: 100, nice: false },
    },
    annotations: {
        enabled: true,
        toolbar: {
            buttons: [
                { icon: 'trend-line-drawing', tooltip: 'toolbarAnnotationsTrendLine', value: 'line' },
                {
                    icon: 'parallel-channel-drawing',
                    tooltip: 'toolbarAnnotationsParallelChannel',
                    value: 'parallel-channel',
                },
                { icon: 'text-annotation', tooltip: 'toolbarAnnotationsText', value: 'text' },
                { icon: 'delete', tooltip: 'toolbarAnnotationsClearAll', value: 'clear' },
            ],
        },
    },
};

const chart = AgCharts.create(options);

// For e2e testing:
(window as any).agE2E = { chart };
