import {
    type Palette,
    type PaletteAccent,
    deriveStroke,
    paletteIsEmpty,
} from '@ag-website-shared/components/theme-builder/palette';
import type { ValidationResult } from '@ag-website-shared/components/theme-builder/themeImport';
import {
    type PageBackgroundColors,
    parseThemeCode,
    validateAndConvertToPreset,
} from '@ag-website-shared/theming/parseThemeCode';
import { type Preset, applyPreset } from '@ag-website-shared/theming/preset';
import type { Store } from '@ag-website-shared/theming/store';
import { _Theme } from 'ag-charts-community';
import type { AgChartThemeName } from 'ag-charts-community';

import { PUBLIC_PARAM_NAMES } from './chartsTheme';
import { setStoredPalette } from './paletteModel';
import { setImportedBaseTheme } from './presetModel';

/**
 * The inbound half of the theme snippet, mirroring `chartsThemeOutput.ts`: read
 * an `AgChartTheme` object literal back into the builder.
 *
 * There is no charts-shaped tokenizer to write, because `parseThemeCode` does
 * not parse a shape - it scans for any name the host recognises and reads the
 * value after it, wherever it sits. So a theme's `params` block, its `palette`
 * and its `baseTheme` are all found in one pass, and the `withParams` chain grid
 * and Studio emit needs no special case here.
 *
 * Nor is there much to convert. The two formats were designed to line up, and
 * the one place they differ - a pixel length, which AG Charts writes as a plain
 * number - is a form the builder already holds natively: every stock default and
 * every preset stores lengths as numbers, and `lengthValueToCss` turns one into
 * `Npx` itself. So param values pass through untouched, and what is left to do
 * is the palette, whose editor carries bookkeeping a theme cannot.
 */

/** Charts' own preset backgrounds, so an imported theme lands on one of them. */
const CHARTS_PAGE_BACKGROUND_COLORS: PageBackgroundColors = { light: '#FAFAFA', dark: '#141B26' };

const PARAM_NAMES = new Set(PUBLIC_PARAM_NAMES);
const THEME_NAMES = new Set(Object.keys(_Theme.themes));

/** The two keys of a theme object that are not params. */
const PALETTE_KEY = 'palette';
const BASE_THEME_KEY = 'baseTheme';

const NO_THEME_ERROR =
    "Could not find an AG Charts theme. Expected code like: export const myTheme = { params: { backgroundColor: '#fff' } }";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value != null && !Array.isArray(value);

const asColor = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const toAccent = (value: unknown): PaletteAccent | undefined =>
    isPlainObject(value) ? { fill: asColor(value.fill), stroke: asColor(value.stroke) } : undefined;

/**
 * An `AgChartThemePalette` in the editor's shape.
 *
 * Fills and strokes are index-paired, so a fill the editor cannot show - a
 * gradient or a pattern, which `fills` also admits - takes its stroke with it
 * rather than shifting every later stroke onto the wrong fill.
 */
const toEditorPalette = (value: unknown, warnings: string[]): Palette | undefined => {
    if (!isPlainObject(value)) {
        warnings.push(`Ignored palette: ${JSON.stringify(value)} is not a palette object`);
        return undefined;
    }

    const rawFills = Array.isArray(value.fills) ? value.fills : [];
    const rawStrokes = Array.isArray(value.strokes) ? value.strokes : [];
    const fills: string[] = [];
    const strokes: string[] = [];
    let droppedFills = 0;
    rawFills.forEach((fill, index) => {
        if (typeof fill !== 'string') {
            droppedFills++;
            return;
        }
        fills.push(fill);
        // A palette may carry fills alone, and AG Charts then outlines each
        // series in the colour it would have derived anyway.
        strokes.push(asColor(rawStrokes[index]) ?? deriveStroke(fill));
    });
    if (droppedFills > 0) {
        warnings.push(
            `Ignored ${droppedFills} palette ${droppedFills === 1 ? 'colour' : 'colours'} that ${droppedFills === 1 ? 'is' : 'are'} not a plain colour`
        );
    }

    const palette: Palette = {
        fills,
        strokes,
        // `toThemePalette` writes "strokes off" as a stroke matching its fill,
        // an AG Charts palette having no way to say "no stroke" - so a palette
        // whose every stroke is its own fill is one whose strokes were switched
        // off, and reading it back that way returns the toggle to where the user
        // left it instead of leaving it on over outlines nobody can see.
        ...(strokesMatchFills(fills, strokes) ? { strokesEnabled: false } : {}),
        // `strokesDerived` is deliberately absent, which means derived. A theme
        // does not record which strokes were chosen and which followed their
        // fill, and it cannot be inferred: re-deriving each fill and comparing
        // would read a stock palette's hand-tuned strokes as chosen, since they
        // are close to the derived colour but not equal to it. Absent gives the
        // imported strokes the same standing as a stock theme's - shown as they
        // arrived, and replaced only once the fill they belong to changes.
        ...accentEntries(value),
    };

    return paletteIsEmpty(palette) ? undefined : palette;
};

const strokesMatchFills = (fills: string[], strokes: string[]) =>
    fills.length > 0 && fills.every((fill, index) => strokes[index]?.toLowerCase() === fill.toLowerCase());

const accentEntries = (value: Record<string, unknown>) => {
    const entries: Partial<Pick<Palette, 'up' | 'down' | 'neutral'>> = {};
    for (const key of ['up', 'down', 'neutral'] as const) {
        const accent = toAccent(value[key]);
        if (accent) {
            entries[key] = accent;
        }
    }
    return entries;
};

const countedParams = (count: number) => `${count} theme parameter${count === 1 ? '' : 's'}`;

const andList = (items: string[]) =>
    items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/**
 * Read pasted code as an AG Charts theme, for the shared import dialog.
 *
 * A theme can be partial in every direction - params only, a palette only, a
 * base theme only - so anything recognised is enough to apply, and the summary
 * names what was found rather than counting params alone.
 */
export const validateChartsThemeCode = (code: string): ValidationResult => {
    if (!code.trim()) {
        return { status: 'empty', validParamCount: 0 };
    }

    const parseResult = parseThemeCode(code, {
        isRecognizedParam: (key) => PARAM_NAMES.has(key) || key === PALETTE_KEY || key === BASE_THEME_KEY,
        noParamsError: NO_THEME_ERROR,
    });
    if (!parseResult.success) {
        return { status: 'error', validParamCount: 0, error: parseResult.error };
    }

    const { [PALETTE_KEY]: rawPalette, [BASE_THEME_KEY]: rawBaseTheme, ...rawParams } = parseResult.params;
    const ownWarnings: string[] = [];

    const palette = rawPalette === undefined ? undefined : toEditorPalette(rawPalette, ownWarnings);

    let baseTheme: AgChartThemeName | undefined;
    if (rawBaseTheme !== undefined) {
        if (typeof rawBaseTheme === 'string' && THEME_NAMES.has(rawBaseTheme)) {
            baseTheme = rawBaseTheme as AgChartThemeName;
        } else {
            ownWarnings.push(`Ignored unknown base theme: ${JSON.stringify(rawBaseTheme)}`);
        }
    }

    const { preset, warnings } = validateAndConvertToPreset(
        { ...parseResult, params: rawParams },
        CHARTS_PAGE_BACKGROUND_COLORS
    );
    const paramCount = Object.keys(preset.params).length;
    const found = [
        ...(paramCount > 0 ? [countedParams(paramCount)] : []),
        ...(palette ? ['a palette'] : []),
        ...(baseTheme ? [`the ${baseTheme} base theme`] : []),
    ];

    const allWarnings = [...warnings, ...ownWarnings];
    if (found.length === 0) {
        return {
            status: 'error',
            validParamCount: 0,
            error: allWarnings.length > 0 ? allWarnings.join('\n') : NO_THEME_ERROR,
        };
    }

    const apply = (store: Store) => {
        // Params first: `applyPreset` clears every param the theme does not
        // name, which is what makes this an import rather than a merge, and it
        // resets the pinned "All Parameters" list - so the palette and the base
        // theme, which it knows nothing about, are set after it and not before.
        applyPreset(store, preset as Preset);
        if (palette) {
            setStoredPalette(store, palette);
        }
        if (baseTheme) {
            setImportedBaseTheme(store, baseTheme);
        }
    };

    const summary = `Found ${andList(found)}`;
    if (allWarnings.length === 0) {
        return { status: 'success', validParamCount: paramCount, summary, apply };
    }
    return { status: 'warning', validParamCount: paramCount, summary, apply, warnings: allWarnings };
};
