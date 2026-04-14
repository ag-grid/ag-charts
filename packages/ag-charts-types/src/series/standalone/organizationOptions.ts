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

    node?: AgOrganizationSeriesOptionsNode;
}

export interface AgOrganizationSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesThemeableOptions<TDatum, TContext> {
    direction?: AgOrganizationSeriesOptionsDirection;
    link?: AgOrganizationSeriesOptionsLink;
    node?: AgOrganizationSeriesThemeableOptionsNode;

    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOrganizationSeriesTooltipRendererParams<TDatum, TContext>>;
}

export type AgOrganizationSeriesOptionsDirection = 'vertical';

export interface AgOrganizationSeriesOptionsLink extends LineDashOptions, StrokeOptions {
    interpolation?: AgOrganizationSeriesOptionsLinkInterpolation;
}

export type AgOrganizationSeriesOptionsLinkInterpolation = AgOrganisationSeriesOptionsLinkStepInterpolation;

export interface AgOrganisationSeriesOptionsLinkStepInterpolation {
    type: 'step';
    cornerRadius?: PixelSize;
}

export interface AgOrganizationSeriesThemeableOptionsNode extends FillOptions, LineDashOptions, StrokeOptions {
    cornerRadius?: PixelSize;
    labels?: AgOrganizationSeriesOptionsNodeText[];
    maxHeight?: PixelSize;
    maxWidth?: PixelSize;
    subtitle?: AgOrganizationSeriesOptionsNodeText;
    title?: AgOrganizationSeriesOptionsNodeText;
}

export interface AgOrganizationSeriesOptionsNode extends Omit<AgOrganizationSeriesThemeableOptionsNode, 'labels'> {
    labels?: AgOrganizationSeriesOptionsNodeLabel[];
}

export interface AgOrganizationSeriesOptionsNodeText extends FontOptions {
    color?: CssColor;
    itemStyler?: Function;
    key?: string;
    overflowStrategy?: OverflowStrategy;
    spacing?: number;
    wrapping?: TextWrap;
}

export interface AgOrganizationSeriesOptionsNodeLabel extends AgOrganizationSeriesOptionsNodeText {
    key: string;
}

export interface AgOrganizationSeriesOptionsKeys {
    idKey?: string;
    parentIdKey?: string;
}

export interface AgOrganizationSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgOrganizationSeriesOptionsKeys {}
