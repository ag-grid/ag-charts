import type { AgChartThemeName } from 'ag-charts-community';

export const DETAIL_FULL_HEIGHT = 586;
export const DETAIL_FULL_WIDTH = 1766;

export const DEFAULT_THUMBNAIL_ASPECT_RATIO = 16 / 10;
export const DEFAULT_THUMBNAIL_WIDTH = 600;
export const DEFAULT_THUMBNAIL_HEIGHT = DEFAULT_THUMBNAIL_WIDTH / DEFAULT_THUMBNAIL_ASPECT_RATIO;

export const MIN_ASPECT_RATIO = 1 / 3;

export const THUMBNAIL_POOL_SIZE = 1;

export const BACKGROUND_COLORS: Record<AgChartThemeName, string> = {
    'ag-default': '#ffffff',
    'ag-default-dark': '#182230',
    'ag-sheets': '#ffffff',
    'ag-sheets-dark': '#182230',
    'ag-polychroma': '#ffffff',
    'ag-polychroma-dark': '#182230',
    'ag-vivid': '#ffffff',
    'ag-vivid-dark': '#182230',
    'ag-material': '#ffffff',
    'ag-material-dark': '#182230',
};
