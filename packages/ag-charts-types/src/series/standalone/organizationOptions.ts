import type {
    ContextCallbackParams,
    DatumCallbackParams,
    HighlightState,
    RichFormatter,
    Styler,
} from '../../chart/callbackOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type {
    ContextDefault,
    CssColor,
    DatumDefault,
    OverflowStrategy,
    PixelSize,
    TextAlign,
    TextWrap,
} from '../../chart/types';
import type {
    FillCssOptions,
    FillOptions,
    FontOptions,
    LineDashOptions,
    StrokeOptions,
    Toggleable,
} from '../cartesian/commonOptions';
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
    innerSpacing?: PixelSize;
    // outerSpacing?: PixelSize;
    verticalSpacing?: PixelSize;

    expander?: AgOrganizationSeriesOptionsExpander;

    link?: AgOrganizationSeriesOptionsLink<TDatum, TContext>;
    node?: AgOrganizationSeriesThemeableOptionsNode<TDatum, TContext>;

    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOrganizationSeriesTooltipRendererParams<TDatum, TContext>>;
}

export interface AgOrganizationSeriesOptionsExpander {
    /**
     * Outer height of the expander pill, in pixels. Increasing this value reserves additional
     * vertical space between a parent node and its children to fit a larger pill; decreasing it
     * pulls children closer. Set this to at least the rendered subtitle's line height plus its
     * top and bottom padding so the descendant-count text fits without overflow — the pill is
     * rendered at exactly this value so layout reservations and rendered geometry stay aligned.
     *
     * Default: `24`
     */
    height?: PixelSize;
}

export interface AgOrganizationSeriesOptionsLink<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesLinkStyle {
    itemStyler?: Styler<AgOrganizationSeriesLinkItemStylerParams<TDatum, TContext>, AgOrganizationSeriesLinkStyle>;
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
    subtitle?: AgOrganizationSeriesOptionsNodeSubtitle<TDatum, TContext>;
    title?: AgOrganizationSeriesOptionsNodeTitle<TDatum, TContext>;
}

export interface AgOrganizationSeriesNodeStyle extends FillOptions, LineDashOptions, StrokeOptions {
    cornerRadius?: PixelSize;
    height?: PixelSize;
    image?: AgOrganizationSeriesOptionsNodeImage;
    maxHeight?: PixelSize;
    maxWidth?: PixelSize;
    padding?: PixelSize;
    width?: PixelSize;
}

export interface AgOrganizationSeriesOptionsNode<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgOrganizationSeriesThemeableOptionsNode<TDatum, TContext>, 'labels'> {
    itemStyler?: Styler<AgOrganizationSeriesNodeItemStylerParams<TDatum, TContext>, AgOrganizationSeriesNodeStyle>;
    labels?: AgOrganizationSeriesOptionsNodeLabel<TDatum, TContext>[];
}

export interface AgOrganizationSeriesOptionsNodeImage extends Toggleable {
    /**
     * Default: `image`
     */
    key?: string;
    height?: number;
    width?: number;
    position?: AgOrganizationSeriesOptionsNodeImagePosition;
    shape?: AgOrganizationSeriesOptionsNodeImageShape;
    spacing?: number;
}

export type AgOrganizationSeriesOptionsNodeImageShape = 'circle' | 'square';
export type AgOrganizationSeriesOptionsNodeImagePosition = 'bottom' | 'left' | 'right' | 'top';

export interface AgOrganizationSeriesOptionsNodeSubtitle<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesOptionsNodeText<TDatum, TContext> {
    /**
     * Default: 'subtitle'
     */
    key?: string;
}

export interface AgOrganizationSeriesOptionsNodeTitle<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesOptionsNodeText<TDatum, TContext> {
    /**
     * Default: 'title'
     */
    key?: string;
}

export interface AgOrganizationSeriesOptionsNodeText<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesNodeTextStyle,
        Toggleable {
    formatter?: RichFormatter<AgOrganizationNodeTextFormatterParams<TDatum, TContext>>;
    itemStyler?: Styler<AgOrganizationSeriesNodeTextStylerParams<TDatum, TContext>, AgOrganizationSeriesNodeTextStyle>;
}

export interface AgOrganizationSeriesOptionsNodeLabel<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesOptionsNodeText<TDatum, TContext> {
    key: string;
}

export interface AgOrganizationSeriesNodeTextStyle extends FontOptions, FillCssOptions, StrokeOptions, Toggleable {
    color?: CssColor;
    overflowStrategy?: OverflowStrategy;
    spacing?: number;
    textAlign?: TextAlign;
    wrapping?: TextWrap;
    /** Corner radius of the backing box. Has no effect unless `fill` or `stroke` is set. */
    cornerRadius?: PixelSize;
    /** Padding between the text and the backing box edge. Has no effect unless `fill` or `stroke` is set. */
    padding?: PixelSize;
}

export interface AgOrganizationSeriesOptionsKeys {
    idKey?: string;
    parentIdKey?: string;
}

export interface AgOrganizationNodeTextFormatterParams<TDatum = DatumDefault, TContext = ContextDefault> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the series. */
    seriesId: string;
    /** Context for this callback. */
    context?: TContext;
    /** The default label value that would have been used without a formatter. */
    value: any;
}

export interface AgOrganizationSeriesLinkItemStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<DatumCallbackParams<TDatum, HighlightState>, 'datum' | 'highlightState'>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesLinkStyle {
    /** The data point from which the link starts. */
    fromDatum: TDatum;
    /** The data point to which the link ends. */
    toDatum: TDatum;
}

export interface AgOrganizationSeriesNodeItemStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesNodeStyle {
    /** The depth of the data point within the organization. */
    depth: number;
    /** `true` when the node is collapsed (its descendants are hidden); `false` otherwise. */
    isCollapsed: boolean;
}

export interface AgOrganizationSeriesNodeTextStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesNodeTextStyle {
    /** The depth of the data */
    depth: number;
    /** `true` when the node is collapsed (its descendants are hidden); `false` otherwise. */
    isCollapsed: boolean;
}

export interface AgOrganizationSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgOrganizationSeriesOptionsKeys {}
