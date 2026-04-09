import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { ContextDefault, DatumDefault, OverflowStrategy, PixelSize, TextWrap } from '../../chart/types';
import type { FillOptions, FontOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgOrganisationSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgOrganisationSeriesOptionsKeys,
        AgOrganisationSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Organisation Series. */
    type: 'organization';

    node?: AgOrganisationSeriesOptionsNode;
}

export interface AgOrganisationSeriesOptionsNode extends FillOptions, StrokeOptions {
    cornerRadius?: PixelSize;
    labels?: AgOrganisationSeriesOptionsNodeTextWithKey[];
    maxHeight?: PixelSize;
    maxWidth?: PixelSize;
    subtitle?: AgOrganisationSeriesOptionsNodeText;
    title?: AgOrganisationSeriesOptionsNodeText;
}

export interface AgOrganisationSeriesOptionsNodeText extends FontOptions {
    itemStyler?: Function;
    key?: string;
    overflowStrategy?: OverflowStrategy;
    spacing?: number;
    wrapping?: TextWrap;
}

export interface AgOrganisationSeriesOptionsNodeTextWithKey extends AgOrganisationSeriesOptionsNodeText {
    key: string;
}

export interface AgOrganisationSeriesOptionsKeys {
    idKey?: string;
    parentIdKey?: string;
}

export interface AgOrganisationSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesThemeableOptions<TDatum, TContext> {
    node?: AgOrganisationSeriesOptionsNode;

    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOrganisationSeriesTooltipRendererParams<TDatum, TContext>>;
}

export interface AgOrganisationSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgOrganisationSeriesOptionsKeys {}
