import type { ModuleScope } from 'ag-charts-core';
import type { AgChartAllThemeParams, AgChartTheme, WithThemeParams } from 'ag-charts-types';

import { accessiblePalette, accessibleThemeParameters, withAccessibleOverrides } from './accessibleThemeOverrides';
import { ChartTheme, type ThemeParamDefaults } from './chartTheme';
import type { DefaultColors } from './defaultColors';

const ACCESSIBLE_LIGHT_COLORS = {
    BLUE: '#4884cb',
    ORANGE: '#be6503',
    GREEN: '#257a38',
    CYAN: '#0f99b6',
    YELLOW: '#a59302',
    VIOLET: '#5a2e86',
    GRAY: '#606060',
    MAGENTA: '#8a2e78',
    BROWN: '#442c01',
    RED: '#d53a3c',
};

const ACCESSIBLE_LIGHT_STROKES: typeof ACCESSIBLE_LIGHT_COLORS = {
    BLUE: '#346cae',
    ORANGE: '#9c5204',
    GREEN: '#016222',
    CYAN: '#0a7f97',
    YELLOW: '#8a7b07',
    VIOLET: '#44156d',
    GRAY: '#4a4a4a',
    MAGENTA: '#711261',
    BROWN: '#2b1a00',
    RED: '#b81724',
};

export class AccessibleLight extends ChartTheme {
    constructor(options: AgChartTheme = {}, presetName?: string, moduleRegistry?: ModuleScope) {
        super(withAccessibleOverrides(options), presetName, moduleRegistry);
    }

    override getDefaultColors(): DefaultColors {
        const colors = ACCESSIBLE_LIGHT_COLORS;
        const strokes = ACCESSIBLE_LIGHT_STROKES;
        return {
            ...super.getDefaultColors(),
            ...accessiblePalette(colors),
            strokes,
            divergingColors: [colors.BLUE, colors.ORANGE],
            up: { fill: colors.GREEN, stroke: strokes.GREEN },
            down: { fill: colors.ORANGE, stroke: strokes.ORANGE },
            neutral: { fill: colors.GRAY, stroke: strokes.GRAY },
            altUp: { fill: colors.BLUE, stroke: strokes.BLUE },
            altDown: { fill: colors.MAGENTA, stroke: strokes.MAGENTA },
            altNeutral: { fill: colors.GRAY, stroke: strokes.GRAY },
        };
    }

    override getThemeParameters(): ThemeParamDefaults<WithThemeParams<AgChartAllThemeParams>> {
        return {
            ...super.getThemeParameters(),
            ...accessibleThemeParameters('#0a4f96'),
        };
    }
}
