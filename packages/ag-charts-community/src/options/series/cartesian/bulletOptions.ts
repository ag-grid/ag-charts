import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';

export interface AgBulletSeriesTooltipRendererParams<TDatum = any>
    extends AgCartesianSeriesTooltipRendererParams<TDatum> {}

export interface AgBulletSeriesThemeableOptions extends AgBaseSeriesThemeableOptions {}

export interface AgBulletColorRange {
    /** Color of this category. */
    color: string;
    /** Stop value of this category. Defaults the maximum value if unset. */
    stop?: number;
}

export interface AgBulletSeriesOptions<TDatum = any> extends AgBaseSeriesOptions<TDatum> {
    /** Configuration for the Bullet series. */
    type: 'bullet';
    /** Bar rendering direction. NOTE: This option affects the layout direction of X and Y data values. */
    direction?: 'horizontal' | 'vertical';
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgBulletSeriesTooltipRendererParams>;
    /** Categoric ranges of the chart */
    colorRanges?: AgBulletColorRange[];
}
