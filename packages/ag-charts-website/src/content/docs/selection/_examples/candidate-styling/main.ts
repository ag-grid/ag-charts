import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, SelectionModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Drag the mouse to view custom candidacy styling' },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    data: [
        { category: 'A', value: 30 },
        { category: 'B', value: 25 },
        { category: 'C', value: 40 },
        { category: 'D', value: 35 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'value',
            itemStyler: (params) => {
                const { candidateState, selectionState } = params;

                // Is this datum included in a drag motion?
                if (
                    candidateState === 'selected-item' &&
                    (selectionState === 'unselected-item' || selectionState == 'none')
                ) {
                    return { fill: 'green' };
                }

                // Is this datum excluded from a drag motion?
                if (
                    selectionState === 'selected-item' &&
                    (candidateState === 'unselected-item' || candidateState === 'none')
                ) {
                    return { fill: 'red' };
                }

                // No dragging is in progress; Is this datum selected?
                if (selectionState === 'selected-item') {
                    return { fill: 'skyblue' };
                }

                // Default: No dragging is in progress; Not selected.
                return { fill: 'gray' };
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
