import { VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, positiveNumber, undocumentedDefs } from 'ag-charts-core';
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
        ...undocumentedDefs({
            maxAnimatableItems: positiveNumber,
        }),
    },
    themeTemplate: {
        enabled: { $if: [{ $path: ['../flashOnUpdate/enabled', false] }, false, true] },
    },

    create: (ctx) => new Animation(ctx),
};
