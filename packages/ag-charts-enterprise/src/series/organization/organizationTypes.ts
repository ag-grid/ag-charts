import type { DeepRequired } from 'ag-charts-core';
import type { AgOrganizationSeriesNodeStyle, AgOrganizationSeriesNodeTextStyle } from 'ag-charts-types';

import type { NetworkDatum, NetworkLinkDatum, NetworkLinkNode } from '../network/networkSeries';

export type OrganizationVertex = string | string[] | number;

export type OrganizationEdge =
    | 'datumIndex' // The index of the datum within the series' data array.
    | 'nodeDatumIndex' // The index of the datum within the series' nodeData array.
    | 'child' // The descending edge from parent to child.
    | 'parent' // The ascending edge from child to parent.
    | 'depth'
    | 'image'
    | 'title'
    | 'subtitle'
    | 'labels';

export interface OrganizationDatum extends NetworkDatum<OrganizationVertex, OrganizationEdge> {
    datum: { image?: string; title?: string; subtitle?: string; labels?: string[] };
    nodeDatumIndex: number;
}

export type OrganizationLinkDatum = NetworkLinkDatum<OrganizationVertex, OrganizationEdge>;
export type OrganizationLinkNode = NetworkLinkNode<OrganizationLinkDatum>;

export type RequiredOrganizationNodeStyle = DeepRequired<
    AgOrganizationSeriesNodeStyle & {
        title: AgOrganizationSeriesNodeTextStyle;
        subtitle: AgOrganizationSeriesNodeTextStyle;
        labels: AgOrganizationSeriesNodeTextStyle[];
    }
>;
