import { LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AgCrosshairLabelRendererParams } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, LineSeriesModule, NumberAxisModule]);
const crosshairLabelRenderer = (arrowPosition: 'top' | 'right') => {
    const classList =
        arrowPosition === 'top'
            ? 'secondary-axes-crosshair-label crosshair-label-arrow-top'
            : 'secondary-axes-crosshair-label crosshair-label-arrow-right';
    return ({ value, fractionDigits }: AgCrosshairLabelRendererParams) => {
        return `<div class='${classList}'>
            <div>${value.toFixed(fractionDigits)}</div>
         </div>`;
    };
};

const data = getData();
const buildSeries = () => {
    return Object.entries(data[0])
        .filter(([key]) => key !== 'All fuels' && key !== 'year')
        .map(([key]) => ({
            type: 'line' as const,
            xKey: 'year',
            yKey: key,
        }));
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: buildSeries(),
    axes: {
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Kilotonnes of Oil Equivalent',
            },
            crosshair: {
                snap: false,
                label: {
                    renderer: crosshairLabelRenderer('right'),
                },
            },
        },
        x: {
            type: 'number',
            position: 'bottom',
            crosshair: {
                snap: false,
                label: {
                    renderer: crosshairLabelRenderer('top'),
                },
            },
        },
    },
};

AgCharts.create(options);
