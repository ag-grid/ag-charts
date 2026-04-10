import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { ContextDefault, DatumDefault, OverflowStrategy, PixelSize, TextWrap } from '../../chart/types';
import type { FillOptions, FontOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgOrganizationSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgOrganizationSeriesOptionsKeys,
        AgOrganizationSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Organization Series. */
    type: 'organization';

    node?: AgOrganizationSeriesOptionsNode;
}

export interface AgOrganizationSeriesOptionsNode extends FillOptions, StrokeOptions {
    cornerRadius?: PixelSize;
    labels?: AgOrganizationSeriesOptionsNodeTextWithKey[];
    maxHeight?: PixelSize;
    maxWidth?: PixelSize;
    subtitle?: AgOrganizationSeriesOptionsNodeText;
    title?: AgOrganizationSeriesOptionsNodeText;
}

export interface AgOrganizationSeriesOptionsNodeText extends FontOptions {
    itemStyler?: Function;
    key?: string;
    overflowStrategy?: OverflowStrategy;
    spacing?: number;
    wrapping?: TextWrap;
}

export interface AgOrganizationSeriesOptionsNodeTextWithKey extends AgOrganizationSeriesOptionsNodeText {
    key: string;
}

export interface AgOrganizationSeriesOptionsKeys {
    idKey?: string;
    parentIdKey?: string;
}

export interface AgOrganizationSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesThemeableOptions<TDatum, TContext> {
    node?: AgOrganizationSeriesOptionsNode;

    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOrganizationSeriesTooltipRendererParams<TDatum, TContext>>;
}

export interface AgOrganizationSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgOrganizationSeriesOptionsKeys {}
