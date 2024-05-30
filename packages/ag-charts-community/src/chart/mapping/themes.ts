import type { AgChartTheme, AgChartThemeName, AgChartThemeOverrides } from '../../options/agChartOptions';
import { arrayOf, isValid, object, or, string } from '../../sandbox/util/validation';
import { Logger } from '../../util/logger';
import { mergeDefaults } from '../../util/object';
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

export type ThemeMap = { [key in AgChartThemeName]: () => ChartTheme };

const lightTheme = () => new ChartTheme();
const darkTheme = () => new DarkTheme();

export const themes: ThemeMap = {
    // lightThemes
    'ag-default': lightTheme,
    'ag-sheets': () => new SheetsLight(),
    'ag-polychroma': () => new PolychromaLight(),
    'ag-vivid': () => new VividLight(),
    'ag-material': () => new MaterialLight(),

    // darkThemes
    'ag-default-dark': darkTheme,
    'ag-sheets-dark': () => new SheetsDark(),
    'ag-polychroma-dark': () => new PolychromaDark(),
    'ag-vivid-dark': () => new VividDark(),
    'ag-material-dark': () => new MaterialDark(),
};

export function getChartTheme(unvalidatedValue: unknown): ChartTheme {
    // unvalidatedValue is either a built-in theme (`string | ChartTheme`) or a user defined theme (`AgChartTheme`).
    const value = validateChartTheme(unvalidatedValue);

    if (value instanceof ChartTheme) {
        return value;
    }

    if (value == null) {
        return lightTheme();
    }

    if (typeof value === 'string') {
        if (!isChartThemeName(value)) {
            Logger.warnOnce(`the theme [${value}] is invalid, using [ag-default] instead.`);
            return lightTheme();
        }
        return themes[value]();
    }

    const flattenedTheme = flattenTheme(value);
    const baseTheme: any = flattenedTheme.baseTheme ? getChartTheme(flattenedTheme.baseTheme) : lightTheme();

    return new baseTheme.constructor(flattenedTheme);
}

function isChartThemeName(value: unknown): value is AgChartThemeName {
    return typeof value === 'string' && value in themes;
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

function validateChartTheme(value: unknown): ChartTheme | AgChartThemeName | AgChartTheme | undefined {
    if (value === undefined || value instanceof ChartTheme || isChartThemeName(value)) {
        return value;
    } else if (typeof value === 'object') {
        if (
            value !== null &&
            isValid<AgChartTheme>(
                value,
                {
                    baseTheme: or(string, object),
                    overrides: object,
                    palette: {
                        fills: arrayOf(string),
                        strokes: arrayOf(string),
                    },
                },
                'theme'
            )
        ) {
            return value;
        }
    } else {
        Logger.warn(`invalid theme value type ${typeof value}, expected object or string.`);
    }
}
