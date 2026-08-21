import type {
    Normalised,
    NormalisedColorType,
    NormalisedPaddingOptions,
    NormalisedTextOrSegments,
} from 'ag-charts-core';
import type {
    AgOrganizationSeriesExpanderStyle,
    AgOrganizationSeriesExpanderTextStyle,
    AgOrganizationSeriesNodeStyle,
    AgOrganizationSeriesNodeTextStyle,
    AgOrganizationSeriesOptionsNodeImage,
    CssColor,
} from 'ag-charts-types';

import type { NetworkDatum, NetworkLinkDatum } from '../network/networkSeries';
import type { NetworkSeriesVertexID } from '../network/networkTypes';

export interface OrganizationNodeFields {
    image?: string;
    title?: NormalisedTextOrSegments;
    subtitle?: NormalisedTextOrSegments;
    labels?: (NormalisedTextOrSegments | undefined)[];
}

export type OrganizationVertex = NetworkSeriesVertexID | (string | undefined)[] | boolean;

export type OrganizationVertexID = NetworkSeriesVertexID;

export type OrganizationEdge =
    | 'datumIndex' // The index of the datum within the series' data array.
    | 'child' // The descending edge from parent to child.
    | 'parent' // The ascending edge from child to parent.
    | 'depth'
    | 'descendants'
    | 'image'
    | 'title'
    | 'subtitle'
    | 'labels';

export interface OrganizationDatum extends NetworkDatum<OrganizationVertex, OrganizationEdge> {
    // Stable across renders, so reference-equality (e.g. HighlightManager) holds.
    datum: unknown;
    collapsedByAncestor: boolean;
}

export type OrganizationLinkDatum = NetworkLinkDatum<OrganizationVertex, OrganizationEdge>;

// `fill`/`stroke` stay present as `undefined` — the itemStyler contract surfaces "no backing box" that way.
export type NormalisedOrganizationNodeTextStyle = Normalised<
    AgOrganizationSeriesNodeTextStyle,
    | 'cornerRadius'
    | 'enabled'
    | 'fillOpacity'
    | 'fontFamily'
    | 'fontSize'
    | 'fontStyle'
    | 'fontWeight'
    | 'spacing'
    | 'strokeOpacity'
    | 'strokeWidth'
    | 'textAlign'
    | 'overflowStrategy'
    | 'wrapping',
    {
        color: CssColor;
        fill: CssColor | undefined;
        stroke: CssColor | undefined;
        padding: NormalisedPaddingOptions;
    }
>;

export type NormalisedOrganizationSeriesExpanderStyle = Normalised<
    AgOrganizationSeriesExpanderStyle,
    | 'cornerRadius'
    | 'enabled'
    | 'fill'
    | 'fillOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'stroke'
    | 'strokeOpacity'
    | 'strokeWidth',
    { padding: NormalisedPaddingOptions; text: NormalisedOrganizationSeriesExpanderTextStyle }
>;

type NormalisedOrganizationSeriesExpanderTextStyle = Normalised<
    AgOrganizationSeriesExpanderTextStyle,
    'fontSize' | 'showAllChildren' | 'showDirectChildren' | 'textAlign',
    { color: CssColor }
>;

export type NormalisedOrganizationSeriesOptionsNodeImage = Normalised<
    AgOrganizationSeriesOptionsNodeImage,
    'cornerRadius' | 'enabled' | 'key' | 'height' | 'position' | 'spacing' | 'width'
>;

export type NormalisedOrganizationNodeStyle = Normalised<
    AgOrganizationSeriesNodeStyle,
    | 'cornerRadius'
    | 'fillOpacity'
    | 'height'
    | 'lineDash'
    | 'lineDashOffset'
    | 'maxHeight'
    | 'maxWidth'
    | 'strokeOpacity'
    | 'strokeWidth'
    | 'width',
    {
        fill: NormalisedColorType;
        stroke: CssColor;
        expander: NormalisedOrganizationSeriesExpanderStyle;
        image: NormalisedOrganizationSeriesOptionsNodeImage;
        labels: NormalisedOrganizationNodeTextStyle[];
        padding: NormalisedPaddingOptions;
        title: NormalisedOrganizationNodeTextStyle;
        subtitle: NormalisedOrganizationNodeTextStyle;
    }
>;
