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
            // @ts-expect-error undocumented option
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
            // @ts-expect-error undocumented option
            haspopup: true,
        },
        {
            icon: 'text-annotation',
            tooltip: 'toolbarAnnotationsTextAnnotations',
            value: 'text-menu',
            section: 'text-annotations',
            // @ts-expect-error undocumented option
            haspopup: true,
        },
        {
            icon: 'arrow-drawing',
            tooltip: 'toolbarAnnotationsShapeAnnotations',
            value: 'shape-menu',
            section: 'shape-annotations',
            // @ts-expect-error undocumented option
            haspopup: true,
        },
        {
            icon: 'measurer-drawing',
            tooltip: 'toolbarAnnotationsMeasurerAnnotations',
            value: 'measurer-menu',
            section: 'measure-annotations',
            // @ts-expect-error undocumented option
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
        },
    },
};
