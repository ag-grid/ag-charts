import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';

export interface AgMapShapeAccessoryThemeableOptions extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgMapShapeAccessoryOptions extends AgMapShapeAccessoryThemeableOptions {
    /** Configuration for the Map Accessory. */
    type: 'map-shape-accessory';
    /** GeoJSON data. */
    topology?: any;
}
