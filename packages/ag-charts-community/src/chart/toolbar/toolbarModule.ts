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
        { icon: 'trend-line', tooltip: 'Trend Line', value: 'line' },
        { icon: 'parallel-channel', tooltip: 'Parallel Channel', value: 'parallel-channel' },
        { icon: 'disjoint-channel', tooltip: 'Disjoint Channel', value: 'disjoint-channel' },
    ],
};

const ranges: AgToolbarOptions['ranges'] = {
    enabled: false,
    position: 'top',
    align: 'start',
    buttons: [
        { label: '1m', value: MONTH },
        { label: '3m', value: 3 * MONTH },
        { label: '6m', value: 6 * MONTH },
        { label: 'YTD', value: (_start, end) => [new Date(`${new Date(end).getFullYear()}-01-01`).getTime(), end] },
        { label: '1y', value: YEAR },
        { label: 'All', value: (start, end) => [start, end] },
    ],
};

const zoom: AgToolbarOptions['zoom'] = {
    enabled: false,
    position: 'top',
    align: 'end',
    buttons: [
        {
            icon: 'zoom-out',
            tooltip: 'Zoom out',
            value: 'zoom-out',
        },
        {
            icon: 'zoom-in',
            tooltip: 'Zoom in',
            value: 'zoom-in',
        },
        {
            icon: 'pan-left',
            tooltip: 'Pan left',
            value: 'pan-left',
        },
        {
            icon: 'pan-right',
            tooltip: 'Pan right',
            value: 'pan-right',
        },
        {
            icon: 'pan-start',
            tooltip: 'Pan to the start',
            value: 'pan-start',
        },
        {
            icon: 'pan-end',
            tooltip: 'Pan to the end',
            value: 'pan-end',
        },
        {
            icon: 'reset',
            tooltip: 'Reset the zoom',
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
            ranges,
            zoom,
        },
    },
};
