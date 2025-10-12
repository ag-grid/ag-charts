import type { _ModuleSupport } from 'ag-charts-community';

import { Animation } from './animation';

export const AnimationModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'animation',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
    moduleFactory: (ctx) => new Animation(ctx),
    themeTemplate: {
        animation: {
            enabled: true,
            maxAnimatableItems: 1000,
        },
    },
};
