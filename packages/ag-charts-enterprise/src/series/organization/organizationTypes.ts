import type { DeepRequired } from 'ag-charts-core';
import type {
    AgOrganizationSeriesNodeStyle,
    AgOrganizationSeriesNodeTextStyle,
    CssColor,
    TextOrSegments,
} from 'ag-charts-types';

import type { NetworkDatum, NetworkLinkDatum } from '../network/networkSeries';

export interface OrganizationNodeFields {
    image?: string;
    title?: TextOrSegments;
    subtitle?: TextOrSegments;
    labels?: (TextOrSegments | undefined)[];
}

export type OrganizationVertex = string | (string | undefined)[] | number | boolean;

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
    // The user's source data row — stable across renders so reference-equality
    // (e.g. HighlightManager) works correctly.
    datum: unknown;
}

export type OrganizationLinkDatum = NetworkLinkDatum<OrganizationVertex, OrganizationEdge>;

// `fill` and `stroke` for text tiers explicitly carry `undefined` rather than being
// erased: unset means "no backing box", which the public contract surfaces to
// itemStyler params as `fill: undefined` (instead of an empty-string sentinel).
export type RequiredOrganizationNodeTextStyle = Omit<
    DeepRequired<AgOrganizationSeriesNodeTextStyle>,
    'fill' | 'stroke'
> & {
    fill: CssColor | undefined;
    stroke: CssColor | undefined;
};

export type RequiredOrganizationNodeStyle = DeepRequired<AgOrganizationSeriesNodeStyle> & {
    title: RequiredOrganizationNodeTextStyle;
    subtitle: RequiredOrganizationNodeTextStyle;
    labels: RequiredOrganizationNodeTextStyle[];
    expander: { height: number; spacing: number };
};
