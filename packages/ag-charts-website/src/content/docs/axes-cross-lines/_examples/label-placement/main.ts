import {
    AgCartesianChartOptions,
    AgCartesianCrossLineLabelPlacement,
    AgCartesianCrossLineOptions,
    AgCharts,
    CrossLinesModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CrossLinesModule, LineSeriesModule, NumberAxisModule, TimeAxisModule]);

type CrossLineType = 'line' | 'range';
type CrossLineAxis = 'x' | 'y';

let crossLineType: CrossLineType = 'line';
let crossLineAxis: CrossLineAxis = 'y';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Revenue',
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'revenue',
            yName: 'Revenue',
        },
    ],
    axes: {
        x: {
            type: 'time',
        },
        y: {
            type: 'number',
            title: {
                text: 'Revenue (£k)',
            },
            crossLines: [
                {
                    type: 'line',
                    value: 250,
                    label: {
                        text: 'Target',
                        placement: 'top',
                    },
                },
            ],
        },
    },
};

const chart = AgCharts.create(options);

function setCrossLineType(event: Event) {
    crossLineType = (event.target as HTMLInputElement).value as CrossLineType;
    updateCrossLine();
}

function setCrossLineAxis(event: Event) {
    crossLineAxis = (event.target as HTMLInputElement).value as CrossLineAxis;
    updateCrossLine();
}

function updateCrossLine() {
    const isRange = crossLineType === 'range';

    (document.getElementById('lineYPlacementGroup') as HTMLFieldSetElement).disabled = isRange || crossLineAxis !== 'y';
    (document.getElementById('lineXPlacementGroup') as HTMLFieldSetElement).disabled = isRange || crossLineAxis !== 'x';
    (document.getElementById('rangePlacementGroup') as HTMLFieldSetElement).disabled = !isRange;

    const selectId = isRange
        ? 'rangePlacementSelect'
        : crossLineAxis === 'y'
          ? 'lineYPlacementSelect'
          : 'lineXPlacementSelect';
    const placement = (document.getElementById(selectId) as HTMLSelectElement)
        .value as AgCartesianCrossLineLabelPlacement;
    const crossLine = createCrossLine(placement);

    options.axes!.x!.crossLines = crossLineAxis === 'x' ? [crossLine] : [];
    options.axes!.y!.crossLines = crossLineAxis === 'y' ? [crossLine] : [];
    chart.update(options);
}

/** inScope */
function createCrossLine(placement: AgCartesianCrossLineLabelPlacement): AgCartesianCrossLineOptions {
    if (crossLineType === 'line') {
        return {
            type: 'line',
            value: crossLineAxis === 'y' ? 250 : new Date(2025, 8, 1),
            label: { text: 'Target', placement },
        };
    }

    return {
        type: 'range',
        range: crossLineAxis === 'y' ? [210, 250] : [new Date(2025, 5, 1), new Date(2025, 7, 1)],
        label: { text: 'Promotion', placement },
    };
}
