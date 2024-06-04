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
            tooltip: 'toolbar-annotations.trend-line',
            value: 'line',
        },
        {
            icon: 'parallel-channel',
            tooltip: 'toolbar-annotations.parallel-channel',
            value: 'parallel-channel',
        },
        {
            icon: 'disjoint-channel',
            tooltip: 'toolbar-annotations.disjoint-channel',
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
            icon: 'delete',
            tooltip: 'toolbar-annotations.delete',
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
            label: 'toolbar-range.1-month',
            value: MONTH,
        },
        {
            label: 'toolbar-range.3-months',
            value: 3 * MONTH,
        },
        {
            label: 'toolbar-range.6-months',
            value: 6 * MONTH,
        },
        {
            label: 'toolbar-range.year-to-date',
            value: (_start, end) => [new Date(`${new Date(end).getFullYear()}-01-01`).getTime(), end],
        },
        {
            label: 'toolbar-range.1-year',
            value: YEAR,
        },
        {
            label: 'toolbar-range.all',
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
            tooltip: 'toolbar-zoom.zoom-out',
            value: 'zoom-out',
        },
        {
            icon: 'zoom-in',
            tooltip: 'toolbar-zoom.zoom-in',
            value: 'zoom-in',
        },
        {
            icon: 'pan-left',
            tooltip: 'toolbar-zoom.pan-left',
            value: 'pan-left',
        },
        {
            icon: 'pan-right',
            tooltip: 'toolbar-zoom.pan-right',
            value: 'pan-right',
        },
        {
            icon: 'pan-start',
            tooltip: 'toolbar-zoom.pan-start',
            value: 'pan-start',
        },
        {
            icon: 'pan-end',
            tooltip: 'toolbar-zoom.pan-end',
            value: 'pan-end',
        },
        {
            icon: 'reset',
            tooltip: 'toolbar-zoom.zoom',
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
