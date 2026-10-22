import {
    type ChartOrProxy,
    getSeriesAt,
    getSeriesContextNodeData,
    getSeriesSelectionNodes,
} from 'ag-charts-community-test';
import { BBox, Group, type Node, Selection, Text, type Vertex } from 'ag-charts-core';
import { Caster, classCast } from 'ag-charts-test';

import { FlowProportionDatumType } from '../series/flow-proportion/flowDatumIndex';
import type { FlowProportionLinkDatum, FlowProportionNodeDatum } from '../series/flow-proportion/flowProportionSeries';
import type { NetworkLinkNode } from '../series/network/networkLinkNode';
import { AbstractNetworkSeries } from '../series/network/networkSeries';
import { OrganizationGraph } from '../series/organization/organizationGraph';
import type { OrganizationNode } from '../series/organization/organizationNode';
import { OrganizationSeries } from '../series/organization/organizationSeries';
import type {
    OrganizationDatum,
    OrganizationEdge,
    OrganizationLinkDatum,
    OrganizationVertex,
} from '../series/organization/organizationTypes';

// Enterprise-only series internals the shared accessors have no name for; each asserts what it reads exists.

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(`Expected ${message}`);
}

/** The node datums of a flow-proportion series (sankey, chord) in node order, empty before the series has laid out. */
export function getFlowNodeData(chartOrProxy: ChartOrProxy<any>, index = 0): FlowProportionNodeDatum<any, any>[] {
    return getSeriesContextNodeData<FlowProportionNodeDatum<any, any> | FlowProportionLinkDatum<any, any>>(
        chartOrProxy,
        index
    ).nodeData.filter(
        (datum): datum is FlowProportionNodeDatum<any, any> => datum.type === FlowProportionDatumType.Node
    );
}

/** The link datums of a flow-proportion series (sankey, chord) in link order, empty before the series has laid out. */
export function getFlowLinkData(chartOrProxy: ChartOrProxy<any>, index = 0): FlowProportionLinkDatum<any, any>[] {
    return getSeriesContextNodeData<FlowProportionNodeDatum<any, any> | FlowProportionLinkDatum<any, any>>(
        chartOrProxy,
        index
    ).nodeData.filter(
        (datum): datum is FlowProportionLinkDatum<any, any> => datum.type === FlowProportionDatumType.Link
    );
}

/** The organization series at `index`, asserted to be one: its public API (`collapseItem`, `pickFocus`, …) is typed. */
export function getOrganizationSeriesInstance(chartOrProxy: ChartOrProxy<any>, index = 0): OrganizationSeries {
    return classCast(getSeriesAt(chartOrProxy, index), OrganizationSeries);
}

/** The vertex graph the organization series built from its data; the series keeps it protected. */
export function getOrganizationGraph(chartOrProxy: ChartOrProxy<any>, index = 0): OrganizationGraph {
    return new Caster(getOrganizationSeriesInstance(chartOrProxy, index))
        .accessProperty('graph')
        .cast(OrganizationGraph).value;
}

/**
 * The index of the node selection entry that draws `vertex`, as the series resolves it (`getNodeDatumIndex`), or
 * `undefined` for a vertex it draws no node for. The index follows render order, which can differ from data order.
 */
export function getOrganizationNodeDatumIndex(
    chartOrProxy: ChartOrProxy<any>,
    vertex: Vertex<OrganizationVertex, OrganizationEdge>,
    index = 0
): number | undefined {
    const series = getOrganizationSeriesInstance(chartOrProxy, index) as unknown as {
        getNodeDatumIndex?: (vertex: Vertex<OrganizationVertex, OrganizationEdge>) => number | undefined;
    };
    assert(typeof series.getNodeDatumIndex === 'function', `series ${index} getNodeDatumIndex`);
    return series.getNodeDatumIndex(vertex);
}

/** A node the organization series drew, with the datum it was drawn for; every card's datum carries an `itemId`. */
export interface OrganizationCard {
    node: OrganizationNode;
    datum: OrganizationDatum & { itemId: NonNullable<OrganizationDatum['itemId']> };
}

/** The cards the organization series drew, in selection order (render order, which can differ from data order). */
export function getOrganizationCards(chartOrProxy: ChartOrProxy<any>, index = 0): OrganizationCard[] {
    return getSeriesSelectionNodes<OrganizationNode>(chartOrProxy, 'datumSelection', index).map((node) => {
        assert(node.datum?.itemId != null, `series ${index} card datum`);
        return { node, datum: node.datum as OrganizationCard['datum'] };
    });
}

/** A link the organization series drew, with the datum it was drawn for. */
export interface OrganizationLink {
    node: NetworkLinkNode<OrganizationLinkDatum>;
    datum: OrganizationLinkDatum;
}

/** The links the organization series drew between its cards, in selection order. */
export function getOrganizationLinks(chartOrProxy: ChartOrProxy<any>, index = 0): OrganizationLink[] {
    return getEnterpriseSelectionNodes<NetworkLinkNode<OrganizationLinkDatum>>(
        chartOrProxy,
        'linkSelection',
        index
    ).map((node) => {
        assert(node.datum != null, `series ${index} link datum`);
        return { node, datum: node.datum };
    });
}

/** The text a card rendered; the card keeps its text nodes private. `undefined` is a tier the card has no node for. */
export interface OrganizationCardTexts {
    title: string | undefined;
    subtitle: string | undefined;
    labels: (string | undefined)[];
}

export function getOrganizationCardTexts(card: OrganizationNode): OrganizationCardTexts {
    const textOf = (textNode: unknown): string | undefined => {
        if (textNode == null) return undefined;
        assert(textNode instanceof Text, 'card text node');
        const { text } = textNode;
        assert(text === undefined || typeof text === 'string', 'card text is plain');
        return text;
    };
    const caster = new Caster(card);
    const labelNodes = caster.accessNullableProperty('labelNodes').value as unknown[] | undefined;
    return {
        title: textOf(caster.accessNullableProperty('titleNode').value),
        subtitle: textOf(caster.accessNullableProperty('subtitleNode').value),
        labels: (labelNodes ?? []).map(textOf),
    };
}

/** The height of the content a card laid out before any `maxHeight` clipped it. */
export function getOrganizationCardContentHeight(card: OrganizationNode): number {
    const size = new Caster(card).accessNullableProperty('intrinsicCardSize').value as { height: number } | undefined;
    assert(size != null, 'card content size');
    return size.height;
}

/** The zoom and pan a network series applies to everything it draws (its `viewportGroup`). */
export interface NetworkViewport {
    scalingX: number;
    scalingY: number;
    translationX: number;
    translationY: number;
}

export function getNetworkViewport(chartOrProxy: ChartOrProxy<any>, index = 0): NetworkViewport {
    const series = classCast(getSeriesAt(chartOrProxy, index), AbstractNetworkSeries);
    const { scalingX, scalingY, translationX, translationY } = new Caster(series)
        .accessProperty('viewportGroup')
        .cast(Group).value as unknown as NetworkViewport;
    return { scalingX, scalingY, translationX, translationY };
}

/** The bounds of everything the layout placed, in the viewport's own coordinates. */
export function getNetworkContentBBox(chartOrProxy: ChartOrProxy<any>, index = 0): BBox {
    const series = classCast(getSeriesAt(chartOrProxy, index), AbstractNetworkSeries);
    const layout = new Caster(series).accessProperty('layout').value as { getContentBBox?: () => BBox | undefined };
    assert(typeof layout.getContentBBox === 'function', `series ${index} layout`);
    const bbox = layout.getContentBBox();
    assert(bbox instanceof BBox, `series ${index} content bounds`);
    return bbox;
}

/** The rect the chart gave a network series to lay out in, as the series last received it. */
export function getNetworkSeriesRect(chartOrProxy: ChartOrProxy<any>, index = 0): BBox {
    const series = classCast(getSeriesAt(chartOrProxy, index), AbstractNetworkSeries);
    return new Caster(series).accessProperty('seriesRect').cast(BBox).value;
}

/** The scene groups that series keep to themselves. */
export type SeriesGroupName =
    // Sunburst: the sector nodes, the group that scales and rotates them with the centre circle and inner labels, and
    // the inner labels' own group.
    | 'sectorGroup'
    | 'scalingGroup'
    | 'innerLabelsGroup'
    // The polar series' data labels.
    | 'labelGroup';

/** A scene group of the series; naming one the series does not have fails. */
export function getSeriesGroup(chartOrProxy: ChartOrProxy<any>, name: SeriesGroupName, index = 0): Group {
    return new Caster(getSeriesAt(chartOrProxy, index)).accessProperty(name).cast(Group).value;
}

/** The scene selections that series keep to themselves and that `getSeriesSelectionNodes` has no name for. */
export type EnterpriseSelectionName = 'linkSelection' | 'innerCircleSelection';

/**
 * The nodes a series drew into one of its selections: the links of a network series, the centre circle of a sunburst.
 * Prefer the scene-graph accessors (`createSceneGeometrySampler`) when only geometry or counts matter.
 */
export function getEnterpriseSelectionNodes<TNode extends Node = Node>(
    chartOrProxy: ChartOrProxy<any>,
    name: EnterpriseSelectionName,
    index = 0
): TNode[] {
    const selection = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty(name).cast(Selection).value;
    return selection.nodes() as TNode[];
}
