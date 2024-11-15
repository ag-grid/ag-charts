import type { AgToolbarOptions } from 'ag-charts-types';

import type { Module } from '../../module/module';
import { Toolbar } from './toolbar';

const seriesType: AgToolbarOptions['seriesType'] = {
    enabled: false,
    position: 'left',
    align: 'start',
    buttons: [
        {
            tooltip: 'toolbarSeriesTypeDropdown',
            value: 'type',
            // @ts-expect-error
            haspopup: true,
        },
    ],
};

const annotations: AgToolbarOptions['annotations'] = {
    enabled: true,
    position: 'left',
    align: 'start',
    buttons: [
        {
            icon: 'trend-line-drawing',
            tooltip: 'toolbarAnnotationsLineAnnotations',
            value: 'line-menu',
            section: 'line-annotations',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'text-annotation',
            tooltip: 'toolbarAnnotationsTextAnnotations',
            value: 'text-menu',
            section: 'text-annotations',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'arrow-drawing',
            tooltip: 'toolbarAnnotationsShapeAnnotations',
            value: 'shape-menu',
            section: 'shape-annotations',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'measurer-drawing',
            tooltip: 'toolbarAnnotationsMeasurerAnnotations',
            value: 'measurer-menu',
            section: 'measure-annotations',
            // @ts-expect-error
            haspopup: true,
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
    draggable: true,
    buttons: [
        {
            icon: 'text-annotation',
            tooltip: 'toolbarAnnotationsTextColor',
            value: 'text-color',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'line-color',
            tooltip: 'toolbarAnnotationsLineColor',
            value: 'line-color',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'fill-color',
            tooltip: 'toolbarAnnotationsFillColor',
            value: 'fill-color',
            // @ts-expect-error
            haspopup: true,
        },
        {
            tooltip: 'toolbarAnnotationsTextSize',
            value: 'text-size',
            // @ts-expect-error
            haspopup: true,
        },
        {
            tooltip: 'toolbarAnnotationsLineStrokeWidth',
            value: 'line-stroke-width',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'line-style-solid',
            tooltip: 'toolbarAnnotationsLineStyle',
            value: 'line-style-type',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'settings',
            tooltip: 'toolbarAnnotationsSettings',
            value: 'settings',
            // @ts-expect-error
            haspopup: true,
        },
        {
            role: 'switch',
            icon: 'unlocked',
            tooltip: 'toolbarAnnotationsLock',
            ariaLabel: 'toolbarAnnotationsLock',
            checkedOverrides: {
                icon: 'locked',
                tooltip: 'toolbarAnnotationsUnlock',
            },
            value: 'lock',
        },
        {
            icon: 'delete',
            tooltip: 'toolbarAnnotationsDelete',
            value: 'delete',
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
            seriesType,
            annotations,
            annotationOptions,
        },
    },
};
