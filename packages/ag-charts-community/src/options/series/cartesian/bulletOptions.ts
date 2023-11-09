import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgBarSeriesStyle } from './barOptions';

interface BulletSeriesKeysAndNames {
    /** The key to use to retrieve the gauge value from the data. */
    valueKey: string;
    /** A human-readable description of the gauge value. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    valueName?: string;
    /** The key to use to retrieve the target value from the data. */
    targetKey?: string;
    /** A human-readable description of the target value. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    targetName?: string;
}

export interface AgBulletSeriesTooltipRendererParams<TDatum = any>
    extends AgSeriesTooltipRendererParams<TDatum>,
        BulletSeriesKeysAndNames {}

export interface AgBulletSeriesThemeableOptions extends AgBarSeriesStyle, AgBaseSeriesThemeableOptions {
    /** Styling options for the target node. */
    target?: AgBarSeriesStyle;
}

export interface AgBulletColorRange {
    /** Color of this category. */
    color: string;
    /** Stop value of this category. Defaults the maximum value if unset. */
    stop?: number;
}

export interface AgBulletSeriesOptions<TDatum = any> extends AgBaseSeriesOptions<TDatum>, BulletSeriesKeysAndNames {
    /** Configuration for the Bullet series. */
    type: 'bullet';
    /** Bar rendering direction. NOTE: This option affects the layout direction of X and Y data values. */
    direction?: 'horizontal' | 'vertical';
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgBulletSeriesTooltipRendererParams>;
    /** Categoric ranges of the chart */
    colorRanges?: AgBulletColorRange[];
}
