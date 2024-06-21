import type { AgToolbarOptions } from 'ag-charts-types';

import type { Module } from '../../module/module';
import { Toolbar } from './toolbar';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

const annotations: AgToolbarOptions['annotations'] = {
    enabled: false,
    position: 'left',
    align: 'start',
    buttons: [
        {
            icon: 'horizontal-line',
            tooltip: 'toolbarAnnotationsTrendLine',
            value: 'horizontal-line',
            section: 'create',
        },
        {
            icon: 'vertical-line',
            tooltip: 'toolbarAnnotationsTrendLine',
            value: 'vertical-line',
            section: 'create',
        },
        {
            icon: 'trend-line',
            tooltip: 'toolbarAnnotationsTrendLine',
            value: 'line',
            section: 'create',
        },
        {
            icon: 'parallel-channel',
            tooltip: 'toolbarAnnotationsParallelChannel',
            value: 'parallel-channel',
            section: 'create',
        },
        {
            icon: 'disjoint-channel',
            tooltip: 'toolbarAnnotationsDisjointChannel',
            value: 'disjoint-channel',
            section: 'create',
        },
        {
            icon: 'delete',
            tooltip: 'toolbarAnnotationsClearAll',
            value: 'clear',
            section: 'tools',
        },
    ],
};

const annotationOptions: AgToolbarOptions['annotationOptions'] = {
    enabled: false,
    position: 'floating',
    align: 'start',
    buttons: [
        {
            icon: 'line-color',
            tooltip: 'toolbarAnnotationsColor',
            value: 'line-color',
        },
        {
            icon: 'lock',
            tooltip: 'toolbarAnnotationsLock',
            value: 'lock',
        },
        {
            icon: 'unlock',
            tooltip: 'toolbarAnnotationsUnlock',
            value: 'unlock',
        },
        {
            icon: 'delete',
            tooltip: 'toolbarAnnotationsDelete',
            value: 'delete',
        },
    ],
};

const ranges: AgToolbarOptions['ranges'] = {
    enabled: false,
    position: 'top',
    align: 'start',
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
};

const zoom: AgToolbarOptions['zoom'] = {
    enabled: false,
    position: 'top',
    align: 'end',
    buttons: [
        {
            icon: 'zoom-out-alt',
            tooltip: 'toolbarZoomZoomOut',
            value: 'zoom-out',
        },
        {
            icon: 'zoom-in-alt',
            tooltip: 'toolbarZoomZoomIn',
            value: 'zoom-in',
        },
        {
            icon: 'pan-left',
            tooltip: 'toolbarZoomPanLeft',
            value: 'pan-left',
        },
        {
            icon: 'pan-right',
            tooltip: 'toolbarZoomPanRight',
            value: 'pan-right',
        },
        {
            icon: 'pan-start',
            tooltip: 'toolbarZoomPanStart',
            value: 'pan-start',
        },
        {
            icon: 'pan-end',
            tooltip: 'toolbarZoomPanEnd',
            value: 'pan-end',
        },
        {
            icon: 'reset',
            tooltip: 'toolbarZoomReset',
            value: 'reset',
        },
    ],
};

export const ToolbarModule: Module = {
    type: 'root',
    optionsKey: 'toolbar',
    packageType: 'community',
    chartTypes: ['cartesian'],
    instanceConstructor: Toolbar,
    themeTemplate: {
        toolbar: {
            enabled: true,
            annotations,
            annotationOptions,
            ranges,
            zoom,
        },
    },
};
