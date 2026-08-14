import {
    AllCommunityModule,
    type CellClassRules,
    type ColDef,
    type GetRowIdParams,
    ModuleRegistry,
    type ValueFormatterParams,
    colorSchemeDark,
    themeQuartz,
} from 'ag-grid-community';

import { fmtPrice } from '../format';
import { SparklineCell } from './SparklineCell';

ModuleRegistry.registerModules([AllCommunityModule]);

// Dark theme tuned to match the terminal palette. Colour params are emitted as CSS values
// onto the grid wrapper, which sits inside .fin-container, so they can reference the
// --fin-* tokens directly rather than duplicating them as literals.
export const gridTheme = themeQuartz.withPart(colorSchemeDark).withParams({
    backgroundColor: 'var(--fin-panel)',
    foregroundColor: 'var(--fin-text)',
    headerBackgroundColor: 'var(--fin-panel)',
    headerTextColor: 'var(--fin-muted)',
    borderColor: 'var(--fin-border)',
    // No outline around the grid: the app carries structure by surface tone, not lines.
    // The internal row rules stay, so a dense table is still readable.
    wrapperBorder: false,
    oddRowBackgroundColor: 'transparent',
    // Tints of the accent, which a var() alone cannot express: `ref`/`mix` resolves to a
    // color-mix() against the accent param, so both follow --fin-accent.
    rowHoverColor: { ref: 'accentColor', mix: 0.08 },
    accentColor: 'var(--fin-accent)',
    selectedRowBackgroundColor: { ref: 'accentColor', mix: 0.14 },
    // Picks up the container's monospace stack.
    fontFamily: 'inherit',
    fontSize: 11,
    headerFontSize: 10,
    headerFontWeight: 600,
    cellHorizontalPadding: 4,
    wrapperBorderRadius: 0,
    iconButtonBorderRadius: 0,
    // Hides the per-cell focus outline (financial.css rings the whole row instead) while
    // reserving its 1px width, so text never shifts on focus. `borderStyle: 'none'` would
    // collapse the width and cause that shift.
    rangeSelectionBorderColor: 'transparent',
});

export const signed = (n: number) => `${n >= 0 ? '+' : '−'}${fmtPrice(Math.abs(n))}`;
export const signedPct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;

// A value formatter that renders empty for null/undefined and applies `fmt` otherwise.
export const formatOrBlank =
    <T>(fmt: (value: number) => string) =>
    ({ value }: ValueFormatterParams<T, number>) =>
        value == null ? '' : fmt(value);

// Colour the change columns by sign, reusing the terminal's up/down classes.
export const upDownRules = <T>(): CellClassRules<T, number> => ({
    'fin-up': ({ value }) => value != null && value >= 0,
    'fin-down': ({ value }) => value != null && value < 0,
});

export const baseColDef = <T>(): ColDef<T> => ({
    flex: 1,
    minWidth: 40,
    sortable: true,
    resizable: false,
    suppressMovable: true,
});

export const getRowId = <T extends { ticker: string }>({ data }: GetRowIdParams<T>) => data.ticker;

// Feeds hand back a fresh object every tick, so row identity never matches; compare values. The
// rolling `history` must be compared element-wise — a scroll appending a value equal to the old tail
// would slip past a length + tail-only check.
export const rowValuesEqual = <T extends object>(a: T, b: T): boolean => {
    for (const key of Object.keys(a) as (keyof T)[]) {
        const av = a[key];
        const bv = b[key];
        if (Array.isArray(av) && Array.isArray(bv)) {
            if (av.length !== bv.length || av.some((v, i) => v !== bv[i])) return false;
        } else if (av !== bv) {
            return false;
        }
    }
    return true;
};

// A non-interactive trend column rendering each row's price history as a sparkline.
export const sparklineColDef = <T extends { history: number[] }>(): ColDef<T> => ({
    colId: 'history',
    headerName: 'Trend',
    flex: 1.3,
    minWidth: 64,
    sortable: false,
    resizable: false,
    suppressMovable: true,
    cellClass: 'fin-sparkline-col',
    cellRenderer: SparklineCell,
});
