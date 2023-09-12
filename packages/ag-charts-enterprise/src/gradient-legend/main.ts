import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { GradientLegend } from './gradientLegend';
import { GRADIENT_LEGEND_THEME } from './gradientLegendThemes';

export const GradientLegendModule: _ModuleSupport.LegendModule = {
    type: 'legend',
    optionsKey: 'gradientLegend',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],

    identifier: 'gradient',
    instanceConstructor: GradientLegend,

    themeTemplate: GRADIENT_LEGEND_THEME,
};
