import {
    type ChartOrProxy,
    deproxy,
    getSeriesAt,
    getSeriesContextNodeData,
    getSeriesSelectionNodes,
} from 'ag-charts-community-test';
import { BBox, Group, type Node, Selection, Shape, Text, type Vertex } from 'ag-charts-core';
import { Caster, classCast } from 'ag-charts-test';

import { FlowProportionDatumType } from '../series/flow-proportion/flowDatumIndex';
import type { FlowProportionLinkDatum, FlowProportionNodeDatum } from '../series/flow-proportion/flowProportionSeries';
import type { HierarchyNode } from '../series/hierarchy/hierarchySeries';
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

// Enterprise-only series internals the shared accessors have no name for. Each fails with a vitest assertion, as the
// shared accessors do, when what it reads is missing.

/** `value`, asserted to be neither `null` nor `undefined`. */
function defined<T>(value: T | null | undefined): T {
    return new Caster(value).assertNonNullish().value;
}

/**
 * The node datums of a flow-proportion series (sankey, chord) in node order. Asserts that the series has laid out: the
 * datums do not exist before then. `TGeometry` is the geometry the series' own node datum adds (sankey: `x`, `y`,
 * `width`, `height`), which the series does not export.
 */
export function getFlowNodeData<TGeometry extends object = object>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): (FlowProportionNodeDatum<any, any> & TGeometry)[] {
    return getSeriesContextNodeData<FlowProportionNodeDatum<any, any> | FlowProportionLinkDatum<any, any>>(
        chartOrProxy,
        index
    ).nodeData.filter(
        (datum): datum is FlowProportionNodeDatum<any, any> & TGeometry => datum.type === FlowProportionDatumType.Node
    );
}

/** The link datums of a flow-proportion series (sankey, chord) in link order. Asserts that the series has laid out. */
export function getFlowLinkData(chartOrProxy: ChartOrProxy<any>, index = 0): FlowProportionLinkDatum<any, any>[] {
    return getSeriesContextNodeData<FlowProportionNodeDatum<any, any> | FlowProportionLinkDatum<any, any>>(
        chartOrProxy,
        index
    ).nodeData.filter(
        (datum): datum is FlowProportionLinkDatum<any, any> => datum.type === FlowProportionDatumType.Link
    );
}

// The `itemId` of a datum, or of the datum a node was drawn for; both node and link datums have one.
function datumItemId(datum: unknown): unknown {
    return datum != null && typeof datum === 'object' && 'itemId' in datum ? datum.itemId : undefined;
}

/**
 * The copy of the highlighted node or link that a flow-proportion series (sankey, chord) draws on its highlight layer,
 * or `undefined` when nothing is highlighted or the series draws no copy of it.
 */
export function getFlowHighlightNode(chartOrProxy: ChartOrProxy<any>, index = 0): Shape | undefined {
    const highlightedId = datumItemId(deproxy(chartOrProxy).ctx.highlightManager.getActiveHighlight());
    if (highlightedId === undefined) return undefined;
    return [
        ...getSeriesGroup(chartOrProxy, 'highlightLinkGroup', index).children(),
        ...getSeriesGroup(chartOrProxy, 'highlightNodeGroup', index).children(),
    ].find((child): child is Shape => child instanceof Shape && datumItemId(child.datum) === highlightedId);
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
    const series = getOrganizationSeriesInstance(chartOrProxy, index);
    const getNodeDatumIndex = new Caster(series).accessProperty('getNodeDatumIndex').cast(Function).value;
    // The method is protected, so the only way to call it is untyped; it returns `number | undefined`.
    return getNodeDatumIndex.call(series, vertex) as number | undefined;
}

/** A node the organization series drew, with the datum it was drawn for; every card's datum carries an `itemId`. */
export interface OrganizationCard {
    node: OrganizationNode;
    datum: OrganizationDatum & { itemId: NonNullable<OrganizationDatum['itemId']> };
}

/** The cards the organization series drew, in selection order (render order, which can differ from data order). */
export function getOrganizationCards(chartOrProxy: ChartOrProxy<any>, index = 0): OrganizationCard[] {
    return getSeriesSelectionNodes<OrganizationNode>(chartOrProxy, 'datumSelection', index).map((node) => {
        defined(node.datum?.itemId);
        // `itemId` was just checked, but the datum type keeps it optional.
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
        return { node, datum: defined(node.datum) };
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
        const { text } = new Caster(textNode).cast(Text).value;
        return text == null ? undefined : String(text);
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
    return defined(size).height;
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
    const layout = new Caster(series).accessProperty('layout');
    const getContentBBox = layout.accessProperty('getContentBBox').cast(Function).value;
    return new Caster(getContentBBox.call(layout.value)).cast(BBox).value;
}

/** The rect the chart gave a network series to lay out in, as the series last received it. */
export function getNetworkSeriesRect(chartOrProxy: ChartOrProxy<any>, index = 0): BBox {
    const series = classCast(getSeriesAt(chartOrProxy, index), AbstractNetworkSeries);
    return new Caster(series).accessProperty('seriesRect').cast(BBox).value;
}

/** The text of a treemap tile or group label as the series laid it out, and where. */
export interface TreemapLabelLayout {
    text: string;
    fontSize: number;
    lineHeight: number;
    x: number;
    y: number;
}

/** What a treemap laid out for one node; `undefined` where it laid out nothing (a collapsed group, an unlabelled tile). */
export interface TreemapNodeLayout {
    /** The node's tile or group box, in the series' own coordinates. */
    bbox: BBox | undefined;
    /** The space a group keeps free around its children, its header included in `top`. */
    padding: { top: number; right: number; bottom: number; left: number } | undefined;
    label: TreemapLabelLayout | undefined;
    secondaryLabel: TreemapLabelLayout | undefined;
    /** The height of the wrapped group title, which `padding.top` is sized from. */
    groupTitleLabelHeight: number | undefined;
}

// A property of a layout the series computed: present once laid out, and a number or text by construction.
function layoutProperty<T extends number | string>(layout: unknown, name: string): T {
    return new Caster(layout).accessProperty(name).assertNonNullish().value as T;
}

function treemapLabelLayout(label: unknown): TreemapLabelLayout | undefined {
    if (label == null) return undefined;
    return {
        text: layoutProperty(label, 'text'),
        fontSize: layoutProperty(label, 'fontSize'),
        lineHeight: layoutProperty(label, 'lineHeight'),
        x: layoutProperty(label, 'x'),
        y: layoutProperty(label, 'y'),
    };
}

/**
 * What the treemap laid out for `node`, one of the nodes of its `getHierarchyRootNode` tree (the node class is private
 * to the series). Fails for a node that is not a treemap node.
 */
export function getTreemapNodeLayout(node: HierarchyNode): TreemapNodeLayout {
    const caster = new Caster(node);
    const bbox = caster.accessProperty('bbox').castNullable(BBox).value;
    const padding = caster.accessProperty('padding').value;
    const groupTitle = caster.accessProperty('groupTitle').value;
    const title = new Caster(groupTitle).accessNullableProperty('title').value;
    return {
        bbox,
        padding:
            padding == null
                ? undefined
                : {
                      top: layoutProperty(padding, 'top'),
                      right: layoutProperty(padding, 'right'),
                      bottom: layoutProperty(padding, 'bottom'),
                      left: layoutProperty(padding, 'left'),
                  },
        label: treemapLabelLayout(caster.accessProperty('label').value),
        secondaryLabel: treemapLabelLayout(caster.accessProperty('secondaryLabel').value),
        groupTitleLabelHeight: title == null ? undefined : layoutProperty<number>(title, 'labelHeight'),
    };
}

/** The scene groups that series keep to themselves. */
export type SeriesGroupName =
    // Sunburst: the sector nodes, the group that scales and rotates them with the centre circle and inner labels, and
    // the inner labels' own group.
    | 'sectorGroup'
    | 'scalingGroup'
    | 'innerLabelsGroup'
    // The group the polar series and the hierarchy series (treemap) draw their labels into.
    | 'labelGroup'
    // The flow-proportion series (sankey, chord): the node and link shapes, and their highlighted copies.
    | 'nodeGroup'
    | 'linkGroup'
    | 'highlightNodeGroup'
    | 'highlightLinkGroup';

/** A scene group of the series; naming one the series does not have fails. */
export function getSeriesGroup(chartOrProxy: ChartOrProxy<any>, name: SeriesGroupName, index = 0): Group {
    return new Caster(getSeriesAt(chartOrProxy, index)).accessProperty(name).cast(Group).value;
}

/** The text nodes a series drew into its label group (a treemap's tile and group labels), in scene order. */
export function getSeriesLabelTexts(chartOrProxy: ChartOrProxy<any>, index = 0): Text[] {
    return Selection.selectByClass(getSeriesGroup(chartOrProxy, 'labelGroup', index), Text);
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
