import { _ModuleSupport } from 'ag-charts-community';
import {
    type ChartOrProxy,
    type LegendTestItemNode,
    type PlacedLabelGeometry,
    deproxy,
    getSeriesAt,
    getSeriesContextNodeData,
    getSeriesSelectionNodes,
} from 'ag-charts-community-test';
import { BBox, ChartAxisDirection, Group, type Node, Selection, Shape, Text, type Vertex } from 'ag-charts-core';
import { Caster, classCast } from 'ag-charts-test';

import { FlowProportionDatumType } from '../series/flow-proportion/flowDatumIndex';
import type { FlowProportionLinkDatum, FlowProportionNodeDatum } from '../series/flow-proportion/flowProportionSeries';
import { FunnelConnector } from '../series/funnel/funnelConnector';
import { HeatmapSeries } from '../series/heatmap/heatmapSeries';
import type { HierarchyNode } from '../series/hierarchy/hierarchySeries';
import { HlcSeries } from '../series/hlc/hlcSeries';
import type { HlcMarkerDatum } from '../series/hlc/hlcUtil';
import { LinearGaugeSeries } from '../series/linear-gauge/linearGaugeSeries';
import { type MapMarkerNodeDatum, MapMarkerSeries } from '../series/map-marker/mapMarkerSeries';
import type { NetworkLinkNode } from '../series/network/networkLinkNode';
import { AbstractNetworkSeries } from '../series/network/networkSeries';
import type { OhlcSeriesDataAggregationFilter } from '../series/ohlc/ohlcAggregation';
import { OhlcSeries } from '../series/ohlc/ohlcSeries';
import { OrganizationGraph } from '../series/organization/organizationGraph';
import type { OrganizationNode } from '../series/organization/organizationNode';
import { OrganizationSeries } from '../series/organization/organizationSeries';
import type {
    OrganizationDatum,
    OrganizationEdge,
    OrganizationLinkDatum,
    OrganizationVertex,
} from '../series/organization/organizationTypes';
import { RadialGaugeSeries } from '../series/radial-gauge/radialGaugeSeries';
import { WaterfallSeries } from '../series/waterfall/waterfallSeries';

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

// The `datumIndex` of a datum, or of the datum a node was drawn for.
function datumIndexOf(datum: unknown): unknown {
    return datum != null && typeof datum === 'object' && 'datumIndex' in datum ? datum.datumIndex : undefined;
}

/**
 * The copy of the highlighted stage that a funnel-family series (funnel, cone funnel, pyramid) draws on its highlight
 * layer, or `undefined` when the series draws no copy of it. The copy's datum is the stage's datum or a copy of it, so
 * the two are matched by `datumIndex`. Asserts that something is highlighted.
 */
export function getStageHighlightNode(chartOrProxy: ChartOrProxy<any>, index = 0): Shape | undefined {
    const highlighted = defined(deproxy(chartOrProxy).ctx.highlightManager.getActiveHighlight());
    return [...getSeriesAt(chartOrProxy, index).highlightNodeGroup.children()].find(
        (child): child is Shape => child instanceof Shape && datumIndexOf(child.datum) === highlighted.datumIndex
    );
}

/**
 * The connectors a funnel-family series (funnel, cone funnel) drew between its stages, in selection order. Asserts that
 * each node is a connector.
 */
export function getFunnelConnectorNodes(chartOrProxy: ChartOrProxy<any>, index = 0): FunnelConnector[] {
    const selection = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty('connectorSelection').cast(Selection);
    return selection.value.nodes().map((node) => new Caster(node).cast(FunnelConnector).value);
}

/** The scene group a funnel-family series (funnel, cone funnel) draws its connectors into; the series keeps it protected. */
export function getFunnelConnectorGroup(chartOrProxy: ChartOrProxy<any>, index = 0): Group {
    return new Caster(getSeriesAt(chartOrProxy, index)).accessProperty('connectorNodeGroup').cast(Group).value;
}

/** What the legend item's datum says about hover: `true` for an item that suppresses the highlight, else `undefined`. */
export function getLegendItemSuppressHighlight(item: LegendTestItemNode): true | undefined {
    const suppressHighlight = new Caster(item.datum)
        .assertNonNullish()
        .accessNullableProperty('suppressHighlight').value;
    return suppressHighlight === true ? true : undefined;
}

/** The heatmap series methods that tests count to tell an incremental update from a rebuild. */
export type HeatmapCellMethod = 'getItemStyle' | 'updateNodeDatum';

/** The heatmap series prototype, as far as `vi.spyOn` needs to see it: the per-cell methods. */
export type HeatmapCellMethods = Record<HeatmapCellMethod, (...args: never[]) => unknown>;

/**
 * The heatmap series prototype, typed to expose its per-cell methods (`getItemStyle` is protected and `updateNodeDatum`
 * private, so `vi.spyOn(HeatmapSeries.prototype, …)` does not accept them). Asserts that both methods exist.
 */
export function getHeatmapCellMethods(): HeatmapCellMethods {
    const prototype = new Caster(HeatmapSeries.prototype);
    prototype.accessProperty('getItemStyle').cast(Function);
    prototype.accessProperty('updateNodeDatum').cast(Function);
    // The one cast: it only widens the view of the prototype to the methods asserted just above.
    return prototype.value as unknown as HeatmapCellMethods;
}

/** The marker nodes a map-marker series drew; the series keeps its marker selection to itself. */
export function getMapMarkerNodes<TNode extends Node = Node>(chartOrProxy: ChartOrProxy<any>, index = 0): TNode[] {
    const selection = new Caster(getSeriesAt(chartOrProxy, index))
        .accessProperty('markerSelection')
        .cast(Selection).value;
    return selection.nodes() as TNode[];
}

/** The scene selections a flow-proportion series (sankey, chord) keeps to itself. */
export type FlowSelectionName =
    | 'nodeSelection'
    | 'linkSelection'
    | 'focusNodeSelection'
    | 'focusLinkSelection'
    | 'highlightNodeSelection'
    | 'highlightLinkSelection';

/**
 * The shapes a flow-proportion series drew into one of its selections: the nodes and links in place, on the focus
 * layer beside the hovered item's neighbours, and on the highlight layer. Each shape's `datum` is the datum it draws.
 */
export function getFlowSelectionNodes<TNode extends Node = Node>(
    chartOrProxy: ChartOrProxy<any>,
    name: FlowSelectionName,
    index = 0
): TNode[] {
    const selection = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty(name).cast(Selection).value;
    return selection.nodes() as TNode[];
}

/**
 * The labels a series placed with the label placement engine (`placedLabelData`), which the series keeps protected, in
 * the series' own coordinates. `TLabel` defaults to what `topLabelAnchorGap` reads.
 */
export function getPlacedLabelData<TLabel = PlacedLabelGeometry['placedLabelData'][number]>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): TLabel[] {
    const labels = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty('placedLabelData').cast(Array).value;
    return labels as TLabel[];
}

/** The stage labels a pyramid series drew, which sit apart from its value labels; the series keeps them private. */
export function getPyramidStageLabelNodes<TNode extends Node = Node>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): TNode[] {
    const selection = new Caster(getSeriesAt(chartOrProxy, index))
        .accessProperty('stageLabelSelection')
        .cast(Selection).value;
    return selection.nodes() as TNode[];
}

/** The label a hierarchy node (treemap tile, sunburst sector) was laid out with. */
export interface HierarchyNodeLabel {
    /** The text, or the text segments, the label draws. */
    text: unknown;
    /** How far from the centre a sunburst label sits; treemap labels have none. */
    radius: number | undefined;
}

/**
 * The primary or secondary label a hierarchy node was laid out with, `undefined` where it has none. `node` is one of
 * the nodes of the `getHierarchyRootNode` tree (the node classes are private to the series).
 */
export function getHierarchyNodeLabel(
    node: HierarchyNode,
    name: 'label' | 'secondaryLabel'
): HierarchyNodeLabel | undefined {
    const label = new Caster(node).accessProperty(name).value;
    if (label == null) return undefined;
    const caster = new Caster(label);
    return {
        text: caster.accessProperty('text').value,
        radius: caster.accessNullableProperty('radius').value as number | undefined,
    };
}

/** The label selections a gauge series keeps to itself; its centre and bar labels are in `getSeriesSelectionNodes`. */
export type GaugeSelectionName = 'targetLabelSelection' | 'tickSelection';

/** The text nodes a gauge series drew for its target labels or its scale ticks, in selection order. */
export function getGaugeSelectionNodes<TNode extends Node = Text>(
    chartOrProxy: ChartOrProxy<any>,
    name: GaugeSelectionName,
    index = 0
): TNode[] {
    const selection = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty(name).cast(Selection).value;
    return selection.nodes() as TNode[];
}

/**
 * The rects a linear gauge laid out: the series' own (`seriesRect`, in chart coordinates) and the gauge's within it
 * (`gaugeRect`), which the series keeps private.
 */
export function getLinearGaugeRects(chartOrProxy: ChartOrProxy<any>, index = 0): { gaugeRect: BBox; seriesRect: BBox } {
    const caster = new Caster(getSeriesAt(chartOrProxy, index));
    return {
        gaugeRect: caster.accessProperty('gaugeRect').cast(BBox).value,
        seriesRect: caster.accessProperty('seriesRect').cast(BBox).value,
    };
}

/**
 * The aspect ratio the map-shape series sized the label of the shape `idValue` with, from the label layouts it keeps
 * between updates. Fails for a shape the series laid no label out for.
 */
export function getMapShapeLabelAspectRatio(chartOrProxy: ChartOrProxy<any>, idValue: string, index = 0): number {
    const layouts = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty('previousLabelLayouts').cast(Map).value;
    return new Caster(layouts.get(idValue)).assertNonNullish().accessProperty('aspectRatio').value as number;
}

/** The linear gauge series at `index`, asserted to be one: its public API (`pickFocus`, `targetSelection`, …) is typed. */
export function getLinearGaugeSeriesInstance(chartOrProxy: ChartOrProxy<any>, index = 0): LinearGaugeSeries {
    return classCast(getSeriesAt(chartOrProxy, index), LinearGaugeSeries);
}

/** The radial gauge series at `index`, asserted to be one: its public API (`getCaptionText`, …) is typed. */
export function getRadialGaugeSeriesInstance(chartOrProxy: ChartOrProxy<any>, index = 0): RadialGaugeSeries {
    return classCast(getSeriesAt(chartOrProxy, index), RadialGaugeSeries);
}

/** The waterfall series at `index`, asserted to be one: its public API (`getNodeData`, `fireNodeClickEvent`, …) is typed. */
export function getWaterfallSeriesInstance(chartOrProxy: ChartOrProxy<any>, index = 0): WaterfallSeries {
    return classCast(getSeriesAt(chartOrProxy, index), WaterfallSeries);
}

/** The HLC series at `index`, asserted to be one: its public API (`getNodeData`, `getLegendData`, …) is typed. */
export function getHlcSeriesInstance(chartOrProxy: ChartOrProxy<any>, index = 0): HlcSeries {
    return classCast(getSeriesAt(chartOrProxy, index), HlcSeries);
}

/** The OHLC series at `index`, asserted to be one: its public API (`getNodeData`, `contentGroup`, …) is typed. */
export function getOhlcSeriesInstance(chartOrProxy: ChartOrProxy<any>, index = 0): OhlcSeries {
    return classCast(getSeriesAt(chartOrProxy, index), OhlcSeries);
}

/**
 * The datum the series-area manager has the keyboard focus on, or `undefined` when it has none. The manager keeps its
 * focus private; `getSeriesAreaFocus` reads the series and datum indices of the same focus.
 */
export function getSeriesAreaFocusDatum(chartOrProxy: ChartOrProxy<any>): unknown {
    return new Caster(deproxy(chartOrProxy))
        .accessProperty('seriesAreaManager')
        .accessProperty('focus')
        .accessNullableProperty('datum').value;
}

/** The ids the chart's legends go by when they update the highlight manager, in legend order (category, then gradient). */
export function getLegendHighlightCallerIds(chartOrProxy: ChartOrProxy<any>): string[] {
    return Array.from(deproxy(chartOrProxy).modulesManager.legends(), ({ legend }) => {
        return String(new Caster(legend).accessProperty('id').assertNonNullish().value);
    });
}

/** How far a legend item is translated from the left edge of its legend, in pixels. */
export function getLegendItemTranslationX(item: Node): number {
    return Number(new Caster(item).accessProperty('translationX').assertNonNullish().value);
}

/** The map-marker series at `index`, asserted to be one: its public API (`getTooltipContent`, …) is typed. */
export function getMapMarkerSeriesInstance(chartOrProxy: ChartOrProxy<any>, index = 0): MapMarkerSeries {
    return classCast(getSeriesAt(chartOrProxy, index), MapMarkerSeries);
}

/** The `[min, max]` marker size range a map-marker series scales its `sizeKey` values into. */
export function getMapMarkerSizeRange(chartOrProxy: ChartOrProxy<any>, index = 0): [number, number] {
    const range = new Caster(getSeriesAt(chartOrProxy, index))
        .accessProperty('sizeScale')
        .accessProperty('range')
        .cast(Array).value;
    return [Number(range[0]), Number(range[1])];
}

/** The size the map-marker series would draw `datum`'s marker at, as it resolves the marker's style. */
export function getMapMarkerStyleSize(
    chartOrProxy: ChartOrProxy<any>,
    datum: MapMarkerNodeDatum,
    isHighlight = false,
    index = 0
): number {
    const series = getSeriesAt(chartOrProxy, index);
    const getMarkerItemStyle = new Caster(series).accessProperty('getMarkerItemStyle').cast(Function).value;
    // The method is protected, so the only way to call it is untyped; it returns the resolved marker style.
    const style = getMarkerItemStyle.call(series, datum, isHighlight) as { size: number };
    return style.size;
}

/**
 * The series types of the mini chart the navigator draws, in series order. The mini chart keeps its own series list,
 * apart from the chart's, and the navigator keeps the mini chart private.
 */
export function getNavigatorMiniChartSeriesTypes(chartOrProxy: ChartOrProxy<any>): string[] {
    const navigator = deproxy(chartOrProxy).modulesManager.getModule('navigator');
    const miniChartSeries = new Caster(navigator)
        .accessProperty('miniChart')
        .accessProperty('series')
        .cast(Array).value;
    return miniChartSeries.map((series) =>
        String(new Caster(series).accessProperty('options').accessProperty('type').value)
    );
}

/**
 * The aggregation filter the HLC series applies at the end of the x axis' pixel range, or `undefined` when its data is
 * not aggregated at that range. `midpointIndices` maps each bucket to the datum index its drawn nodes stand at.
 */
export function getHlcAggregationFilter(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): OhlcSeriesDataAggregationFilter | undefined {
    const series = getHlcSeriesInstance(chartOrProxy, index);
    const manager = new Caster(series)
        .accessProperty('aggregationManager')
        .cast(_ModuleSupport.AggregationManager).value;
    const xAxis = defined(series.axes[ChartAxisDirection.X]);
    // The manager is generic over its filter type, which the HLC series fixes to the OHLC one.
    return manager.getFilterForRange(xAxis.scale.range[1]) as OhlcSeriesDataAggregationFilter | undefined;
}

/**
 * The nodes the HLC series highlights together for `highlightedItem`: the high, low and close of its datum, or
 * `undefined` when none match. The series computes them in a protected method.
 */
export function getHlcHighlightData(
    chartOrProxy: ChartOrProxy<any>,
    nodeData: HlcMarkerDatum[],
    highlightedItem: HlcMarkerDatum,
    index = 0
): HlcMarkerDatum[] | undefined {
    const series = getHlcSeriesInstance(chartOrProxy, index);
    const getHighlightData = new Caster(series).accessProperty('getHighlightData').cast(Function).value;
    // The method is protected, so it can only be called untyped; it returns `HlcMarkerDatum[] | undefined`.
    return getHighlightData.call(series, nodeData, highlightedItem) as HlcMarkerDatum[] | undefined;
}

/** The spans of the line along which the HLC series' two bands meet: the close, clamped to the high-low range. */
export function getHlcBandEdgeData(chartOrProxy: ChartOrProxy<any>, index = 0): _ModuleSupport.LinePathSpan[] {
    return new Caster(getSeriesContextNodeData(chartOrProxy, index)).accessProperty('bandEdgeData').cast(Array)
        .value as _ModuleSupport.LinePathSpan[];
}

/** The scene groups a radar-area series draws its filled area and its outline into; the series keeps both private. */
export interface RadarAreaGroups {
    areaGroup: Group;
    lineGroup: Group;
}

/** The area and line groups of the radar-area series at `index`; fails for a series that has neither. */
export function getRadarAreaGroups(chartOrProxy: ChartOrProxy<any>, index = 0): RadarAreaGroups {
    const series = new Caster(getSeriesAt(chartOrProxy, index));
    return {
        areaGroup: series.accessProperty('areaGroup').cast(Group).value,
        lineGroup: series.accessProperty('lineGroup').cast(Group).value,
    };
}
