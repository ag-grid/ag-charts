import {
    AllCommunityModule,
    type CellClassRules,
    type ColDef,
    type ColDefField,
    type GetRowIdParams,
    ModuleRegistry,
    type ValueFormatterParams,
    colorSchemeDark,
    themeQuartz,
} from 'ag-grid-community';

import { fmtPrice } from '../format';
import { SparklineCell } from './SparklineCell';
import { TickerCell } from './TickerCell';

ModuleRegistry.registerModules([AllCommunityModule]);

// Colour params are emitted as CSS values inside .fin-container, so they can reference --fin-* directly.
export const gridTheme = themeQuartz.withPart(colorSchemeDark).withParams({
    backgroundColor: 'var(--fin-panel)',
    foregroundColor: 'var(--fin-text)',
    headerBackgroundColor: 'var(--fin-panel)',
    headerTextColor: 'var(--fin-muted)',
    borderColor: 'var(--fin-border)',
    // No outline around the grid: the app carries structure by surface tone, not lines.
    wrapperBorder: false,
    oddRowBackgroundColor: 'transparent',
    // `ref`/`mix` resolves to a color-mix() against the accent param, so tints follow --fin-accent.
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
    // Reserve the outline's 1px width so text never shifts on focus; `borderStyle: 'none'` would collapse it.
    rangeSelectionBorderColor: 'transparent',
});

export const signed = (n: number) => `${n >= 0 ? '+' : '−'}${fmtPrice(Math.abs(n))}`;
export const signedPct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;

export const formatOrBlank =
    <T>(fmt: (value: number) => string) =>
    ({ value }: ValueFormatterParams<T, number>) =>
        value == null ? '' : fmt(value);

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

// Row identity never matches, so compare values; `history` element-wise, as an appended duplicate tail slips past a length check.
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

// The fields are parameters because `ColDefField` only resolves against a concrete row type.
export const tickerColDef = <T>(field: ColDefField<T>, tooltipField: ColDefField<T>): ColDef<T> => ({
    field,
    headerName: 'Ticker',
    flex: 1.35,
    minWidth: 74,
    tooltipField,
    cellRenderer: TickerCell,
});

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
