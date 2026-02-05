// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { getData } from './data';
import type { DatumType } from './data';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions<DatumType> = {
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: {
                        highlightedItem: {
                            stroke: 'lime',
                            strokeWidth: 7,
                        },
                    },
                },
            },
        },
    },
    container: document.getElementById('myChart'),
    data: getData(),
    animation: { enabled: false },
    series: [
        {
            type: 'area',
            xKey: 'Year',
            yKey: 'Spain',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'Year',
            yKey: 'UK',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'Year',
            yKey: 'Germany',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'Year',
            yKey: 'Ireland',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'Year',
            yKey: 'France',
            stacked: true,
        },
    ],
    initialState: {
        active: {
            activeItem: {
                type: 'legend',
                seriesId: 'AreaSeries-2',
                itemId: 'UK',
            },
            frozen: false,
        },
    },
};

const chart = AgCharts.create(options);

// For e2e testing:
(window as any).agE2E = { chart };
