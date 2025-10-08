import { type PluginModuleDefinition, boolean, positiveNumber } from 'ag-charts-core';
import type { AgAnimationOptions } from 'ag-charts-types';

import { Animation } from './animation';

export const AnimationModule: PluginModuleDefinition<AgAnimationOptions> = {
    type: 'plugin',
    name: 'animation',
    enterprise: true,

    options: {
        enabled: boolean,
        duration: positiveNumber,
    },
    themeTemplate: {
        enabled: true,
        maxAnimatableItems: 1_000,
    },

    create: (ctx) => new Animation(ctx),
};
