import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { GradientLegend } from './gradientLegend';

export const GradientLegendModule: _ModuleSupport.LegendModule = {
    type: 'legend',
    optionsKey: 'gradientLegend',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion'],

    identifier: 'gradient',
    instanceConstructor: GradientLegend,

    themeTemplate: {
        enabled: false,
        position: 'bottom',
        spacing: 20,
        scale: {
            padding: 8,
            label: {
                color: _Theme.DEFAULT_LABEL_COLOUR,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                formatter: undefined,
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
