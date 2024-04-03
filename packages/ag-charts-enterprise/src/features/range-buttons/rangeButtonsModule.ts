import type { AgRangeButtonsOptions, _ModuleSupport } from 'ag-charts-community';

import { RangeButtons } from './rangeButtons';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

const rangeButtonOptions: AgRangeButtonsOptions = {
    enabled: false,
    buttons: [
        {
            label: '1m',
            duration: MONTH,
        },
        {
            label: '3m',
            duration: 3 * MONTH,
        },
        {
            label: '6m',
            duration: 6 * MONTH,
        },
        {
            label: 'YTD',
            duration: (_start, end) => [new Date(`${new Date(end).getFullYear()}-01-01`).getTime(), end],
        },
        {
            label: '1y',
            duration: YEAR,
        },
        {
            label: 'All',
            duration: (start, end) => [start, end],
        },
    ],
};

export const RangeButtonsModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'rangeButtons',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: RangeButtons,
    themeTemplate: {
        rangeButtons: rangeButtonOptions,
    },
};
