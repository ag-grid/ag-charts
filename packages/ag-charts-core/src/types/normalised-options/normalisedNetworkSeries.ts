import type {
    AgNetworkSeriesTreeLayout,
    AgOrganizationSeriesExpanderHoverStyle,
    AgOrganizationSeriesExpanderHoverTextStyle,
    AgOrganizationSeriesOptions,
    AgOrganizationSeriesOptionsExpander,
    AgOrganizationSeriesOptionsExpanderText,
    AgOrganizationSeriesOptionsLink,
    AgOrganizationSeriesOptionsLinkStepInterpolation,
    AgOrganizationSeriesOptionsNode,
    AgOrganizationSeriesOptionsNodeImage,
    AgOrganizationSeriesOptionsNodeLabel,
    AgOrganizationSeriesStackedLayoutOptions,
    CssColor,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedColorType, NormalisedPaddingOptions } from './normalisedCommonOptions';

/** Tree-layout gaps the network layouts read; `verticalSpacing` is a deprecated alias the theme folds into `depthSpacing`. */
export type NormalisedNetworkSeriesTreeLayoutOptions = Normalised<
    Omit<AgNetworkSeriesTreeLayout, 'direction'>,
    'depthSpacing' | 'innerSpacing' | 'outerSpacing'
>;

export type NormalisedOrganizationSeriesExpanderTextOptions = Normalised<
    AgOrganizationSeriesOptionsExpanderText<unknown, unknown>,
    'fontFamily' | 'fontSize' | 'fontStyle' | 'fontWeight' | 'showAllChildren' | 'showDirectChildren' | 'textAlign',
    { color: CssColor }
>;

/** Hover overrides stay absent when unset, so each falls back to the resting expander style. */
export type NormalisedOrganizationSeriesExpanderHoverStyle = Normalised<
    AgOrganizationSeriesExpanderHoverStyle,
    never,
    {
        fill?: CssColor;
        stroke?: CssColor;
        text?: Normalised<AgOrganizationSeriesExpanderHoverTextStyle, never, { color?: CssColor }>;
    }
>;

export type NormalisedOrganizationSeriesExpanderOptions = Normalised<
    AgOrganizationSeriesOptionsExpander<unknown, unknown>,
    | 'cornerRadius'
    | 'enabled'
    | 'fill'
    | 'fillOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'stroke'
    | 'strokeOpacity'
    | 'strokeWidth',
    {
        stroke: CssColor;
        padding: NormalisedPaddingOptions;
        hoverStyle: NormalisedOrganizationSeriesExpanderHoverStyle;
        text: NormalisedOrganizationSeriesExpanderTextOptions;
    }
>;

export type NormalisedOrganizationSeriesLinkOptions = Normalised<
    AgOrganizationSeriesOptionsLink<unknown, unknown>,
    'lineDash' | 'lineDashOffset' | 'stroke' | 'strokeOpacity' | 'strokeWidth',
    {
        stroke: CssColor;
        interpolation: Normalised<AgOrganizationSeriesOptionsLinkStepInterpolation, 'cornerRadius'>;
    }
>;

/** `type` stays absent until the user opts into the stacked layout; the indentation defaults are always present. */
export type NormalisedOrganizationSeriesLayoutOptions = Normalised<
    AgOrganizationSeriesStackedLayoutOptions,
    'linkIndentation' | 'nodeIndentation' | 'stackFromDepth',
    { type?: 'stacked' }
>;

export type NormalisedOrganizationSeriesNodeImageOptions = Normalised<
    AgOrganizationSeriesOptionsNodeImage,
    'cornerRadius' | 'enabled' | 'key' | 'height' | 'position' | 'spacing' | 'width'
>;

/** `fill`/`stroke` stay absent when unset, which is how the text tier reports "no backing box". */
export type NormalisedOrganizationSeriesNodeTextOptions = Normalised<
    AgOrganizationSeriesOptionsNodeLabel<unknown, unknown>,
    | 'cornerRadius'
    | 'enabled'
    | 'fillOpacity'
    | 'fontFamily'
    | 'fontSize'
    | 'fontStyle'
    | 'fontWeight'
    | 'overflowStrategy'
    | 'spacing'
    | 'strokeOpacity'
    | 'strokeWidth'
    | 'textAlign'
    | 'wrapping',
    { color: CssColor; stroke?: CssColor; padding: NormalisedPaddingOptions }
>;

export type NormalisedOrganizationSeriesNodeOptions = Normalised<
    AgOrganizationSeriesOptionsNode<unknown, unknown>,
    | 'clickToExpand'
    | 'cornerRadius'
    | 'fill'
    | 'fillOpacity'
    | 'image'
    | 'lineDash'
    | 'lineDashOffset'
    | 'stroke'
    | 'strokeOpacity'
    | 'strokeWidth'
    | 'subtitle'
    | 'title',
    {
        fill: NormalisedColorType;
        stroke: CssColor;
        padding: NormalisedPaddingOptions;
        image: NormalisedOrganizationSeriesNodeImageOptions;
        title: NormalisedOrganizationSeriesNodeTextOptions;
        subtitle: NormalisedOrganizationSeriesNodeTextOptions;
        labels?: NormalisedOrganizationSeriesNodeTextOptions[];
    }
>;

/** Organization options the series owns, before the common series keys are layered on. */
export type NormalisedOrganizationSeriesOwnOptions = Normalised<
    AgOrganizationSeriesOptions,
    'idKey' | 'parentIdKey' | 'direction' | 'reverse' | 'expander' | 'layout' | 'link' | 'node',
    {
        expander: NormalisedOrganizationSeriesExpanderOptions;
        layout: NormalisedOrganizationSeriesLayoutOptions;
        link: NormalisedOrganizationSeriesLinkOptions;
        node: NormalisedOrganizationSeriesNodeOptions;
    }
> &
    NormalisedNetworkSeriesTreeLayoutOptions;
