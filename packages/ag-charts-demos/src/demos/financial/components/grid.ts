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

// Dark theme tuned to match the terminal palette (see financial.css).
export const gridTheme = themeQuartz.withPart(colorSchemeDark).withParams({
    backgroundColor: '#161b22',
    foregroundColor: '#e6edf3',
    headerBackgroundColor: '#161b22',
    headerTextColor: '#8b949e',
    borderColor: '#2a313c',
    oddRowBackgroundColor: 'transparent',
    accentColor: '#388bfd',
    selectedRowBackgroundColor: 'rgba(56, 139, 253, 0.14)',
    fontFamily: 'inherit',
    fontSize: 11,
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
