import { type ColDef, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

// Enterprise bundle (includes all community features) — needed for the Set Filter.
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Light Quartz theme matching the dashboard chrome. The grid theme API takes literal
// colours, so these mirror the --wa-* tokens in web-analytics.css — change both.
export const gridTheme = themeQuartz.withParams({
    backgroundColor: '#ffffff',
    foregroundColor: '#14202e',
    headerBackgroundColor: '#f7f9fc',
    headerTextColor: '#5b6777',
    borderColor: '#dbe2ec',
    oddRowBackgroundColor: '#f7f9fc',
    accentColor: '#2a78d6',
    selectedRowBackgroundColor: 'rgba(42, 120, 214, 0.1)',
    rowHoverColor: 'rgba(42, 120, 214, 0.06)',
    fontFamily: 'inherit',
    fontSize: 13,
    headerFontSize: 12,
    wrapperBorderRadius: 8,
    cellHorizontalPadding: 14,
});

export const baseColDef = <T>(): ColDef<T> => ({
    flex: 1,
    minWidth: 90,
    sortable: true,
    resizable: true,
    filter: true,
    suppressHeaderMenuButton: true,
});
