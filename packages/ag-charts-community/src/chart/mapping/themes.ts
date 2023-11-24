import type {
    AgChartTheme,
    AgChartThemeName,
    AgChartThemeOverrides,
    AgChartThemePalette,
} from '../../options/agChartOptions';
import { jsonMerge } from '../../util/json';
import { Logger } from '../../util/logger';
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

export type ThemeMap = { [key in AgChartThemeName | 'undefined' | 'null']?: () => ChartTheme };

const lightTheme = () => new ChartTheme();
const darkTheme = () => new DarkTheme();

const lightThemes: ThemeMap = {
    undefined: lightTheme,
    null: lightTheme,
    'ag-default': lightTheme,
    'ag-sheets': () => new SheetsLight(),
    'ag-polychroma': () => new PolychromaLight(),
    'ag-vivid': () => new VividLight(),
    'ag-material': () => new MaterialLight(),
};

const darkThemes: ThemeMap = {
    undefined: darkTheme,
    null: darkTheme,
    'ag-default-dark': darkTheme,
    'ag-sheets-dark': () => new SheetsDark(),
    'ag-polychroma-dark': () => new PolychromaDark(),
    'ag-vivid-dark': () => new VividDark(),
    'ag-material-dark': () => new MaterialDark(),
};

export const themes: ThemeMap = {
    ...darkThemes,
    ...lightThemes,
};

type Unvalidate<T> = { [K in keyof T]?: unknown };
function validateChartThemeObject(unknownObject: object | null): AgChartTheme | undefined {
    if (unknownObject === null) {
        return undefined;
    }

    let valid = true;
    const { baseTheme, palette, overrides } = unknownObject as Unvalidate<AgChartTheme>;

    if (baseTheme !== undefined && typeof baseTheme !== 'string') {
        Logger.warn(`invalid theme.baseTheme type ${typeof baseTheme}, expected string.`);
        valid = false;
    }
    if (overrides !== undefined && typeof overrides !== 'object') {
        Logger.warn(`invalid theme.overrides type ${typeof overrides}, expected object.`);
        valid = false;
    }
    if (typeof palette === 'object') {
        if (palette !== null) {
            const { fills, strokes } = palette as Unvalidate<AgChartThemePalette>;
            if (!Array.isArray(fills)) {
                Logger.warn(`theme.overrides.fills must be a defined array`);
                valid = false;
            }
            if (strokes === undefined) {
                Logger.warn(`theme.overrides.strokes must be a defined array`);
                valid = false;
            }
        }
    } else {
        Logger.warn(`invalid theme.palette type ${typeof palette}, expected object.`);
        valid = false;
    }

    if (valid) {
        return unknownObject as AgChartTheme;
    }
    return undefined;
}

function validateChartTheme(value: unknown): string | ChartTheme | AgChartTheme | undefined {
    if (value === undefined || typeof value === 'string' || value instanceof ChartTheme) {
        return value;
    }

    if (typeof value === 'object') {
        return validateChartThemeObject(value);
    }

    Logger.warn(`invalid theme value type ${typeof value}, expected object.`);
    return undefined;
}

export function getChartTheme(unvalidatedValue: unknown): ChartTheme {
    let value = validateChartTheme(unvalidatedValue);

    if (value instanceof ChartTheme) {
        return value;
    }

    if (value === undefined || typeof value === 'string') {
        const stockTheme = themes[value as AgChartThemeName];
        if (stockTheme) {
            return stockTheme();
        }
        Logger.warnOnce(`the theme [${value}] is invalid, using [ag-default] instead.`);
        return lightTheme();
    }

    // Flatten recursive themes.
    const overrides: AgChartThemeOverrides[] = [];
    let palette;
    while (typeof value === 'object') {
        overrides.push(value.overrides ?? {});

        // Use first palette found, they can't be merged.
        if (value.palette && palette == null) {
            palette = value.palette;
        }

        value = value.baseTheme;
    }
    overrides.reverse();

    const flattenedTheme = {
        baseTheme: value,
        overrides: jsonMerge(overrides),
        ...(palette ? { palette } : {}),
    };

    const baseTheme: any = flattenedTheme.baseTheme ? getChartTheme(flattenedTheme.baseTheme) : lightTheme();

    return new baseTheme.constructor(flattenedTheme);
}
