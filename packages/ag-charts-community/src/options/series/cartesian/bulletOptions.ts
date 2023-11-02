import type {
    AgBaseSeriesOptions,
    AgBaseSeriesThemeableOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgSeriesTooltip,
} from '../../agChartOptions';

export interface AgBulletSeriesTooltipRendererParams<TDatum = any>
    extends AgCartesianSeriesTooltipRendererParams<TDatum> {}

export interface AgBulletSeriesThemeableOptions extends AgBaseSeriesThemeableOptions {}

export interface AgBulletSeriesOptions<TDatum = any> extends AgBaseSeriesOptions<TDatum> {
    /** Configuration for the Bullet series. */
    type: 'bullet';
    tooltip?: AgSeriesTooltip<AgBulletSeriesTooltipRendererParams>;
}
