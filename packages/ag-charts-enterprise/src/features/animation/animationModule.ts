import { type PluginModuleDefinition, boolean, positiveNumber, undocumented } from 'ag-charts-core';
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
        maxAnimatableItems: 1000,
    },

    create: (ctx) => new Animation(ctx),
};

// @ts-expect-error undocumented option
AnimationModule.options.maxAnimatableItems = undocumented(positiveNumber);
