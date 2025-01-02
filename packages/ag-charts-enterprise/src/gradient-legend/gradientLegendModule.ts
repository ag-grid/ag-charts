import { _ModuleSupport } from 'ag-charts-community';

import { GradientLegend } from './gradientLegend';

const {
    ThemeSymbols: { DEFAULT_LABEL_COLOUR },
} = _ModuleSupport;

export const GradientLegendModule: _ModuleSupport.LegendModule = {
    type: 'legend',
    optionsKey: 'gradientLegend',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion', 'standalone', 'gauge'],

    identifier: 'gradient',
    moduleFactory: (ctx) => new GradientLegend(ctx),

    themeTemplate: {
        enabled: false,
        position: 'bottom',
        spacing: 20,
        scale: {
            padding: 13,
            label: {
                color: DEFAULT_LABEL_COLOUR,
                fontSize: { ref: 'fontSize' as const },
                fontFamily: { ref: 'fontFamily' as const },
            },
            interval: {
                minSpacing: 1,
            },
        },
        gradient: {
            preferredLength: 100,
            thickness: 16,
        },
        reverseOrder: false,
    },

    removable: 'standalone-only',
};
