import type { _ModuleSupport } from 'ag-charts-community';

import { Annotations } from './annotations';

export const AnnotationsModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'annotations',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Annotations,
    themeTemplate: {},
};
