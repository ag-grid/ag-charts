import type { _ModuleSupport } from 'ag-charts-community';

import { Annotations } from './annotations';
import { annotationsTheme } from './annotationsTheme';

export const AnnotationsModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'annotations',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    dependencies: ['toolbar'],
    moduleFactory: (ctx) => new Annotations(ctx),
    themeTemplate: {
        annotations: annotationsTheme,
    },
};
