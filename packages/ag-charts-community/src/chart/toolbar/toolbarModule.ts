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
        { label: 'Li', value: 'line' },
        { label: 'PCh', value: 'parallel-channel' },
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
            icon: 'asc',
            tooltip: 'Zoom in',
            value: 'zoom-in',
        },
        {
            icon: 'desc',
            tooltip: 'Zoom out',
            value: 'zoom-out',
        },
        {
            icon: 'left',
            tooltip: 'Pan left',
            value: 'pan-left',
        },
        {
            icon: 'right',
            tooltip: 'Pan right',
            value: 'pan-right',
        },
        {
            icon: 'first',
            tooltip: 'Pan to the start',
            value: 'pan-start',
        },
        {
            icon: 'last',
            tooltip: 'Pan to the end',
            value: 'pan-end',
        },
        {
            icon: 'arrows',
            tooltip: 'Reset the zoom',
            value: 'reset-zoom',
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
