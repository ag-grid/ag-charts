import { expect, vi } from 'vitest';

import {
    type BBox,
    ChartAxisDirection,
    type Group,
    OrdinalTimeScale,
    type Scale,
    type TransformableText,
} from 'ag-charts-core';

import type { AxisValuePick } from '../../module/axisContext';
import type { LabelNodeDatum } from '../axis/axis';
import type { TickInterval } from '../axis/axisTick';
import { CartesianAxis } from '../axis/cartesianAxis';
import type { GenerateTicksOptions } from '../axis/generateTicksUtils';
import type { ChartAxisLabel } from '../chartAxis';
import type { AxisLabelSource } from '../layout/axisLabelSource';
import { type ChartOrProxy, createSceneGeometrySampler, deproxy } from './utils';

/** A tick-label node as drawn by an axis, with the datum the axis layout wrote onto it. */
export type AxisLabelNode = TransformableText<LabelNodeDatum> & { datum: LabelNodeDatum };

export interface AxisLabelOptions {
    /**
     * Only the labels the axis layout kept (`datum.visible`). Pass `false` to see every node in the scene graph,
     * which is what a test about labels being removed, or flagged as wrapped or truncated, has to read: a
     * visible-only count passes vacuously when the labels were merely hidden or never produced.
     */
    visibleOnly?: boolean;
}

// `Axis.tickLabelGroupSelection` is protected, and the label nodes are the only record of what the axis drew.
interface TickLabelSelectionHost {
    tickLabelGroupSelection: { nodes(): Iterable<TransformableText<LabelNodeDatum>> };
}

function hasDatum(node: TransformableText<LabelNodeDatum>): node is AxisLabelNode {
    return node.datum != null;
}

/** The cartesian axis at `positionOrId`: a position (`'bottom'`, `'left'`, …) or an axis id (`'x'`, `'y'`). */
export function findAxis(chartOrProxy: ChartOrProxy<any>, positionOrId: string): CartesianAxis {
    const axis = deproxy(chartOrProxy)
        .axes.filter((a) => CartesianAxis.is(a))
        .find((a) => a.position === positionOrId || a.id === positionOrId);
    expect(axis).toBeDefined();
    return axis!;
}

/** The tick-label nodes of the axis at `position`, in scene-graph order. */
export function getAxisLabelNodes(
    chartOrProxy: ChartOrProxy<any>,
    position: string,
    { visibleOnly = true }: AxisLabelOptions = {}
): AxisLabelNode[] {
    // The one reach into the protected selection, through a named narrow type.
    const { tickLabelGroupSelection } = findAxis(chartOrProxy, position) as unknown as TickLabelSelectionHost;
    const nodes = Array.from(tickLabelGroupSelection.nodes());
    expect(nodes.every(hasDatum)).toBe(true);
    return nodes.filter(hasDatum).filter((node) => !visibleOnly || node.datum.visible);
}

/** A label's text as one string; the segments of a rich-text label are joined. */
export function getLabelText(node: AxisLabelNode): string {
    const { text } = node.datum;
    return Array.isArray(text) ? text.map((segment) => ('text' in segment ? segment.text : '')).join('') : String(text);
}

/** The `verticalAlign` each segment of a rich-text label carries (`undefined` for a segment that sets none). */
export function getLabelSegmentAlignments(node: AxisLabelNode): (string | undefined)[] {
    const { text } = node.datum;
    expect(Array.isArray(text)).toBe(true);
    return Array.isArray(text)
        ? text.map((segment) => ('verticalAlign' in segment ? segment.verticalAlign : undefined))
        : [];
}

/** The text the axis' label nodes render, rich-text segments joined, without the empty ones. */
export function getAxisLabelTexts(
    chartOrProxy: ChartOrProxy<any>,
    position: string,
    options?: AxisLabelOptions
): string[] {
    return getAxisLabelNodes(chartOrProxy, position, options)
        .map(getLabelText)
        .filter((text) => text !== '');
}

/** The axis title's rendered text; the caption wraps and clips it, so this is the text as laid out. */
export function getAxisTitleText(chartOrProxy: ChartOrProxy<any>, position: string): string {
    const { text } = findAxis(chartOrProxy, position).caption.node;
    expect(text).toBeDefined();
    return String(text);
}

/** The series rect, asserted to have been laid out. */
export function getSeriesRect(chartOrProxy: ChartOrProxy<any>): BBox {
    const { seriesRect } = deproxy(chartOrProxy);
    expect(seriesRect).toBeDefined();
    return seriesRect!;
}

/** The band width of the axis' scale, `0` for a continuous scale, which has no bands. */
export function getAxisBandwidth(chartOrProxy: ChartOrProxy<any>, position: string): number {
    return findAxis(chartOrProxy, position).scale.bandwidth ?? 0;
}

/**
 * The extent along the axis of the band `value` sits in. A reversed axis flips where the band sits, not its width, so
 * `start` is always the scale's own position for `value` and `end` is `bandwidth` further along.
 */
export function getAxisBandExtent(
    chartOrProxy: ChartOrProxy<any>,
    position: string,
    value: unknown
): { start: number; end: number; bandwidth: number } {
    const { scale } = findAxis(chartOrProxy, position);
    const bandwidth = scale.bandwidth ?? 0;
    const start: number = scale.convert(value);
    return { start, end: start + bandwidth, bandwidth };
}

/** The axis' scale domain: the numbers, dates or categories the axis was fitted to, after any nicing. */
export function getAxisDomain(chartOrProxy: ChartOrProxy<any>, position: string): unknown[] {
    return [...findAxis(chartOrProxy, position).scale.domain];
}

/**
 * What the axis picks at `value`. The canvas point is where the axis' own scale puts `value` along the axis, from the
 * axis' translation, so a point the axis draws is a point it must resolve back to the same datum.
 */
export function pickAxisValue(
    chartOrProxy: ChartOrProxy<any>,
    position: string,
    value: unknown
): AxisValuePick | undefined {
    const axis = findAxis(chartOrProxy, position);
    const { translation } = axis.getLayoutState();
    const along: number = axis.scale.convert(value);
    return axis.pickValue(
        axis.direction === ChartAxisDirection.X
            ? { canvasX: translation.x + along, canvasY: translation.y }
            : { canvasX: translation.x, canvasY: translation.y + along }
    );
}

/** The source through which the axis contributes its drawn tick labels as obstacles to label placement. */
export function getAxisLabelSource(chartOrProxy: ChartOrProxy<any>, position: string): AxisLabelSource {
    return findAxis(chartOrProxy, position).labelSource;
}

/** The layout the axis reports to the rest of the chart, as it stands after the last layout pass. */
export function getAxisLayoutState(
    chartOrProxy: ChartOrProxy<any>,
    position: string
): ReturnType<CartesianAxis['getLayoutState']> {
    return findAxis(chartOrProxy, position).getLayoutState();
}

/**
 * Where the scene draws the axis line at `position`: the translation of its line group, floored to the pixel it is
 * placed on, as drawn rather than as the axis computed it.
 */
export function getAxisLinePosition(chartOrProxy: ChartOrProxy<any>, position: string): { x: number; y: number } {
    const { id } = findAxis(chartOrProxy, position);
    const line = createSceneGeometrySampler(chartOrProxy)().get(`axis[${position}]/group[${id}-Axis-line]`);
    expect(line).toBeDefined();
    return { x: line!.translationX, y: line!.translationY };
}

/** The group holding the grid of the axis with `id`; polar axes included, which `findAxis` does not look up. */
export function getAxisGridGroupById(chartOrProxy: ChartOrProxy<any>, id: string): Group {
    const axis: unknown = deproxy(chartOrProxy).axes.findById(id);
    expect(axis).toBeDefined();
    // `ChartAxis`, the type `findById` returns, does not declare `gridGroup`; every `Axis` has one.
    const { gridGroup } = axis as { gridGroup?: Group };
    expect(gridGroup).toBeDefined();
    return gridGroup!;
}

/**
 * A tick label as the axis resolves it: only the options tick generation reads are set, the rest stay unset.
 * Pass the overrides a test is about (`lineHeight`, `format`, …).
 */
export function tickLabel(overrides: Partial<ChartAxisLabel> = {}): ChartAxisLabel {
    return { enabled: true, fontSize: 12, spacing: 0, avoidCollisions: true, autoRotate: false, ...overrides };
}

/**
 * The options of one `generateTicks` pass over a horizontal axis, where `defaultRotation` is a quarter turn and
 * a `verticalAlign` flush applies. A test supplies the scale, domain and range it is about, plus any overrides.
 */
export function tickGenerationParams<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    params: Pick<GenerateTicksOptions<TScale, TDatum>, 'scale' | 'domain' | 'range'> &
        Partial<GenerateTicksOptions<TScale, TDatum>>
): GenerateTicksOptions<TScale, TDatum> {
    return {
        label: tickLabel(),
        parallel: true,
        axisRotation: Math.PI / -2,
        visibleRange: [0, 1],
        niceMode: [],
        reverse: false,
        primaryTickCount: undefined,
        defaultTickMinSpacing: 50,
        labelOffset: 0,
        sideFlag: -1,
        interval: undefined,
        tickFormatter: () => (value: unknown) => String(value),
        ...params,
    };
}

// `numericBands` is a protected derived cache of `OrdinalTimeScale`; `vi.spyOn` needs it as a public key.
interface NumericBandsHost {
    readonly numericBands: number[];
}

/** The numeric form of an ordinal-time scale's bands, building it if the scale had not yet. */
export function numericBandsOf(scale: OrdinalTimeScale): number[] {
    return scale['numericBands'];
}

/**
 * Spies on the getter through which every read of an ordinal-time scale's `numericBands` passes, and which
 * builds them on first use. A lookup that never calls it has not paid for the build.
 */
export function spyOnNumericBandsBuild() {
    return vi.spyOn(OrdinalTimeScale.prototype as unknown as NumericBandsHost, 'numericBands', 'get');
}
