import { VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, positiveNumber, undocumented } from 'ag-charts-core';
import type { AgAnimationOptions } from 'ag-charts-types';

import { Animation } from './animation';

export const AnimationModule: PluginModuleDefinition<AgAnimationOptions> = {
    type: 'plugin',
    name: 'animation',
    enterprise: true,
    version: VERSION,

    options: {
        enabled: boolean,
        duration: positiveNumber,
    },
    themeTemplate: {
        enabled: true,
    },

    create: (ctx) => new Animation(ctx),
};

// @ts-expect-error undocumented option
AnimationModule.options.maxAnimatableItems = undocumented(positiveNumber);
