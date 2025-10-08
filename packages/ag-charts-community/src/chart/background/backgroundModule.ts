import { type PluginModuleDefinition, boolean, color } from 'ag-charts-core';
import type { AgChartBackground } from 'ag-charts-types';

import { Background } from './background';

// Community version does not support background images.
export const BackgroundModule: PluginModuleDefinition<Omit<AgChartBackground, 'image'>> = {
    type: 'plugin',
    name: 'background',

    options: {
        visible: boolean,
        fill: color,
    },

    create: (ctx) => new Background(ctx),
};
