import type { ContextCallbackParams, DatumCallbackParams, HighlightState, Styler } from '../../chart/callbackOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { ContextDefault, CssColor, DatumDefault, OverflowStrategy, PixelSize, TextWrap } from '../../chart/types';
import type { FillOptions, FontOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgOrganizationSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgOrganizationSeriesOptionsKeys,
        AgOrganizationSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Organization Series. */
    type: 'organization';

    node?: AgOrganizationSeriesOptionsNode<TDatum, TContext>;
}

export interface AgOrganizationSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesThemeableOptions<TDatum, TContext> {
    direction?: AgOrganizationSeriesOptionsDirection;
    link?: AgOrganizationSeriesOptionsLink<TDatum, TContext>;
    node?: AgOrganizationSeriesThemeableOptionsNode<TDatum, TContext>;

    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOrganizationSeriesTooltipRendererParams<TDatum, TContext>>;
}

export type AgOrganizationSeriesOptionsDirection = 'vertical';

export interface AgOrganizationSeriesOptionsLink<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesLinkStyle {
    itemStyler?: Styler<
        AgOrganizationSeriesLinkItemStylerParams<TDatum, TContext, HighlightState>,
        AgOrganizationSeriesLinkStyle
    >;
}

export interface AgOrganizationSeriesLinkStyle extends LineDashOptions, StrokeOptions {
    interpolation?: AgOrganizationSeriesOptionsLinkInterpolation;
}

export type AgOrganizationSeriesOptionsLinkInterpolation = AgOrganizationSeriesOptionsLinkStepInterpolation;

export interface AgOrganizationSeriesOptionsLinkStepInterpolation {
    type: 'step';
    cornerRadius?: PixelSize;
}

export interface AgOrganizationSeriesThemeableOptionsNode<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesNodeStyle {
    labels?: AgOrganizationSeriesOptionsNodeText<TDatum, TContext>[];
    subtitle?: AgOrganizationSeriesOptionsNodeText<TDatum, TContext>;
    title?: AgOrganizationSeriesOptionsNodeText<TDatum, TContext>;
}

export interface AgOrganizationSeriesNodeStyle extends FillOptions, LineDashOptions, StrokeOptions {
    cornerRadius?: PixelSize;
    maxHeight?: PixelSize;
    maxWidth?: PixelSize;
}

export interface AgOrganizationSeriesOptionsNode<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgOrganizationSeriesThemeableOptionsNode<TDatum, TContext>, 'labels'> {
    itemStyler?: Styler<AgOrganizationSeriesNodeItemStylerParams<TDatum, TContext>, AgOrganizationSeriesNodeStyle>;
    labels?: AgOrganizationSeriesOptionsNodeLabel<TDatum, TContext>[];
}

export interface AgOrganizationSeriesOptionsNodeText<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesNodeTextStyle {
    key?: string;
    itemStyler?: Styler<AgOrganizationSeriesNodeTextStylerParams<TDatum, TContext>, AgOrganizationSeriesNodeTextStyle>;
}

export interface AgOrganizationSeriesOptionsNodeLabel<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesOptionsNodeText<TDatum, TContext> {
    key: string;
}

export interface AgOrganizationSeriesNodeTextStyle extends FontOptions {
    color?: CssColor;
    overflowStrategy?: OverflowStrategy;
    spacing?: number;
    wrapping?: TextWrap;
}

export interface AgOrganizationSeriesOptionsKeys {
    idKey?: string;
    parentIdKey?: string;
}

export interface AgOrganizationSeriesLinkItemStylerParams<
    TDatum,
    TContext = ContextDefault,
    THighlightState extends string = HighlightState,
> extends ContextCallbackParams<TContext>,
        AgOrganizationSeriesLinkStyle {
    /** The data point from which the link starts. */
    from: TDatum;
    /** The data point to which the link ends. */
    to: TDatum;
    /** The unique identifier of the series. */
    seriesId: string;
    /** The specific highlight state of the element. */
    highlightState?: THighlightState;
}

export interface AgOrganizationSeriesNodeItemStylerParams<TDatum, TContext = ContextDefault>
    extends DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesNodeStyle {}

export interface AgOrganizationSeriesNodeTextStylerParams<TDatum, TContext = ContextDefault>
    extends DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesNodeTextStyle {}

export interface AgOrganizationSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgOrganizationSeriesOptionsKeys {}
