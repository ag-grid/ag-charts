import type { ModuleScope } from 'ag-charts-core';
import type { AgChartAllThemeParams, AgChartTheme, WithThemeParams } from 'ag-charts-types';

import { accessiblePalette, accessibleThemeParameters, withAccessibleOverrides } from './accessibleThemeOverrides';
import type { ThemeParamDefaults } from './chartTheme';
import { DarkTheme } from './darkTheme';
import type { DefaultColors } from './defaultColors';

const ACCESSIBLE_DARK_COLORS = {
    BLUE: '#56b4e9',
    ORANGE: '#e69f00',
    GREEN: '#2fbf8f',
    PURPLE: '#b39ddb',
    YELLOW: '#f0e442',
    PINK: '#e48bc0',
    RED: '#ff7b6b',
    GRAY: '#c0c0c0',
    LIME: '#a6d854',
    PERIWINKLE: '#8c9eff',
};

const ACCESSIBLE_DARK_STROKES: typeof ACCESSIBLE_DARK_COLORS = {
    BLUE: '#7acdff',
    ORANGE: '#feba46',
    GREEN: '#52d9a8',
    PURPLE: '#ccb6f6',
    YELLOW: '#fdf153',
    PINK: '#ffa5da',
    RED: '#fea89c',
    GRAY: '#dadada',
    LIME: '#bff370',
    PERIWINKLE: '#adbbfe',
};

export class AccessibleDark extends DarkTheme {
    constructor(options: AgChartTheme = {}, presetName?: string, moduleRegistry?: ModuleScope) {
        super(withAccessibleOverrides(options), presetName, moduleRegistry);
    }

    override getDefaultColors(): DefaultColors {
        const colors = ACCESSIBLE_DARK_COLORS;
        const strokes = ACCESSIBLE_DARK_STROKES;
        return {
            ...super.getDefaultColors(),
            ...accessiblePalette(colors),
            strokes,
            divergingColors: [colors.BLUE, colors.ORANGE],
            up: { fill: colors.GREEN, stroke: strokes.GREEN },
            down: { fill: colors.ORANGE, stroke: strokes.ORANGE },
            neutral: { fill: colors.GRAY, stroke: strokes.GRAY },
            altUp: { fill: colors.BLUE, stroke: strokes.BLUE },
            altDown: { fill: colors.ORANGE, stroke: strokes.ORANGE },
            altNeutral: { fill: colors.GRAY, stroke: strokes.GRAY },
        };
    }

    override getThemeParameters(): ThemeParamDefaults<WithThemeParams<AgChartAllThemeParams>> {
        return {
            ...super.getThemeParameters(),
            ...accessibleThemeParameters('#8cc8ff'),
        };
    }
}
