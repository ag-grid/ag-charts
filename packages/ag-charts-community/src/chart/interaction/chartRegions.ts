export const REGIONS = {
    TITLE: 'title',
    SUBTITLE: 'subtitle',
    FOOTNOTE: 'footnote',
    LEGEND: 'legend',
    NAVIGATOR: 'navigator',
    PAGINATION: 'pagination',
    ROOT: 'root',
    SERIES: 'series',
    HORIZONTAL_AXES: 'horizontal-axes',
    VERTICAL_AXES: 'vertical-axes',
    TOOLBAR: 'toolbar',
} as const;

export type RegionName = (typeof REGIONS)[keyof typeof REGIONS];
