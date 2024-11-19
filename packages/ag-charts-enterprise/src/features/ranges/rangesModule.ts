import type { AgRangesOptions, _ModuleSupport } from 'ag-charts-community';

import { Ranges } from './ranges';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export const RangesModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'ranges',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    moduleFactory: (ctx) => new Ranges(ctx),
    themeTemplate: {
        ranges: {
            enabled: false,
            buttons: [
                {
                    label: 'toolbarRange1Month',
                    ariaLabel: 'toolbarRange1MonthAria',
                    value: MONTH,
                },
                {
                    label: 'toolbarRange3Months',
                    ariaLabel: 'toolbarRange3MonthsAria',
                    value: 3 * MONTH,
                },
                {
                    label: 'toolbarRange6Months',
                    ariaLabel: 'toolbarRange6MonthsAria',
                    value: 6 * MONTH,
                },
                {
                    label: 'toolbarRangeYearToDate',
                    ariaLabel: 'toolbarRangeYearToDateAria',
                    value: (_start, end) => [new Date(`${new Date(end).getFullYear()}-01-01`).getTime(), end],
                },
                {
                    label: 'toolbarRange1Year',
                    ariaLabel: 'toolbarRange1YearAria',
                    value: YEAR,
                },
                {
                    label: 'toolbarRangeAll',
                    ariaLabel: 'toolbarRangeAllAria',
                    value: (start, end) => [start, end],
                },
            ],
        } satisfies AgRangesOptions,
    },
};
