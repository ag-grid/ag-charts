import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { GradientLegend } from './gradientLegend';

export const GradientLegendModule: _ModuleSupport.LegendModule = {
    type: 'legend',
    optionsKey: 'gradientLegend',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion', 'gauge'],

    identifier: 'gradient',
    moduleFactory: (ctx) => new GradientLegend(ctx),

    themeTemplate: {
        enabled: false,
        position: 'bottom',
        spacing: 20,
        scale: {
            padding: 13,
            label: {
                color: _Theme.DEFAULT_LABEL_COLOUR,
                fontSize: _Theme.FONT_SIZE.SMALL,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
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
