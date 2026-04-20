import type { DeepRequired } from 'ag-charts-core';
import type { AgOrganizationSeriesNodeStyle, AgOrganizationSeriesNodeTextStyle, TextOrSegments } from 'ag-charts-types';

import type { NetworkDatum, NetworkLinkDatum } from '../network/networkSeries';

export type OrganizationVertex = string | string[] | number | boolean;

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
    datum: {
        image?: string;
        title?: TextOrSegments;
        subtitle?: TextOrSegments;
        labels?: (TextOrSegments | undefined)[];
    };
    nodeDatumIndex: number;
    collapsed: boolean;
}

export type OrganizationLinkDatum = NetworkLinkDatum<OrganizationVertex, OrganizationEdge>;

export type RequiredOrganizationNodeStyle = DeepRequired<
    AgOrganizationSeriesNodeStyle & {
        title: AgOrganizationSeriesNodeTextStyle;
        subtitle: AgOrganizationSeriesNodeTextStyle;
        labels: AgOrganizationSeriesNodeTextStyle[];
    }
>;
