import { type AgRangesButton, type AgRangesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type PluginModuleDefinition,
    and,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    boolean,
    callback,
    date,
    number,
    or,
} from 'ag-charts-core';

import { Ranges } from './ranges';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export const RangesModule: PluginModuleDefinition<AgRangesOptions> = {
    type: 'plugin',
    name: 'ranges',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    options: {
        enabled: boolean,
        buttons: arrayOfDefs<AgRangesButton>(
            {
                ..._ModuleSupport.toolbarButtonOptionsDefs,
                value: or(number, and(arrayOf(or(number, date)), arrayLength(2, 2)), callback),
            },
            'range button options array'
        ),
    },
    themeTemplate: {
        enabled: false,
        buttons: {
            $shallowSimple: [
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
                    value: (_start: Date | number, end: Date | number) => [
                        new Date(`${new Date(end).getFullYear()}-01-01`).getTime(),
                        undefined,
                    ],
                },
                {
                    label: 'toolbarRange1Year',
                    ariaLabel: 'toolbarRange1YearAria',
                    value: YEAR,
                },
                {
                    label: 'toolbarRangeAll',
                    ariaLabel: 'toolbarRangeAllAria',
                    value: undefined, // Reset zoom
                },
            ],
        },
    },

    create: (ctx) => new Ranges(ctx),
};
