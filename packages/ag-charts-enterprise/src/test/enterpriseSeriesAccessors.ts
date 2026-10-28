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
import type { MapMarkerNodeDatum } from '../series/map-marker/mapMarkerSeries';
import { NetworkLayout } from '../series/network/networkLayout';
import type { NetworkLinkNode } from '../series/network/networkLinkNode';
import { AbstractNetworkSeries } from '../series/network/networkSeries';
import type { OhlcSeriesDataAggregationFilter } from '../series/ohlc/ohlcAggregation';
import { OrganizationGraph } from '../series/organization/organizationGraph';
import type { OrganizationNode } from '../series/organization/organizationNode';
import { OrganizationSeries } from '../series/organization/organizationSeries';
import type {
    OrganizationDatum,
    OrganizationEdge,
    OrganizationLinkDatum,
    OrganizationVertex,
} from '../series/organization/organizationTypes';

// Enterprise series internals the shared accessors have no name for; each fails with a vitest assertion when what it reads is missing.

/** `value`, asserted to be neither `null` nor `undefined`. */
function defined<T>(value: T | null | undefined): T {
    return new Caster(value).assertNonNullish().value;
}

/** The node datums of a flow-proportion series (sankey, chord); `TGeometry` is the geometry its own datum adds. */
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

/** The link datums of a flow-proportion series (sankey, chord). */
export function getFlowLinkData(chartOrProxy: ChartOrProxy<any>, index = 0): FlowProportionLinkDatum<any, any>[] {
    return getSeriesContextNodeData<FlowProportionNodeDatum<any, any> | FlowProportionLinkDatum<any, any>>(
        chartOrProxy,
        index
    ).nodeData.filter(
        (datum): datum is FlowProportionLinkDatum<any, any> => datum.type === FlowProportionDatumType.Link
    );
}

function datumItemId(datum: unknown): unknown {
    return datum != null && typeof datum === 'object' && 'itemId' in datum ? datum.itemId : undefined;
}

/** The copy of the highlighted node or link that a sankey or chord series draws on its highlight layer, if any. */
export function getFlowHighlightNode(chartOrProxy: ChartOrProxy<any>, index = 0): Shape | undefined {
    const highlightedId = datumItemId(deproxy(chartOrProxy).ctx.highlightManager.getActiveHighlight());
    if (highlightedId === undefined) return undefined;
    return [
        ...getSeriesGroup(chartOrProxy, 'highlightLinkGroup', index).children(),
        ...getSeriesGroup(chartOrProxy, 'highlightNodeGroup', index).children(),
    ].find((child): child is Shape => child instanceof Shape && datumItemId(child.datum) === highlightedId);
}

/** The series at `index`, asserted to be an instance of `seriesClass`, so its public API is typed. */
export function getSeriesInstance<TSeries>(
    chartOrProxy: ChartOrProxy<any>,
    seriesClass: abstract new (...args: any[]) => TSeries,
    index = 0
): TSeries {
    return classCast(getSeriesAt(chartOrProxy, index), seriesClass);
}

/** Destroys the chart a test built, if any, and returns `undefined` typed as `never` so `chart = destroyChart(chart)` clears it. */
export function destroyChart(chart: { destroy(): unknown } | undefined): never {
    chart?.destroy();
    return undefined as never;
}

/** The vertex graph the organization series built from its data. */
export function getOrganizationGraph(chartOrProxy: ChartOrProxy<any>, index = 0): OrganizationGraph {
    return new Caster(getSeriesInstance(chartOrProxy, OrganizationSeries, index))
        .accessProperty('graph')
        .cast(OrganizationGraph).value;
}

/** The index of the node selection entry that draws `vertex` (render order), or `undefined` if it draws none. */
export function getOrganizationNodeDatumIndex(
    chartOrProxy: ChartOrProxy<any>,
    vertex: Vertex<OrganizationVertex, OrganizationEdge>,
    index = 0
): number | undefined {
    const series = getSeriesInstance(chartOrProxy, OrganizationSeries, index);
    const getNodeDatumIndex = new Caster(series).accessProperty('getNodeDatumIndex').cast(Function).value;
    return getNodeDatumIndex.call(series, vertex) as number | undefined;
}

/** A card node the organization series drew, with its datum, which always carries an `itemId`. */
export interface OrganizationCard {
    node: OrganizationNode;
    datum: OrganizationDatum & { itemId: NonNullable<OrganizationDatum['itemId']> };
}

/** The cards the organization series drew, in selection (render) order. */
export function getOrganizationCards(chartOrProxy: ChartOrProxy<any>, index = 0): OrganizationCard[] {
    return getSeriesSelectionNodes<OrganizationNode>(chartOrProxy, 'datumSelection', index).map((node) => {
        defined(node.datum?.itemId);
        return { node, datum: node.datum as OrganizationCard['datum'] };
    });
}

/** A link node the organization series drew, with its datum. */
export interface OrganizationLink {
    node: NetworkLinkNode<OrganizationLinkDatum>;
    datum: OrganizationLinkDatum;
}

/** The links the organization series drew between its cards. */
export function getOrganizationLinks(chartOrProxy: ChartOrProxy<any>, index = 0): OrganizationLink[] {
    return getEnterpriseSelectionNodes<NetworkLinkNode<OrganizationLinkDatum>>(
        chartOrProxy,
        'linkSelection',
        index
    ).map((node) => {
        return { node, datum: defined(node.datum) };
    });
}

/** The text a card rendered; `undefined` for a tier the card has no node for. */
export interface OrganizationCardTexts {
    title: string | undefined;
    subtitle: string | undefined;
    labels: (string | undefined)[];
}

/** The title, subtitle and label texts of an organization card. */
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

/** The zoom and pan a network series applies through its `viewportGroup`. */
export interface NetworkViewport {
    scalingX: number;
    scalingY: number;
    translationX: number;
    translationY: number;
}

/** The viewport transform of a network series. */
export function getNetworkViewport(chartOrProxy: ChartOrProxy<any>, index = 0): NetworkViewport {
    const series = classCast(getSeriesAt(chartOrProxy, index), AbstractNetworkSeries);
    const { scalingX, scalingY, translationX, translationY } = new Caster(series)
        .accessProperty('viewportGroup')
        .cast(Group).value as unknown as NetworkViewport;
    return { scalingX, scalingY, translationX, translationY };
}

/** The bounds of everything a network series' layout placed, in viewport coordinates. */
export function getNetworkContentBBox(chartOrProxy: ChartOrProxy<any>, index = 0): BBox {
    const series = classCast(getSeriesAt(chartOrProxy, index), AbstractNetworkSeries);
    const layout = new Caster(series).accessProperty('layout');
    const getContentBBox = layout.accessProperty('getContentBBox').cast(Function).value;
    return new Caster(getContentBBox.call(layout.value)).cast(BBox).value;
}

/** The layout a network series positions its nodes with. */
export function getNetworkLayout(chartOrProxy: ChartOrProxy<any>, index = 0): NetworkLayout<unknown, unknown> {
    const series = classCast(getSeriesAt(chartOrProxy, index), AbstractNetworkSeries);
    return new Caster(series).accessProperty('layout').cast(NetworkLayout).value;
}

/** The rect the chart gave a network series to lay out in. */
export function getNetworkSeriesRect(chartOrProxy: ChartOrProxy<any>, index = 0): BBox {
    const series = classCast(getSeriesAt(chartOrProxy, index), AbstractNetworkSeries);
    return new Caster(series).accessProperty('seriesRect').cast(BBox).value;
}

/** A treemap label's text as laid out, with its font size, line height and position. */
export interface TreemapLabelLayout {
    text: string;
    fontSize: number;
    lineHeight: number;
    x: number;
    y: number;
}

/** What a treemap laid out for one node; `undefined` where it laid out nothing (a collapsed group, an unlabelled tile). */
export interface TreemapNodeLayout {
    bbox: BBox | undefined;
    padding: { top: number; right: number; bottom: number; left: number } | undefined;
    label: TreemapLabelLayout | undefined;
    secondaryLabel: TreemapLabelLayout | undefined;
    groupTitleLabelHeight: number | undefined;
}

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

/** What the treemap laid out for `node`, one of its `getHierarchyRootNode` tree's nodes. */
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

export type SeriesGroupName =
    | 'sectorGroup'
    | 'scalingGroup'
    | 'innerLabelsGroup'
    | 'labelGroup'
    | 'nodeGroup'
    | 'linkGroup'
    | 'highlightNodeGroup'
    | 'highlightLinkGroup'
    | 'focusLinkGroup'
    | 'focusNodeGroup'
    | 'connectorNodeGroup'
    | 'dataNodeGroup'
    | 'itemGroup'
    | 'areaGroup'
    | 'rectGroup'
    | 'markerGroup';

/** A scene group the series keeps to itself. */
export function getSeriesGroup(chartOrProxy: ChartOrProxy<any>, name: SeriesGroupName, index = 0): Group {
    return new Caster(getSeriesAt(chartOrProxy, index)).accessProperty(name).cast(Group).value;
}

/** The text nodes a series drew into its label group, in scene order. */
export function getSeriesLabelTexts(chartOrProxy: ChartOrProxy<any>, index = 0): Text[] {
    return Selection.selectByClass(getSeriesGroup(chartOrProxy, 'labelGroup', index), Text);
}

export type EnterpriseSelectionName =
    | 'linkSelection'
    | 'innerCircleSelection'
    | 'nodeSelection'
    | 'focusNodeSelection'
    | 'focusLinkSelection'
    | 'highlightNodeSelection'
    | 'highlightLinkSelection'
    | 'markerSelection'
    | 'stageLabelSelection'
    | 'targetLabelSelection'
    | 'tickSelection';

/** The nodes a series drew into one of its selections that `getSeriesSelectionNodes` has no name for. */
export function getEnterpriseSelectionNodes<TNode extends Node = Node>(
    chartOrProxy: ChartOrProxy<any>,
    name: EnterpriseSelectionName,
    index = 0
): TNode[] {
    const selection = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty(name).cast(Selection).value;
    return selection.nodes() as TNode[];
}

function datumIndexOf(datum: unknown): unknown {
    return datum != null && typeof datum === 'object' && 'datumIndex' in datum ? datum.datumIndex : undefined;
}

/** The node datum of a stage series (funnel, cone funnel, pyramid): its position, mid-point and source datum. */
export interface StageNodeDatum {
    x: number;
    y: number;
    midPoint: { x: number; y: number };
    datum: Record<string, unknown>;
}

/** The highlight-layer copy of the highlighted stage, matched by `datumIndex`; asserts that a datum with an index is highlighted. */
export function getStageHighlightNode(chartOrProxy: ChartOrProxy<any>, index = 0): Shape | undefined {
    const highlighted = defined(deproxy(chartOrProxy).ctx.highlightManager.getActiveHighlight());
    const highlightedIndex = defined(highlighted.datumIndex);
    return [...getSeriesAt(chartOrProxy, index).highlightNodeGroup.children()].find(
        (child): child is Shape => child instanceof Shape && datumIndexOf(child.datum) === highlightedIndex
    );
}

/** The connectors a funnel or cone funnel series drew between its stages. */
export function getFunnelConnectorNodes(chartOrProxy: ChartOrProxy<any>, index = 0): FunnelConnector[] {
    const selection = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty('connectorSelection').cast(Selection);
    return selection.value.nodes().map((node) => new Caster(node).cast(FunnelConnector).value);
}

/** The `suppressHighlight` of a legend item's datum, as read; asserts it is `true` or absent, as its type says. */
export function getLegendItemSuppressHighlight(item: LegendTestItemNode): true | undefined {
    const suppressHighlight = new Caster(item.datum)
        .assertNonNullish()
        .accessNullableProperty('suppressHighlight').value;
    if (suppressHighlight !== true && suppressHighlight !== undefined) {
        throw new Error(`Expected suppressHighlight to be true or undefined, got ${String(suppressHighlight)}`);
    }
    return suppressHighlight;
}

/** The heatmap per-cell methods that tests count to tell an incremental update from a rebuild. */
export type HeatmapCellMethod = 'getItemStyle' | 'updateNodeDatum';

/** The heatmap prototype as far as `vi.spyOn` needs it. */
export type HeatmapCellMethods = Record<HeatmapCellMethod, (...args: never[]) => unknown>;

/** The heatmap prototype, typed to expose the non-public per-cell methods `vi.spyOn` rejects; asserts both exist. */
export function getHeatmapCellMethods(): HeatmapCellMethods {
    const prototype = new Caster(HeatmapSeries.prototype);
    prototype.accessProperty('getItemStyle').cast(Function);
    prototype.accessProperty('updateNodeDatum').cast(Function);
    return prototype.value as unknown as HeatmapCellMethods;
}

/** The labels a series placed with the label placement engine, in the series' coordinates. */
export function getPlacedLabelData<TLabel = PlacedLabelGeometry['placedLabelData'][number]>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): TLabel[] {
    const labels = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty('placedLabelData').cast(Array).value;
    return labels as TLabel[];
}

/** The label a hierarchy node was laid out with; `radius` is a sunburst label's distance from the centre. */
export interface HierarchyNodeLabel {
    text: unknown;
    radius: number | undefined;
}

/** The primary or secondary label of a `getHierarchyRootNode` tree node, `undefined` where it has none. */
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

/** The series rect of a linear gauge (chart coordinates) and the gauge's rect within it. */
export function getLinearGaugeRects(chartOrProxy: ChartOrProxy<any>, index = 0): { gaugeRect: BBox; seriesRect: BBox } {
    const caster = new Caster(getSeriesAt(chartOrProxy, index));
    return {
        gaugeRect: caster.accessProperty('gaugeRect').cast(BBox).value,
        seriesRect: caster.accessProperty('seriesRect').cast(BBox).value,
    };
}

/** The aspect ratio the map-shape series sized the label of shape `idValue` with; fails if it laid none out. */
export function getMapShapeLabelAspectRatio(chartOrProxy: ChartOrProxy<any>, idValue: string, index = 0): number {
    const layouts = new Caster(getSeriesAt(chartOrProxy, index)).accessProperty('previousLabelLayouts').cast(Map).value;
    return new Caster(layouts.get(idValue)).assertNonNullish().accessProperty('aspectRatio').value as number;
}

/** The datum the series-area manager has the keyboard focus on, or `undefined`; see `getSeriesAreaFocus` for the indices. */
export function getSeriesAreaFocusDatum(chartOrProxy: ChartOrProxy<any>): unknown {
    return new Caster(deproxy(chartOrProxy))
        .accessProperty('seriesAreaManager')
        .accessProperty('focus')
        .accessNullableProperty('datum').value;
}

/** The ids the chart's legends update the highlight manager by, in legend order. */
export function getLegendHighlightCallerIds(chartOrProxy: ChartOrProxy<any>): string[] {
    return Array.from(deproxy(chartOrProxy).modulesManager.legends(), ({ legend }) => {
        return String(new Caster(legend).accessProperty('id').assertNonNullish().value);
    });
}

/** How far a legend item is translated from its legend's left edge, in pixels. */
export function getLegendItemTranslationX(item: Node): number {
    return Number(new Caster(item).accessProperty('translationX').assertNonNullish().value);
}

/** The `[min, max]` marker size a map-marker series scales its `sizeKey` values into. */
export function getMapMarkerSizeRange(chartOrProxy: ChartOrProxy<any>, index = 0): [number, number] {
    const range = new Caster(getSeriesAt(chartOrProxy, index))
        .accessProperty('sizeScale')
        .accessProperty('range')
        .cast(Array).value;
    return [Number(range[0]), Number(range[1])];
}

/** The size the map-marker series resolves for `datum`'s marker. */
export function getMapMarkerStyleSize(
    chartOrProxy: ChartOrProxy<any>,
    datum: MapMarkerNodeDatum,
    isHighlight = false,
    index = 0
): number {
    const series = getSeriesAt(chartOrProxy, index);
    const getMarkerItemStyle = new Caster(series).accessProperty('getMarkerItemStyle').cast(Function).value;
    const style = getMarkerItemStyle.call(series, datum, isHighlight) as { size: number };
    return style.size;
}

/** The series types of the navigator's mini chart, which keeps its own series list. */
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

/** The aggregation filter the HLC series applies at the end of the x axis range, or `undefined` if not aggregated. */
export function getHlcAggregationFilter(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): OhlcSeriesDataAggregationFilter | undefined {
    const series = getSeriesInstance(chartOrProxy, HlcSeries, index);
    const manager = new Caster(series)
        .accessProperty('aggregationManager')
        .cast(_ModuleSupport.AggregationManager).value;
    const xAxis = defined(series.axes[ChartAxisDirection.X]);
    return manager.getFilterForRange(xAxis.scale.range[1]) as OhlcSeriesDataAggregationFilter | undefined;
}

/** The nodes the HLC series highlights together for `highlightedItem` (high, low and close), or `undefined`. */
export function getHlcHighlightData(
    chartOrProxy: ChartOrProxy<any>,
    nodeData: HlcMarkerDatum[],
    highlightedItem: HlcMarkerDatum,
    index = 0
): HlcMarkerDatum[] | undefined {
    const series = getSeriesInstance(chartOrProxy, HlcSeries, index);
    const getHighlightData = new Caster(series).accessProperty('getHighlightData').cast(Function).value;
    return getHighlightData.call(series, nodeData, highlightedItem) as HlcMarkerDatum[] | undefined;
}

/** The spans of the line where the HLC series' two bands meet. */
export function getHlcBandEdgeData(chartOrProxy: ChartOrProxy<any>, index = 0): _ModuleSupport.LinePathSpan[] {
    return new Caster(getSeriesContextNodeData(chartOrProxy, index)).accessProperty('bandEdgeData').cast(Array)
        .value as _ModuleSupport.LinePathSpan[];
}

/** The scene groups a radar-area series draws its fill and outline into. */
export interface RadarAreaGroups {
    areaGroup: Group;
    lineGroup: Group;
}

/** The area and line groups of the radar-area series at `index`. */
export function getRadarAreaGroups(chartOrProxy: ChartOrProxy<any>, index = 0): RadarAreaGroups {
    const series = new Caster(getSeriesAt(chartOrProxy, index));
    return {
        areaGroup: series.accessProperty('areaGroup').cast(Group).value,
        lineGroup: series.accessProperty('lineGroup').cast(Group).value,
    };
}
