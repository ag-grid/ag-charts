import { type ColDef, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

// Enterprise bundle (includes all community features) — needed for the Set Filter.
ModuleRegistry.registerModules([AllEnterpriseModule]);

// The grid theme API derives shades from literal colours, so these mirror the Signal tokens in procurement.css.
export const gridTheme = themeQuartz.withParams({
    backgroundColor: '#ffffff', // --color-panel
    foregroundColor: '#17181a', // --color-text-primary
    headerBackgroundColor: '#ffffff', // --color-panel: the header is type, not a band
    headerTextColor: '#6b6e72', // --color-text-secondary
    borderColor: '#e6e6e3', // --color-border
    oddRowBackgroundColor: '#f0f0ee', // --color-panel-alt, the theme's alternating row
    accentColor: '#b23a2e', // --color-accent
    selectedRowBackgroundColor: 'rgba(178, 58, 46, 0.1)',
    rowHoverColor: 'rgba(178, 58, 46, 0.06)',
    fontFamily: 'inherit',
    fontSize: 13,
    // The theme's data-grid pattern sets the header a step below body text, in the secondary ink.
    headerFontSize: 11,
    wrapperBorderRadius: 8,
    cellHorizontalPadding: 14,
});

/**
 * The roster's variant: same chrome, tighter cells.
 *
 * It carries seven columns in a half-width card, where the default 14px of padding either side of
 * every cell is most of the width budget — and padding is the only thing that can go without taking
 * a column or a figure with it.
 */
export const compactGridTheme = gridTheme.withParams({ cellHorizontalPadding: 8 });

export const baseColDef = <T>(): ColDef<T> => ({
    flex: 1,
    minWidth: 90,
    sortable: true,
    resizable: true,
    suppressHeaderMenuButton: true,
});

/** Number filter options the demo offers, including a range. */
export const NUMBER_FILTER_PARAMS = {
    filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange'],
    inRangeInclusive: true,
};

/** Date filter options the demo offers, including a range. */
export const DATE_FILTER_PARAMS = {
    filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange'],
    inRangeInclusive: true,
};
