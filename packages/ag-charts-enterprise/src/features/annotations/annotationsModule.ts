import { type AgAnnotationsOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition } from 'ag-charts-core';

import { SharedToolbar } from '../shared-toolbar/sharedToolbar';
import { Annotations } from './annotations';
import { annotationsTheme } from './annotationsTheme';

export const AnnotationsModule: PluginModuleDefinition<AgAnnotationsOptions, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'annotations',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.annotationOptionsDef,
    themeTemplate: annotationsTheme,

    create: (ctx) => new Annotations(ctx),
    register: (ctx) => {
        if (ctx.has('sharedToolbar')) return;
        ctx.service('sharedToolbar', (c) => new SharedToolbar(c));
    },
};
