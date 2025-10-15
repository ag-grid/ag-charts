import { type PluginModuleDefinition, boolean, color, defined } from 'ag-charts-core';
import type { AgChartBackground } from 'ag-charts-types';

import { Background } from './background';

// Community version does not support background images.
export const BackgroundModule: PluginModuleDefinition<AgChartBackground> = {
    type: 'plugin',
    name: 'background',

    options: {
        visible: boolean,
        fill: color,
        image: defined, // enterprise
    },

    create: (ctx) => new Background(ctx),
};
