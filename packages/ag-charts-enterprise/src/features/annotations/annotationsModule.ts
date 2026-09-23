import { type AgAnnotationsOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { SharedToolbar } from '../shared-toolbar/sharedToolbar';
import { createAnnotationStateDefs } from './annotationStateDefs';
import { Annotations } from './annotations';
import { annotationsTheme } from './annotationsTheme';

export const AnnotationsModule: PluginModuleDefinition<AgAnnotationsOptions, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'annotations',
    chartTypes: ['cartesian'],
    dependencies: [BackgroundRegionsModule],
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.annotationOptionsDef,
    themeTemplate: annotationsTheme,

    create: (ctx) => new Annotations(ctx),
    register: (ctx) => {
        if (!ctx.has('annotationManager')) {
            ctx.service(
                'annotationManager',
                (c) => new _ModuleSupport.AnnotationManager(c, createAnnotationStateDefs())
            );
        }
        if (!ctx.has('sharedToolbar')) {
            ctx.service('sharedToolbar', (c) => new SharedToolbar(c));
        }
    },
};
