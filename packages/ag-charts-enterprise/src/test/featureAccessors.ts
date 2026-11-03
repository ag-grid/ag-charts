import { type ChartOrProxy, deproxy, findAxis, getAxisLayoutState, getSeriesAt } from 'ag-charts-community-test';
import type { BBox, Group, Node, Rect } from 'ag-charts-core';

import type { MiniChart } from '../features/navigator/miniChart';
import type { Navigator } from '../features/navigator/navigator';

/** Narrows away `undefined` and `null`, naming what was missing when the chart does not hold it. */
function assertPresent<T>(value: T, what: string): asserts value is NonNullable<T> {
    if (value == null) {
        throw new Error(`Expected the chart to have ${what}`);
    }
}

// `Ranges.dropdownMinWidth` is private: the width the dropdown toolbar was last sized to, reset when the button size
// changes.
interface RangesHost {
    dropdownMinWidth?: number;
}

function getRanges(chartOrProxy: ChartOrProxy<any>): RangesHost {
    const ranges = deproxy(chartOrProxy).modulesManager.getModule<RangesHost>('ranges');
    assertPresent(ranges, 'ranges module');
    return ranges;
}

/** The minimum width the ranges module last sized its dropdown to, `undefined` before it has measured one. */
export function getRangesDropdownMinWidth(chartOrProxy: ChartOrProxy<any>): number | undefined {
    return getRanges(chartOrProxy).dropdownMinWidth;
}

/** Overwrites the dropdown's minimum width, to see whether a later update resets it. */
export function setRangesDropdownMinWidth(chartOrProxy: ChartOrProxy<any>, width: number | undefined): void {
    getRanges(chartOrProxy).dropdownMinWidth = width;
}

// `Series.moduleMap` is protected, and the error bar module keeps the group it draws into private.
interface SeriesModulesHost {
    moduleMap: { getModule<T>(name: string): T | undefined };
}

interface ErrorBarHost {
    groupNode: { opacity: number };
}

/** The opacity of the group the series' error bars are drawn into, which dims them with the rest of the series. */
export function getErrorBarGroupOpacity(chartOrProxy: ChartOrProxy<any>, seriesIndex = 0): number {
    const { moduleMap } = getSeriesAt(chartOrProxy, seriesIndex) as unknown as SeriesModulesHost;
    const errorBars = moduleMap.getModule<ErrorBarHost>('errorBar');
    assertPresent(errorBars, `series ${seriesIndex} error bars`);
    return errorBars.groupNode.opacity;
}

// `DataSelection.dragRect` is private: the rectangle the selection drag draws, clipped to the series area on move.
interface DataSelectionHost {
    dragRect: BBox;
}

/** The rectangle the selection drag is currently drawing, read mid-drag; it is not kept once the drag ends. */
export function getSelectionDragRect(chartOrProxy: ChartOrProxy<any>): {
    x: number;
    y: number;
    width: number;
    height: number;
} {
    const selection = deproxy(chartOrProxy).modulesManager.getModule<DataSelectionHost>('selection');
    assertPresent(selection, 'selection module');
    const { x, y, width, height } = selection.dragRect;
    return { x, y, width, height };
}

/** A label a series placed, after collision avoidance: where it ended up, and which of its placements it took. */
export interface PlacedLabel<TDatum = unknown> {
    x: number;
    y: number;
    width: number;
    height: number;
    placement?: string;
    /** The node datum the label belongs to. */
    datum: TDatum;
}

// `placedLabelData` is private to each series that places labels, and the data-model `Series` base does not declare it.
interface PlacedLabelHost<TDatum> {
    placedLabelData?: PlacedLabel<TDatum>[];
}

/** The labels the series placed, in placement order. Fails for a series that never places labels. */
export function getSeriesPlacedLabels<TDatum = unknown>(
    chartOrProxy: ChartOrProxy<any>,
    seriesIndex = 0
): PlacedLabel<TDatum>[] {
    const { placedLabelData } = getSeriesAt(chartOrProxy, seriesIndex) as unknown as PlacedLabelHost<TDatum>;
    assertPresent(placedLabelData, `series ${seriesIndex} placed labels`);
    return placedLabelData;
}

// The annotations module keeps its axis helpers private; the toolbars are public but belong to the module's own type.
interface AnnotationsHost {
    toolbar: { enabled?: boolean };
    optionsToolbar: {
        enabled?: boolean;
        updateButtons(annotation: object | undefined): void;
        show(): void;
        toolbar: { getElement(): HTMLElement };
    };
    annotationData?: object[];
    xAxis?: AnnotationAxisHost;
    yAxis?: AnnotationAxisHost & { context: { scale: { domain: number[] } } };
}

interface AnnotationAxisHost {
    button?: { button: { getElement(): HTMLElement } };
}

function getAnnotations(chartOrProxy: ChartOrProxy<any>): AnnotationsHost {
    const annotations = deproxy(chartOrProxy).modulesManager.getModule<AnnotationsHost>('annotations');
    assertPresent(annotations, 'annotations module');
    return annotations;
}

/** Whether the annotations module enabled its annotation toolbar and its options toolbar. */
export function getAnnotationToolbarsEnabled(chartOrProxy: ChartOrProxy<any>): {
    toolbar: boolean | undefined;
    optionsToolbar: boolean | undefined;
} {
    const { toolbar, optionsToolbar } = getAnnotations(chartOrProxy);
    return { toolbar: toolbar.enabled, optionsToolbar: optionsToolbar.enabled };
}

/** Whether the annotations module created the button that adds an annotation at the pointer on the `axis` axis. */
export function hasAnnotationAxisButton(chartOrProxy: ChartOrProxy<any>, axis: 'x' | 'y'): boolean {
    const annotations = getAnnotations(chartOrProxy);
    return (axis === 'x' ? annotations.xAxis : annotations.yAxis)?.button != null;
}

/** The domain of the y scale the annotations module places its annotations on. */
export function getAnnotationYAxisDomain(chartOrProxy: ChartOrProxy<any>): number[] {
    const { yAxis } = getAnnotations(chartOrProxy);
    assertPresent(yAxis, 'annotations y axis');
    return yAxis.context.scale.domain;
}

/**
 * The buttons the annotation options toolbar builds for the first annotation, which is what it shows while that
 * annotation is selected. Builds them, as selecting the annotation does.
 */
export function getAnnotationOptionsToolbarButtons(chartOrProxy: ChartOrProxy<any>): Element[] {
    const { optionsToolbar, annotationData } = getAnnotations(chartOrProxy);
    optionsToolbar.updateButtons(annotationData?.at(0));
    return Array.from(optionsToolbar.toolbar.getElement().querySelectorAll('.ag-charts-toolbar__button'));
}

/** The drag handle the annotation options toolbar renders beside its buttons. Shows the toolbar, as selecting does. */
export function getAnnotationOptionsToolbarDragHandle(chartOrProxy: ChartOrProxy<any>): HTMLElement {
    const { optionsToolbar } = getAnnotations(chartOrProxy);
    optionsToolbar.show();
    const dragHandle = optionsToolbar.toolbar
        .getElement()
        .parentElement?.querySelector<HTMLElement>('.ag-charts-floating-toolbar__drag-handle');
    assertPresent(dragHandle, 'options toolbar drag handle');
    return dragHandle;
}

/** The element of the button that adds an annotation at the pointer on the `axis` axis. */
export function getAnnotationAxisButtonElement(chartOrProxy: ChartOrProxy<any>, axis: 'x' | 'y'): HTMLElement {
    const annotations = getAnnotations(chartOrProxy);
    const button = (axis === 'x' ? annotations.xAxis : annotations.yAxis)?.button;
    assertPresent(button, `${axis} axis button`);
    return button.button.getElement();
}

// `Scene.root` is private; the scene graph hangs off it.
interface SceneHost {
    root: Group | null;
}

/**
 * Every node in the chart's scene graph that `predicate` accepts, in depth-first order. For the tests that find a
 * node by what it is (a name, a type) rather than where it sits; geometry and counts go through
 * `createSceneGeometrySampler`.
 */
export function findSceneNodes<TNode extends Node = Node>(
    chartOrProxy: ChartOrProxy<any>,
    predicate: (node: Node) => node is TNode
): TNode[];
export function findSceneNodes(chartOrProxy: ChartOrProxy<any>, predicate: (node: Node) => boolean): Node[];
export function findSceneNodes(chartOrProxy: ChartOrProxy<any>, predicate: (node: Node) => boolean): Node[] {
    const { root } = deproxy(chartOrProxy).ctx.scene as unknown as SceneHost;
    assertPresent(root, 'scene root');
    return Array.from(root.descendants()).filter(predicate);
}

export type ScrollbarOrientation = 'horizontal' | 'vertical';

/** What the scrollbar keeps for one of its two orientations: its scene nodes, layout and the axis it scrolls. */
export interface ScrollbarOrientationState {
    group: Group;
    track: Rect;
    thumb: Rect;
    /** The rectangle the last layout gave the scrollbar, `undefined` before it has been laid out. */
    layoutRect?: BBox;
    /** The id of the axis the scrollbar scrolls, `undefined` when no axis sits at its position. */
    axisId?: string;
    properties: { spacing: number; thickness: number };
}

// `Scrollbar.state` and `Scrollbar.handleHoverChange` are private.
interface ScrollbarHost {
    state: Record<ScrollbarOrientation, ScrollbarOrientationState>;
    handleHoverChange(orientation: ScrollbarOrientation, hovered: boolean): void;
}

function getScrollbar(chartOrProxy: ChartOrProxy<any>): ScrollbarHost {
    const scrollbar = deproxy(chartOrProxy).modulesManager.getModule<ScrollbarHost>('scrollbar');
    assertPresent(scrollbar, 'scrollbar module');
    return scrollbar;
}

/** The state the scrollbar keeps for `orientation`. The nodes in it are live: they change as the scrollbar does. */
export function getScrollbarState(
    chartOrProxy: ChartOrProxy<any>,
    orientation: ScrollbarOrientation
): ScrollbarOrientationState {
    return getScrollbar(chartOrProxy).state[orientation];
}

/** Puts the pointer on, or takes it off, the scrollbar at `orientation`, as its hover handler does. */
export function setScrollbarHovered(
    chartOrProxy: ChartOrProxy<any>,
    orientation: ScrollbarOrientation,
    hovered: boolean
): void {
    getScrollbar(chartOrProxy).handleHoverChange(orientation, hovered);
}

/** The extent the axis' labels need along its cross direction, which a scrollbar beside the axis has to make room for. */
export function getAxisLabelThickness(chartOrProxy: ChartOrProxy<any>, positionOrId: string): number {
    const { labelThickness } = getAxisLayoutState(chartOrProxy, positionOrId);
    assertPresent(labelThickness, `${positionOrId} axis label thickness`);
    return labelThickness;
}

// The room the chart layout granted an axis is kept on the axis itself, next to the options that set the label spacing.
interface AxisGrantHost {
    chartLayout?: { sizeLimit: number };
    options: { label: { spacing: number } };
}

/** The width the chart layout granted the axis for its labels and the spacing before them, before any clamp. */
export function getAxisGrantedLabelWidth(chartOrProxy: ChartOrProxy<any>, positionOrId: string): number {
    const { chartLayout, options } = findAxis(chartOrProxy, positionOrId) as unknown as AxisGrantHost;
    assertPresent(chartLayout, `${positionOrId} axis chart layout`);
    return chartLayout.sizeLimit + options.label.spacing;
}

// `Crosshair.crosshairGroup` and `Crosshair.lineGroupSelection` are private; the axis owns the crosshair as a module.
interface CrosshairHost {
    crosshairGroup: { visible: boolean };
    lineGroupSelection: { nodes(): { visible: boolean; y1: number }[] };
}

/**
 * The line the crosshair of the axis at `positionOrId` draws: whether it is shown (its group and the line itself),
 * and where it sits along the series area's y direction. Fails for an axis without a crosshair or a drawn line.
 */
export function getCrosshairLine(
    chartOrProxy: ChartOrProxy<any>,
    positionOrId: string
): { visible: boolean; y1: number } {
    const crosshair = (
        findAxis(chartOrProxy, positionOrId) as unknown as {
            getModuleMap(): { getModule<T>(name: string): T | undefined };
        }
    )
        .getModuleMap()
        .getModule<CrosshairHost>('crosshair');
    assertPresent(crosshair, `${positionOrId} axis crosshair`);
    const [line] = crosshair.lineGroupSelection.nodes();
    assertPresent(line, `${positionOrId} axis crosshair line`);
    return { visible: crosshair.crosshairGroup.visible && line.visible, y1: line.y1 };
}

/** The navigator module. Its track and mini chart are public; the range and drag handling are not, see below. */
export function getNavigator(chartOrProxy: ChartOrProxy<any>): Navigator {
    const navigator = deproxy(chartOrProxy).modulesManager.getModule<Navigator>('navigator');
    assertPresent(navigator, 'navigator module');
    return navigator;
}

// `Navigator.domProxy` (which keeps the range) is private, and the bounds the handles are dragged along are protected.
interface NavigatorRangeHost {
    domProxy: { _min: number; _max: number };
    x: number;
    width: number;
    onDrag(handle: 'min' | 'max' | 'pan', event: { offsetX: number }): void;
}

/** The range the navigator shows as a ratio of the full data, from `0` to `1`. */
export function getNavigatorRange(chartOrProxy: ChartOrProxy<any>): { min: number; max: number } {
    const { _min: min, _max: max } = (getNavigator(chartOrProxy) as unknown as NavigatorRangeHost).domProxy;
    return { min, max };
}

/**
 * Drags the navigator `handle` to `ratio` of the way along its track, as a pointer drag to that position does. The
 * navigator has to accept drags, as it does once the chart has settled.
 */
export function dragNavigatorHandle(
    chartOrProxy: ChartOrProxy<any>,
    handle: 'min' | 'max' | 'pan',
    ratio: number
): void {
    const navigator = getNavigator(chartOrProxy) as unknown as NavigatorRangeHost;
    navigator.onDrag(handle, { offsetX: navigator.x + navigator.width * ratio });
}

/** The mini chart of the navigator, which the navigator keeps even while the mini chart is disabled. */
export function getMiniChart(chartOrProxy: ChartOrProxy<any>): MiniChart {
    const { miniChart } = getNavigator(chartOrProxy);
    assertPresent(miniChart, 'navigator mini chart');
    return miniChart;
}

// The mini chart's series are the data-model series, which declare `getNodeData`, but the mini chart lists them
// through the `Series` base.
interface NodeDataHost {
    getNodeData?: () => unknown[] | undefined;
}

/** The datums the mini chart's series at `index` built its nodes from, empty before it has produced any. */
export function getMiniChartSeriesNodeData(chartOrProxy: ChartOrProxy<any>, index = 0): unknown[] {
    const series = getMiniChart(chartOrProxy).series[index] as unknown as NodeDataHost | undefined;
    if (typeof series?.getNodeData !== 'function') {
        throw new Error(`Expected mini chart series ${index} to expose its node data`);
    }
    return series.getNodeData() ?? [];
}

/** The options the mini chart's series at `index` resolved after theming; see `getSeriesOptions`. */
export function getMiniChartSeriesOptions<TOptions extends object = Record<string, unknown>>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): TOptions {
    const series = getMiniChart(chartOrProxy).series[index];
    assertPresent(series, `mini chart series ${index}`);
    return series.options as unknown as TOptions;
}

// A series keeps at most one node-data context, behind `contextNodeData`: the cartesian, map, pyramid, gauge,
// network, flow-proportion, radar and radial series all do. Pie and donut keep their datums on a protected
// `nodeData` instead, and the hierarchy series keep neither.
interface StoredNodeDataHost<TDatum> {
    contextNodeData?: { nodeData?: TDatum[] };
    nodeData?: TDatum[];
}

/** The node-data context the series keeps (`contextNodeData`), or undefined for a series that keeps none. */
export function getSeriesNodeDataContext<TDatum = unknown>(
    chartOrProxy: ChartOrProxy<any>,
    seriesIndex = 0
): { nodeData?: TDatum[] } | undefined {
    const { contextNodeData } = getSeriesAt(chartOrProxy, seriesIndex) as unknown as StoredNodeDataHost<TDatum>;
    return contextNodeData ?? undefined;
}

/**
 * The datums the series stored for its nodes: those of its node-data context when it keeps one, else its own
 * `nodeData` field (pie and donut), else empty (the hierarchy series).
 */
export function getSeriesStoredNodeData<TDatum = unknown>(chartOrProxy: ChartOrProxy<any>, seriesIndex = 0): TDatum[] {
    const series = getSeriesAt(chartOrProxy, seriesIndex) as unknown as StoredNodeDataHost<TDatum>;
    return getSeriesNodeDataContext<TDatum>(chartOrProxy, seriesIndex)?.nodeData ?? series.nodeData ?? [];
}

// `PolarSeries` lays itself out in the middle of the series area, at the largest radius the area allows.
interface PolarGeometryHost {
    centerX?: number;
    centerY?: number;
    radius?: number;
}

/** Where a polar series centred itself and the largest radius it may use. Fails for a series that is not polar. */
export function getSeriesPolarGeometry(
    chartOrProxy: ChartOrProxy<any>,
    seriesIndex = 0
): { centerX: number; centerY: number; radius: number } {
    const { centerX, centerY, radius } = getSeriesAt(chartOrProxy, seriesIndex) as unknown as PolarGeometryHost;
    if (centerX == null || centerY == null || radius == null) {
        throw new Error(`Expected series ${seriesIndex} to be a polar series`);
    }
    return { centerX, centerY, radius };
}

// `ChartAxis`, the type the chart lists its axes as, does not declare `gridLineGroup`; every `Axis` draws its
// gridlines into one.
interface GridLineGroupHost {
    gridLineGroup?: { visible: boolean };
}

/** Whether each axis shows its gridlines, in axis order: the visibility of the group they are drawn into. */
export function getAxesGridLinesVisible(chartOrProxy: ChartOrProxy<any>): boolean[] {
    return deproxy(chartOrProxy).axes.map((axis) => {
        const { gridLineGroup } = axis as unknown as GridLineGroupHost;
        assertPresent(gridLineGroup, `axis ${axis.id} gridline group`);
        return gridLineGroup.visible;
    });
}
