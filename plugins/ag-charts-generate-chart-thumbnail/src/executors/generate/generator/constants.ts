import type { AgChartThemeName } from 'ag-charts-community';

export const DETAIL_FULL_HEIGHT = 586;
export const DETAIL_FULL_WIDTH = 1766;

export const DEFAULT_THUMBNAIL_ASPECT_RATIO = 16 / 10;
export const DEFAULT_THUMBNAIL_WIDTH = 600;
export const DEFAULT_THUMBNAIL_HEIGHT = DEFAULT_THUMBNAIL_WIDTH / DEFAULT_THUMBNAIL_ASPECT_RATIO;

export const MIN_ASPECT_RATIO = 1 / 3;
export const MAX_ASPECT_RATIO = 12 / 1;

export const THUMBNAIL_POOL_SIZE = 1;

export const BACKGROUND_COLORS: Record<AgChartThemeName, string> = {
    'ag-default': '#ffffff',
    'ag-default-dark': '#141D2C',
    'ag-sheets': '#ffffff',
    'ag-sheets-dark': '#141D2C',
    'ag-polychroma': '#ffffff',
    'ag-polychroma-dark': '#141D2C',
    'ag-vivid': '#ffffff',
    'ag-vivid-dark': '#141D2C',
    'ag-material': '#ffffff',
    'ag-material-dark': '#141D2C',
    'ag-financial': '#ffffff',
    'ag-financial-dark': '#141D2C',
};
