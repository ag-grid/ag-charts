import { _ModuleSupport } from 'ag-charts-community';

import { GradientLegend } from './gradientLegend';

const {
    ThemeSymbols: { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR },
    ThemeConstants: { FONT_SIZE },
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
                fontSize: FONT_SIZE.SMALL,
                fontFamily: DEFAULT_FONT_FAMILY,
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
};
