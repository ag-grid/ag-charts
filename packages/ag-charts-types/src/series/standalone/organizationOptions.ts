import type {
    ContextCallbackParams,
    DatumCallbackParams,
    HighlightState,
    RichFormatter,
    Styler,
} from '../../chart/callbackOptions';
import type { AgCssColorOrRef } from '../../chart/themeParamsOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { ContextDefault, DatumDefault, OverflowStrategy, PixelSize, TextAlign, TextWrap } from '../../chart/types';
import type {
    FillCssOptions,
    FillOptions,
    FontOptions,
    LineDashOptions,
    Padding,
    StrokeOptions,
    Toggleable,
} from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgNetworkSeriesTreeLayout } from './networkOptions';

export interface AgOrganizationSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'selection'>,
        AgOrganizationSeriesOptionsKeys,
        AgOrganizationSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Organization Series. */
    type: 'organization';

    expander?: AgOrganizationSeriesOptionsExpander<TDatum, TContext>;
    node?: AgOrganizationSeriesOptionsNode<TDatum, TContext>;
}

export type AgOrganizationSeriesDirection = 'horizontal' | 'vertical';

export interface AgOrganizationSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesThemeableOptions<TDatum, TContext>, Omit<AgNetworkSeriesTreeLayout, 'direction'> {
    /**
     * The direction child nodes are arranged relative to their parent. Sibling nodes are arranged along the perpendicular axis.
     *
     * Default: 'vertical'
     */
    direction?: AgOrganizationSeriesDirection;
    /**
     * Whether the direction should be reversed.
     *
     * Default: false
     */
    reverse?: boolean;

    expander?: AgOrganizationSeriesOptionsExpander<TDatum, TContext>;

    link?: AgOrganizationSeriesOptionsLink<TDatum, TContext>;
    node?: AgOrganizationSeriesThemeableOptionsNode<TDatum, TContext>;

    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOrganizationSeriesTooltipRendererParams<TDatum, TContext>>;
}

export interface AgOrganizationSeriesOptionsExpander<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgOrganizationSeriesExpanderStyle {
    itemStyler?: Styler<
        AgOrganizationSeriesExpanderItemStylerParams<TDatum, TContext>,
        AgOrganizationSeriesExpanderStyle
    >;
    text?: AgOrganizationSeriesOptionsExpanderText<TDatum, TContext>;
}

export interface AgOrganizationSeriesExpanderStyle extends Toggleable, FillOptions, LineDashOptions, StrokeOptions {
    cornerRadius?: PixelSize;
    /** Padding around the expander content. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
    text?: AgOrganizationSeriesExpanderTextStyle;
}

export interface AgOrganizationSeriesExpanderTextStyle extends FontOptions {
    /** The colour to use for the expander text. A colour string, or a theme-colour reference object. */
    color?: AgCssColorOrRef;
    /**
     * Whether to include the count of all descendants in the expander text.
     *
     * Default: `true`
     */
    showAllChildren?: boolean;
    /**
     * Whether to include the count of direct children in the expander text.
     *
     * Default: `false`
     */
    showDirectChildren?: boolean;
    textAlign?: TextAlign;
}

export interface AgOrganizationSeriesOptionsExpanderText<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgOrganizationSeriesExpanderTextStyle {
    formatter?: RichFormatter<AgOrganizationNodeTextFormatterParams<TDatum, TContext>>;
}

export interface AgOrganizationSeriesOptionsLink<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgOrganizationSeriesLinkStyle {
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

export interface AgOrganizationSeriesThemeableOptionsNode<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgOrganizationSeriesNodeStyle {
    labels?: AgOrganizationSeriesOptionsNodeText<TDatum, TContext>[];
    subtitle?: AgOrganizationSeriesOptionsNodeSubtitle<TDatum, TContext>;
    title?: AgOrganizationSeriesOptionsNodeTitle<TDatum, TContext>;
    /**
     * When set to true, clicking the card will expand/collapse the node. Defaults to `false` when node-clicks are used
     * for something else (e.g. data selection), otherwise defaults to `true`.
     */
    clickToExpand?: boolean;
}

export interface AgOrganizationSeriesNodeStyle extends FillOptions, LineDashOptions, StrokeOptions {
    cornerRadius?: PixelSize;
    height?: PixelSize;
    image?: AgOrganizationSeriesOptionsNodeImage;
    maxHeight?: PixelSize;
    /**
     * Maximum width of the card in pixels. When set, long text content wraps onto
     * multiple lines (subject to each text tier's `wrapping` and `overflowStrategy`)
     * instead of pushing the card wider, so cards do not overlap on tightly packed
     * graphs.
     */
    maxWidth?: PixelSize;
    /** Padding around the node content. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
    width?: PixelSize;
}

export interface AgOrganizationSeriesOptionsNode<TDatum = DatumDefault, TContext = ContextDefault> extends Omit<
    AgOrganizationSeriesThemeableOptionsNode<TDatum, TContext>,
    'labels'
> {
    itemStyler?: Styler<AgOrganizationSeriesNodeItemStylerParams<TDatum, TContext>, AgOrganizationSeriesNodeStyle>;
    labels?: AgOrganizationSeriesOptionsNodeLabel<TDatum, TContext>[];
}

export interface AgOrganizationSeriesOptionsNodeImage extends Toggleable {
    cornerRadius?: PixelSize;
    /**
     * Default: `image`
     */
    key?: string;
    height?: number;
    width?: number;
    position?: AgOrganizationSeriesOptionsNodeImagePosition;
    spacing?: number;
}

export type AgOrganizationSeriesOptionsNodeImagePosition = 'bottom' | 'left' | 'right' | 'top';

export interface AgOrganizationSeriesOptionsNodeSubtitle<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgOrganizationSeriesOptionsNodeText<TDatum, TContext> {
    /**
     * Default: 'subtitle'
     */
    key?: string;
}

export interface AgOrganizationSeriesOptionsNodeTitle<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgOrganizationSeriesOptionsNodeText<TDatum, TContext> {
    /**
     * Default: 'title'
     */
    key?: string;
}

export interface AgOrganizationSeriesOptionsNodeText<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOrganizationSeriesNodeTextStyle, Toggleable {
    formatter?: RichFormatter<AgOrganizationNodeTextFormatterParams<TDatum, TContext>>;
    itemStyler?: Styler<AgOrganizationSeriesNodeTextStylerParams<TDatum, TContext>, AgOrganizationSeriesNodeTextStyle>;
}

export interface AgOrganizationSeriesOptionsNodeLabel<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgOrganizationSeriesOptionsNodeText<TDatum, TContext> {
    key: string;
}

export interface AgOrganizationSeriesNodeTextStyle extends FontOptions, FillCssOptions, StrokeOptions, Toggleable {
    /** The colour to use for the node text. A colour string, or a theme-colour reference object. */
    color?: AgCssColorOrRef;
    overflowStrategy?: OverflowStrategy;
    spacing?: number;
    textAlign?: TextAlign;
    wrapping?: TextWrap;
    /** Corner radius of the backing box. Has no effect unless `fill` or `stroke` is set. */
    cornerRadius?: PixelSize;
    /** Padding between the text and the backing box edge. Has no effect unless `fill` or `stroke` is set. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
}

export interface AgOrganizationSeriesOptionsKeys {
    /**
     * The key of the data field containing the unique node identifier.
     *
     * Default: `'id'`
     */
    idKey?: string;
    /**
     * The key of the data field containing the parent node identifier. The root node should
     * have a `null` value for this field.
     *
     * Default: `'parentId'`
     */
    parentIdKey?: string;
}

export interface AgOrganizationNodeTextFormatterParams<TDatum = DatumDefault, TContext = ContextDefault> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the series. */
    seriesId: string;
    /** Context for this callback. */
    context?: TContext;
    /** The depth of the data point within the organization. */
    depth: number;
    /** `true` when the node is collapsed (its descendants are hidden); `false` otherwise. */
    isCollapsed: boolean;
    /** The number of descendants of this item. */
    allChildren: number;
    /** The number of direct children of this item. */
    directChildren: number;
    /** The default label value that would have been used without a formatter. */
    value: any;
}

export interface AgOrganizationSeriesExpanderItemStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesExpanderStyle {
    /** The depth of the data point within the organization. */
    depth: number;
    /** `true` when the node is collapsed (its descendants are hidden); `false` otherwise. */
    isCollapsed: boolean;
}

export interface AgOrganizationSeriesLinkItemStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<DatumCallbackParams<TDatum, HighlightState>, 'datum' | 'highlightState'>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesLinkStyle {
    /** The data point from which the link starts. */
    fromDatum: TDatum;
    /** The data point to which the link ends. */
    toDatum: TDatum;
}

export interface AgOrganizationSeriesNodeItemStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesNodeStyle {
    /** The depth of the data point within the organization. */
    depth: number;
    /** `true` when the node is collapsed (its descendants are hidden); `false` otherwise. */
    isCollapsed: boolean;
}

export interface AgOrganizationSeriesNodeTextStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgOrganizationSeriesNodeTextStyle {
    /** The depth of the data point within the organisation. */
    depth: number;
    /** `true` when the node is collapsed (its descendants are hidden); `false` otherwise. */
    isCollapsed: boolean;
}

export interface AgOrganizationSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>, AgOrganizationSeriesOptionsKeys {}
