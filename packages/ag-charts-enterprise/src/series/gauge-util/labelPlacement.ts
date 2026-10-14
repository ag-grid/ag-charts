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
    resolveCollideWith,
} from 'ag-charts-core';
import type { AgChartLabelCollisionOptions, FontStyle, FontWeight, TextWrap } from 'ag-charts-types';

import { formatSingleLabel } from '../util/labelFormatter';

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
    seriesArea: BoxBounds
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

export function gaugeLabelObstacles<T>(selection: Selection<T, Node<T>>): LabelObstacle[] {
    const obstacles: LabelObstacle[] = [];
    for (const { node } of selection) {
        if (!node.visible) continue;
        const box = node.getBBox();
        if (box.isFinite()) {
            obstacles.push({ kind: 'rect', box, category: 'label' });
        }
    }
    return obstacles;
}

export interface GaugeTargetLabelOptions {
    enabled: boolean;
    fontSize: number;
    fontFamily: string;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    maxWidth: number | undefined;
    maxHeight: number | undefined;
    wrapping: TextWrap | undefined;
    truncate: boolean | undefined;
    minimumFontSize: number | undefined;
    collision: AgChartLabelCollisionOptions | undefined;
}

type OptionalTargetLabelKeys = Exclude<keyof GaugeTargetLabelOptions, 'enabled' | 'fontSize' | 'fontFamily'>;

export function pickGaugeTargetLabelOptions(
    label: Omit<GaugeTargetLabelOptions, OptionalTargetLabelKeys> &
        Partial<Pick<GaugeTargetLabelOptions, OptionalTargetLabelKeys>>
): GaugeTargetLabelOptions {
    return {
        enabled: label.enabled,
        fontSize: label.fontSize,
        fontFamily: label.fontFamily,
        fontStyle: label.fontStyle,
        fontWeight: label.fontWeight,
        maxWidth: label.maxWidth,
        maxHeight: label.maxHeight,
        wrapping: label.wrapping,
        truncate: label.truncate,
        minimumFontSize: label.minimumFontSize,
        collision: label.collision,
    };
}

/** A target label fitted to its options; `text` is undefined when the label is not drawn. */
export interface GaugeTargetLabelLayout {
    text: NormalisedTextOrSegments | undefined;
    fontSize: number;
    fontFamily: string;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    collision: AgChartLabelCollisionOptions | undefined;
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
    const { fontSize, fontFamily, fontStyle, fontWeight, collision, maxWidth, maxHeight } = label;
    const layout = { text: undefined, fontSize, fontFamily, fontStyle, fontWeight, collision };
    if (!label.enabled || text == null) return layout;
    if (maxWidth == null && maxHeight == null) return { ...layout, text };

    const props = { ...label, wrapping: label.wrapping ?? 'on-space', truncate: label.truncate ?? true };
    const fitted = formatSingleLabel(text, props, { padding: 0 }, unboundedFitting)?.[0];
    return fitted == null ? layout : { ...layout, text: fitted.text, fontSize: fitted.fontSize };
}

export function gaugeTargetLabelDatum(
    key: string,
    label: GaugeTargetDatumLabel,
    x: number,
    y: number,
    seriesArea: BoxBounds
): GaugePointLabelDatum | undefined {
    const { text, textAlign, textBaseline } = label;
    if (text == null) return;
    const box = Text.measureBBox(text, x + label.offsetX, y + label.offsetY, { font: label, textAlign, textBaseline });
    return gaugeLabelDatum(key, text, [{ id: 0, box }], label.collision, true, seriesArea);
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

    node.x = x + label.offsetX;
    node.y = y + label.offsetY;
    node.text = text;
    node.fill = label.fill;
    node.fontStyle = label.fontStyle;
    node.fontWeight = label.fontWeight;
    node.fontSize = label.fontSize;
    node.fontFamily = label.fontFamily;
    node.textAlign = label.textAlign;
    node.textBaseline = label.textBaseline;
}
