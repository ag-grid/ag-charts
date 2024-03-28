import type { _ModuleSupport } from 'ag-charts-community';

import { RangeButtons } from './rangeButtons';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export const RangeButtonsModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'rangeButtons',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: RangeButtons,
    themeTemplate: {
        rangeButtons: {
            enabled: false,
            buttons: [
                { label: '1m', duration: MONTH },
                { label: '3m', duration: 3 * MONTH },
                { label: '6m', duration: 6 * MONTH },
                { label: 'YTD', duration: 'year-to-date' },
                { label: '1y', duration: YEAR },
                { label: 'All', duration: 'all' },
            ],
        },
    },
};
