import { _ModuleSupport } from 'ag-charts-community';

import { GradientLegend } from './gradientLegend';

export const GradientLegendModule: _ModuleSupport.LegendModule = {
    type: 'legend',
    optionsKey: 'gradientLegend',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],

    identifier: 'gradient',
    moduleFactory: (ctx) => new GradientLegend(ctx),

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

    removable: 'standalone-only',
};
