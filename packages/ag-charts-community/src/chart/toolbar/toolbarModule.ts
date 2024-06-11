import type { Module } from '../../module/module';
import type { AgToolbarOptions } from '../../options/chart/toolbarOptions';
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
            icon: 'trend-line',
            tooltip: 'toolbarAnnotationsTrendLine',
            value: 'line',
        },
        {
            icon: 'parallel-channel',
            tooltip: 'toolbarAnnotationsParallelChannel',
            value: 'parallel-channel',
        },
        {
            icon: 'disjoint-channel',
            tooltip: 'toolbarAnnotationsDisjointChannel',
            value: 'disjoint-channel',
        },
    ],
};

const annotationOptions: AgToolbarOptions['annotationOptions'] = {
    enabled: false,
    position: 'floating',
    align: 'start',
    buttons: [
        {
            icon: 'color',
            tooltip: 'toolbarAnnotationsColor',
            value: 'color',
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
            value: MONTH,
        },
        {
            label: 'toolbarRange3Months',
            value: 3 * MONTH,
        },
        {
            label: 'toolbarRange6Months',
            value: 6 * MONTH,
        },
        {
            label: 'toolbarRangeYearToDate',
            value: (_start, end) => [new Date(`${new Date(end).getFullYear()}-01-01`).getTime(), end],
        },
        {
            label: 'toolbarRange1Year',
            value: YEAR,
        },
        {
            label: 'toolbarRangeAll',
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
            icon: 'zoom-out',
            tooltip: 'toolbarZoomZoomOut',
            value: 'zoom-out',
        },
        {
            icon: 'zoom-in',
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
