import { _ModuleSupport } from 'ag-charts-community';
import {
    type BoxBounds,
    type CollideWith,
    type LabelObstacle,
    type Node,
    type NormalisedTextOrSegments,
    type PlacedLabel,
    type PointLabelDatum,
    type Selection,
    Text,
    type TextBoxingProperties,
    lineHeightAtSize,
    resolveCollideWith,
} from 'ag-charts-core';
import type { AgChartLabelCollisionOptions, FontStyle, FontWeight, PaddingOptions, TextWrap } from 'ag-charts-types';

import { formatSingleLabel } from '../util/labelFormatter';

const { expandLabelBoxExtent } = _ModuleSupport;

const COLLIDE_WITH_NOTHING: CollideWith = { marker: false, label: false, seriesItem: false, seriesArea: false };

export interface GaugeLabelCandidate {
    /** Reported back by {@link gaugeLabelPlacements} when the label manager picks this candidate. */
    readonly id: number;
    readonly box: BoxBounds;
    /** Room the candidate must stay within; the box itself when unset. */
    readonly region?: BoxBounds;
}

export interface GaugePointLabelDatum extends PointLabelDatum {
    readonly key: string;
    readonly candidateIds: readonly number[];
}

/** Ids of the candidates the label manager placed, keyed by label; a label it dropped is absent. */
export type GaugeLabelPlacements = ReadonlyMap<string, number>;

export function gaugeLabelDatum(
    key: string,
    text: NormalisedTextOrSegments,
    candidates: readonly GaugeLabelCandidate[],
    collision: AgChartLabelCollisionOptions | undefined,
    keepWithoutCollision: boolean,
    seriesArea: BoxBounds,
    labelGroup?: string
): GaugePointLabelDatum | undefined {
    const [first] = candidates;
    if (first == null) return;

    const collideWith =
        collision == null
            ? COLLIDE_WITH_NOTHING
            : resolveCollideWith({ ...collision, alwaysShow: collision.alwaysShow === true });
    const keep = collision == null ? keepWithoutCollision : collision.alwaysShow === true;
    const area = collideWith.seriesArea === true ? seriesArea : undefined;

    return {
        key,
        candidateIds: candidates.map((c) => c.id),
        point: { x: first.box.x + first.box.width / 2, y: first.box.y + first.box.height / 2, size: 0 },
        label: { text, width: first.box.width, height: first.box.height },
        anchor: undefined,
        placement: undefined,
        alwaysShow: keep,
        neverDrop: keep,
        collideWith,
        threshold: collision?.threshold,
        labelGroup,
        outranks: collision != null,
        positionedCandidates: candidates.map(({ box, region = box }) => ({
            box,
            region: area == null ? region : intersectBounds(region, area),
            flushToRegion: false,
            visibleRegion: seriesArea,
            size: { width: box.width, height: box.height },
        })),
    };
}

function intersectBounds(a: BoxBounds, b: BoxBounds): BoxBounds {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x);
    const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y);
    return { x, y, width, height };
}

function isGaugePointLabelDatum(datum: unknown): datum is GaugePointLabelDatum {
    return typeof datum === 'object' && datum != null && 'candidateIds' in datum;
}

export function gaugeLabelPlacements(placed: readonly PlacedLabel<unknown>[]): GaugeLabelPlacements {
    const placements = new Map<string, number>();
    for (const { datum, candidate } of placed) {
        if (!isGaugePointLabelDatum(datum) || candidate == null) continue;
        const index = datum.positionedCandidates?.indexOf(candidate) ?? -1;
        if (index !== -1) {
            placements.set(datum.key, datum.candidateIds[index]);
        }
    }
    return placements;
}

/** Target markers; those whose label sets `collision` outrank the scale labels, and none blocks its own label. */
export function gaugeTargetMarkerObstacles<T extends GaugeTargetObstacleDatum>(
    selection: Selection<T, Node<T>>
): LabelObstacle[] {
    const obstacles: LabelObstacle[] = [];
    for (const { node, datum } of selection) {
        if (!node.visible) continue;
        const box = node.getBBox();
        if (box.isFinite()) {
            const outranks = datum.label.collision != null;
            obstacles.push({ kind: 'rect', box, category: 'marker', labelGroup: datum.itemId, outranks });
        }
    }
    return obstacles;
}

interface GaugeTargetObstacleDatum {
    readonly itemId: string;
    readonly label: { readonly collision: AgChartLabelCollisionOptions | undefined };
}

const SCALE_LABEL_COLLIDE_WITH: CollideWith = { marker: true, label: true, seriesItem: false, seriesArea: false };

function scaleLabelKey(index: number) {
    return `scale-${index}`;
}

/** Scale labels, placed last and dropped where they overlap a label or marker that outranks them. */
export function gaugeScaleLabelData<T>(selection: Selection<T, Text<T>>, enabled: boolean): GaugePointLabelDatum[] {
    const data: GaugePointLabelDatum[] = [];
    if (!enabled) return data;
    let index = 0;
    for (const { node } of selection) {
        const key = scaleLabelKey(index++);
        const box = node.getBBox();
        if (!box.isFinite()) continue;
        data.push({
            key,
            candidateIds: [0],
            point: { x: box.x + box.width / 2, y: box.y + box.height / 2, size: 0 },
            label: { text: node.text ?? '', width: box.width, height: box.height },
            anchor: undefined,
            placement: undefined,
            alwaysShow: false,
            collideWith: SCALE_LABEL_COLLIDE_WITH,
            obstacle: false,
            yields: true,
            positionedCandidates: [
                { box, region: box, flushToRegion: false, size: { width: box.width, height: box.height } },
            ],
        });
    }
    return data;
}

export function hideDroppedScaleLabels<T>(selection: Selection<T, Text<T>>, placements: GaugeLabelPlacements) {
    let index = 0;
    for (const { node } of selection) {
        if (!placements.has(scaleLabelKey(index++))) {
            node.visible = false;
        }
    }
}

export interface GaugeTargetLabelOptions {
    enabled: boolean;
    fontSize: number;
    fontFamily: string;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    lineHeight: number | undefined;
    maxWidth: number | undefined;
    maxHeight: number | undefined;
    wrapping: TextWrap | undefined;
    truncate: boolean | undefined;
    minimumFontSize: number | undefined;
    collision: AgChartLabelCollisionOptions | undefined;
    box: TextBoxingProperties;
}

type OptionalTargetLabelKeys = Exclude<keyof GaugeTargetLabelOptions, 'enabled' | 'fontSize' | 'fontFamily' | 'box'>;

export function pickGaugeTargetLabelOptions(
    label: Omit<GaugeTargetLabelOptions, OptionalTargetLabelKeys | 'box'> &
        Partial<Pick<GaugeTargetLabelOptions, OptionalTargetLabelKeys>> &
        TextBoxingProperties,
    targetLabel: TextBoxingProperties | undefined
): GaugeTargetLabelOptions {
    return {
        box: targetLabelBox(label, targetLabel),
        enabled: label.enabled,
        fontSize: label.fontSize,
        fontFamily: label.fontFamily,
        fontStyle: label.fontStyle,
        fontWeight: label.fontWeight,
        lineHeight: label.lineHeight,
        maxWidth: label.maxWidth,
        maxHeight: label.maxHeight,
        wrapping: label.wrapping,
        truncate: label.truncate,
        minimumFontSize: label.minimumFontSize,
        collision: label.collision,
    };
}

/** Setting any `border` option on a target's own label enables its border, as the theme does for other labels. */
function targetLabelBox(label: TextBoxingProperties, targetLabel: TextBoxingProperties | undefined) {
    const border = targetLabel?.border;
    if (border == null || border.enabled != null) return label;
    return { ...label, border: { ...label.border, enabled: true } };
}

/** A target label fitted to its options; `text` is undefined when the label is not drawn. */
export interface GaugeTargetLabelLayout {
    text: NormalisedTextOrSegments | undefined;
    fontSize: number;
    fontFamily: string;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    lineHeight: number | undefined;
    collision: AgChartLabelCollisionOptions | undefined;
    box: TextBoxingProperties;
    boxExtent: Required<PaddingOptions>;
}

export interface GaugeTargetDatumLabel extends GaugeTargetLabelLayout {
    offsetX: number;
    offsetY: number;
    fill: string | undefined;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

const unboundedFitting = () => ({ width: Infinity, height: Infinity, meta: null });

export function layoutGaugeTargetLabel(
    text: string | undefined,
    label: GaugeTargetLabelOptions
): GaugeTargetLabelLayout {
    const { fontSize, fontFamily, fontStyle, fontWeight, lineHeight, collision, maxWidth, maxHeight, box } = label;
    const boxExtent = expandLabelBoxExtent(box);
    const layout = {
        text: undefined,
        fontSize,
        fontFamily,
        fontStyle,
        fontWeight,
        lineHeight,
        collision,
        box,
        boxExtent,
    };
    if (!label.enabled || text == null) return layout;
    if (maxWidth == null && maxHeight == null) return { ...layout, text };

    const props = { ...label, wrapping: label.wrapping ?? 'on-space', truncate: label.truncate ?? true };
    const fitted = formatSingleLabel(text, props, { padding: 0 }, unboundedFitting)?.[0];
    if (fitted == null) return layout;
    return {
        ...layout,
        text: fitted.text,
        fontSize: fitted.fontSize,
        lineHeight: lineHeightAtSize(label, fitted.fontSize),
    };
}

export function gaugeTargetLabelDatum(
    key: string,
    label: GaugeTargetDatumLabel,
    x: number,
    y: number,
    seriesArea: BoxBounds
): GaugePointLabelDatum | undefined {
    const { text, textAlign, textBaseline, boxExtent } = label;
    if (text == null) return;
    const anchor = boxedTargetLabelAnchor(label, x, y);
    const textBox = Text.measureBBox(text, anchor.x, anchor.y, { font: label, textAlign, textBaseline });
    const box = growBox(textBox, boxExtent);
    return gaugeLabelDatum(key, text, [{ id: 0, box }], label.collision, true, seriesArea, key);
}

/** Text anchor that keeps the label's box edge, rather than its text, at the target label's offset. */
function boxedTargetLabelAnchor(label: GaugeTargetDatumLabel, x: number, y: number) {
    const offset = boxedTextOffset(label.boxExtent, label.textAlign, label.textBaseline);
    return { x: x + label.offsetX + offset.x, y: y + label.offsetY + offset.y };
}

/** Shift from a box's anchor to its text's anchor, for a box aligned the same way as its text. */
export function boxedTextOffset(
    extent: Required<PaddingOptions>,
    textAlign: CanvasTextAlign,
    textBaseline: CanvasTextBaseline
) {
    let x = (extent.left - extent.right) / 2;
    if (textAlign === 'left') {
        x = extent.left;
    } else if (textAlign === 'right') {
        x = -extent.right;
    }
    let y = (extent.top - extent.bottom) / 2;
    if (textBaseline === 'top') {
        y = extent.top;
    } else if (textBaseline === 'bottom') {
        y = -extent.bottom;
    }
    return { x, y };
}

export function growBox(box: BoxBounds, extent: Required<PaddingOptions>): BoxBounds {
    return {
        x: box.x - extent.left,
        y: box.y - extent.top,
        width: box.width + extent.left + extent.right,
        height: box.height + extent.top + extent.bottom,
    };
}

export function updateGaugeTargetLabelNode(
    node: Text,
    label: GaugeTargetDatumLabel,
    x: number,
    y: number,
    placed: boolean
) {
    const { text } = label;
    node.visible = text != null && placed;
    if (text == null) {
        return;
    }

    const anchor = boxedTargetLabelAnchor(label, x, y);
    node.x = anchor.x;
    node.y = anchor.y;
    node.text = text;
    node.setBoxing(label.box);
    node.fill = label.fill;
    node.fontStyle = label.fontStyle;
    node.fontWeight = label.fontWeight;
    node.fontSize = label.fontSize;
    node.fontFamily = label.fontFamily;
    node.lineHeight = label.lineHeight;
    node.textAlign = label.textAlign;
    node.textBaseline = label.textBaseline;
}
