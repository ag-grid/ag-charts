import { type AgGradientLegendOptions, _ModuleSupport } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { GradientLegend } from './gradientLegend';

export const GradientLegendModule: PluginModuleDefinition<AgGradientLegendOptions> = {
    type: 'plugin',
    name: 'gradientLegend',
    enterprise: true,
    // removable: 'standalone-only',

    themeTemplate: {
        enabled: false,
        position: 'bottom',
        spacing: 20,
        scale: {
            padding: 13,
            label: {
                color: { $ref: 'textColor' },
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                minSpacing: 5,
            },
            interval: {
                minSpacing: 15,
            },
        },
        gradient: {
            preferredLength: 100,
            thickness: 16,
        },
        reverseOrder: false,
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $ref: 'chartBackgroundColour' },
                ['gradient', _ModuleSupport.FILL_GRADIENT_BLANK_DEFAULTS],
                ['pattern', _ModuleSupport.FILL_PATTERN_BLANK_DEFAULTS],
                ['image', _ModuleSupport.FILL_IMAGE_BLANK_DEFAULTS],
            ],
        },
    },

    create: (ctx) => new GradientLegend(ctx),
};
