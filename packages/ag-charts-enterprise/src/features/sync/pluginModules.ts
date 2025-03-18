import type { PluginModuleDefinition } from 'ag-charts-core';
import type { AgAnnotationsOptions, AgInitialStateOptions, AgNavigatorOptions } from 'ag-charts-types';

import { annotationOptionsDef, initialStateOptionsDef } from '../annotations/annotationOptionsDef';
import { navigatorOptionsDef } from '../navigator/navigatorOptionsDefs';

export const AnnotationsModule: PluginModuleDefinition<AgAnnotationsOptions> = {
    type: 'plugin',
    name: 'annotations',
    chartType: 'cartesian',

    options: annotationOptionsDef,
    create() {
        return null as any;
    },
};

export const NavigatorModule: PluginModuleDefinition<AgNavigatorOptions> = {
    type: 'plugin',
    name: 'navigator',
    chartType: 'cartesian',

    options: navigatorOptionsDef,
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
