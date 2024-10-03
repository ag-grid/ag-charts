import type { _ModuleSupport } from 'ag-charts-community';

import { Animation } from './animation';

export const AnimationModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'animation',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion', 'standalone', 'gauge'],
    moduleFactory: (ctx) => new Animation(ctx),
    themeTemplate: {
        animation: {
            enabled: true,
        },
    },
};
