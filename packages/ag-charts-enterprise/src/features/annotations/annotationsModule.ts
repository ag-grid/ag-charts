import { type AgAnnotationsOptions, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition } from 'ag-charts-core';

import { SharedToolbar } from '../shared-toolbar/sharedToolbar';
import { Annotations } from './annotations';
import { annotationsTheme } from './annotationsTheme';

export const AnnotationsModule: PluginModuleDefinition<AgAnnotationsOptions> = {
    type: 'plugin',
    name: 'annotations',
    chartType: 'cartesian',
    enterprise: true,

    options: _ModuleSupport.annotationOptionsDef,
    themeTemplate: annotationsTheme,

    create: (ctx) => new Annotations(ctx),
    patchContext: (ctx) => {
        if (ctx.sharedToolbar) return;
        ctx.sharedToolbar = new SharedToolbar(ctx);
        ctx.cleanup.register(() => ctx.sharedToolbar.destroy());
    },
};
