import type { BBoxContainsTester, BBoxProvider, BBoxValues } from '../../util/bboxinterface';

export enum REGIONS {
    TITLE = 'title',
    SUBTITLE = 'subtitle',
    FOOTNOTE = 'footnote',
    LEGEND = 'legend',
    NAVIGATOR = 'navigator',
    PAGINATION = 'pagination',
    ROOT = 'root',
    SERIES = 'series',
    HORIZONTAL_AXES = 'horizontal-axes',
    VERTICAL_AXES = 'vertical-axes',
    TOOLBAR = 'toolbar',
}

export type RegionName = `${REGIONS}`;

export type RegionBBoxProvider = BBoxProvider<BBoxContainsTester & BBoxValues>;
