import type { AgChartTheme, AgChartThemeName, AgChartThemeOverrides } from '../../options/agChartOptions';
import { arrayOf, isValid, object, or, runValidator, string, union } from '../../sandbox/util/validation';
import { Logger } from '../../util/logger';
import { mergeDefaults } from '../../util/object';
import { isObject } from '../../util/type-guards';
import { ChartTheme } from '../themes/chartTheme';
import { DarkTheme } from '../themes/darkTheme';
import { MaterialDark } from '../themes/materialDark';
import { MaterialLight } from '../themes/materialLight';
import { PolychromaDark } from '../themes/polychromaDark';
import { PolychromaLight } from '../themes/polychromaLight';
import { SheetsDark } from '../themes/sheetsDark';
import { SheetsLight } from '../themes/sheetsLight';
import { VividDark } from '../themes/vividDark';
import { VividLight } from '../themes/vividLight';

export const themesMap = new Map<AgChartThemeName, () => ChartTheme>([
    ['ag-default', () => new ChartTheme()],
    ['ag-default-dark', () => new DarkTheme()],
    ['ag-sheets', () => new SheetsLight()],
    ['ag-sheets-dark', () => new SheetsDark()],
    ['ag-polychroma', () => new PolychromaLight()],
    ['ag-polychroma-dark', () => new PolychromaDark()],
    ['ag-vivid', () => new VividLight()],
    ['ag-vivid-dark', () => new VividDark()],
    ['ag-material', () => new MaterialLight()],
    ['ag-material-dark', () => new MaterialDark()],
]);

export function getChartTheme(themeOptions: unknown): ChartTheme {
    if (themeOptions == null) {
        return new ChartTheme();
    }

    if (!isValidThemeOptions(themeOptions)) {
        Logger.warn(`invalid theme value type ${typeof themeOptions}, expected object or string.`);
        return new ChartTheme();
    }

    if (themeOptions instanceof ChartTheme) {
        return themeOptions;
    }

    if (typeof themeOptions === 'string') {
        return themesMap.get(themeOptions)!();
    }

    const flattenedTheme = flattenTheme(themeOptions);
    if (flattenedTheme.baseTheme) {
        const baseTheme: any = getChartTheme(flattenedTheme.baseTheme);
        return new baseTheme.constructor(flattenedTheme);
    } else {
        return new ChartTheme(flattenedTheme);
    }
}

// Flatten recursive themes.
function flattenTheme(theme?: AgChartTheme | AgChartThemeName) {
    const overrides: (AgChartThemeOverrides | undefined)[] = [];
    let palette;
    while (typeof theme === 'object') {
        overrides.push(theme.overrides);
        palette ??= theme.palette; // Use first palette found, they can't be merged.
        theme = theme.baseTheme;
    }
    return {
        baseTheme: theme,
        overrides: mergeDefaults(...overrides),
        palette,
    };
}

function isValidThemeOptions(themeOptions: unknown): themeOptions is ChartTheme | AgChartThemeName | AgChartTheme {
    if (themeOptions instanceof ChartTheme) {
        return true;
    }

    const baseThemeValidator = or(union(...themesMap.keys()), object);
    const typeError = runValidator(baseThemeValidator, themeOptions, 'theme');

    if (typeError) {
        Logger.warn(typeError);
        return false;
    }

    return (
        !isObject(themeOptions) ||
        isValid<AgChartTheme>(
            themeOptions,
            {
                baseTheme: baseThemeValidator,
                overrides: object,
                palette: {
                    fills: arrayOf(string),
                    strokes: arrayOf(string),
                },
            },
            'theme'
        )
    );
}
