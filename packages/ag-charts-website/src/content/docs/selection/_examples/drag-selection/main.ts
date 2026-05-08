import {
    AgCartesianChartOptions,
    AgCharts,
    AgSelectionContainment,
    BubbleSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, NumberAxisModule, SelectionModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Drag to select' },
    selection: {
        enabled: true,
        enableDrag: true,
        containment: 'any',
    },
    data: getData(),
    series: [
        {
            type: 'bubble',
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            highlight: { enabled: false },
        },
    ],
    axes: {
        x: { type: 'number', title: { text: 'Height (cm)' } },
        y: { type: 'number', title: { text: 'Weight (kg)' } },
    },
};

const chart = AgCharts.create(options);

function setContainment(value: AgSelectionContainment) {
    options.selection = { ...options.selection, containment: value };
    chart.update(options);
}
