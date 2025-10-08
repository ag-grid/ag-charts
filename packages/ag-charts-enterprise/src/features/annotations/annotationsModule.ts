import type { AgAnnotationsOptions } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, defined } from 'ag-charts-core';

import { SharedToolbar } from '../shared-toolbar/sharedToolbar';
import { Annotations } from './annotations';
import { annotationsTheme } from './annotationsTheme';

export const AnnotationsModule: PluginModuleDefinition<AgAnnotationsOptions> = {
    type: 'plugin',
    name: 'annotations',
    chartType: 'cartesian',
    enterprise: true,

    options: {
        enabled: boolean,
        axesButtons: defined,
        toolbar: defined,
        optionsToolbar: defined,
    },
    themeTemplate: annotationsTheme,

    create: (ctx) => new Annotations(ctx),
    patchContext: (ctx) => {
        if (ctx.sharedToolbar) return;
        ctx.sharedToolbar = new SharedToolbar(ctx);
        ctx.cleanup.register(() => ctx.sharedToolbar.destroy());
    },
};
