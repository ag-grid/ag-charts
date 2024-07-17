import type { AgToolbarGroupPosition, AgToolbarOptions } from 'ag-charts-types';

import type { Module } from '../../module/module';
import { DEFAULT_TOOLBAR_POSITION } from '../themes/symbols';
import { Toolbar } from './toolbar';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

const annotations: AgToolbarOptions['annotations'] = {
    enabled: true,
    position: 'left',
    align: 'start',
    buttons: [
        {
            icon: 'trend-line',
            tooltip: 'toolbarAnnotationsTrendLine',
            value: 'line',
            section: 'lines',
        },
        {
            icon: 'horizontal-line',
            tooltip: 'toolbarAnnotationsHorizontalLine',
            value: 'horizontal-line',
            section: 'lines',
        },
        {
            icon: 'vertical-line',
            tooltip: 'toolbarAnnotationsVerticalLine',
            value: 'vertical-line',
            section: 'lines',
        },
        {
            icon: 'parallel-channel',
            tooltip: 'toolbarAnnotationsParallelChannel',
            value: 'parallel-channel',
            section: 'channels',
        },
        {
            icon: 'disjoint-channel',
            tooltip: 'toolbarAnnotationsDisjointChannel',
            value: 'disjoint-channel',
            section: 'channels',
        },
        {
            icon: 'text',
            tooltip: 'text',
            value: 'text',
            section: 'annotations',
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
    enabled: true,
    position: 'floating',
    align: 'start',
    buttons: [
        {
            icon: 'line-color',
            tooltip: 'toolbarAnnotationsColor',
            value: 'line-color',
        },
        {
            label: 'Color',
            tooltip: 'Text color',
            value: 'text-color',
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
    position: DEFAULT_TOOLBAR_POSITION as AgToolbarGroupPosition,
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
    enabled: true,
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
    moduleFactory: (ctx) => new Toolbar(ctx),
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
