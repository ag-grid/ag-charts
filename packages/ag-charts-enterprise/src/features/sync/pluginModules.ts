import { _ModuleSupport } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';
import type { AgAnnotationsOptions, AgInitialStateOptions } from 'ag-charts-types';

import { initialStateOptionsDef } from '../annotations/annotationOptionsDef';

const { annotationOptionsDef } = _ModuleSupport;

export const AnnotationsModule: PluginModuleDefinition<AgAnnotationsOptions> = {
    type: 'plugin',
    name: 'annotations',
    chartType: 'cartesian',

    options: annotationOptionsDef,
    create() {
        return null as any;
    },
};

export const InitialStateModule: PluginModuleDefinition<AgInitialStateOptions> = {
    type: 'plugin',
    name: 'initialState',

    options: initialStateOptionsDef,
    create() {
        return null as any;
    },
};
