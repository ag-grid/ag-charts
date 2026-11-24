import type { ModuleScope } from 'ag-charts-core';
import type { AgChartAllThemeParams, AgChartPrivateThemeParams, AgChartTheme, WithThemeParams } from 'ag-charts-types';

import {
    SEPARATOR_PRIMARY,
    accessibleDefaultColors,
    accessibleThemeParameters,
    withAccessibleTheme,
} from './accessibleThemeOverrides';
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
        super(withAccessibleTheme(options, ACCESSIBLE_DARK_COLORS), presetName, moduleRegistry);
    }

    override getDefaultColors(): DefaultColors {
        return {
            ...super.getDefaultColors(),
            ...accessibleDefaultColors(ACCESSIBLE_DARK_COLORS, ACCESSIBLE_DARK_STROKES, 'ORANGE'),
        };
    }

    override getThemeParameters(): ThemeParamDefaults<WithThemeParams<AgChartAllThemeParams>> {
        return {
            ...super.getThemeParameters(),
            ...accessibleThemeParameters({
                accentColor: '#a5b4fc',
                foregroundColor: '#fff',
                backgroundColor: '#000',
                subtleTextMix: 0.7,
            }),
        };
    }

    protected override getPrivateParameters(): Required<WithThemeParams<AgChartPrivateThemeParams>> {
        return {
            ...super.getPrivateParameters(),
            annotationHandleColor: { $ref: 'backgroundColor' },
            annotationTextboxBackgroundColor: { $foregroundBackgroundMix: 0.1 },
            annotationTextboxBorderColor: SEPARATOR_PRIMARY,
        };
    }
}
