import type { BBox, Node, NormalisedTextOrSegments, Selection, Text } from 'ag-charts-core';
import type { AgChartLabelCollisionOptions, FontStyle, FontWeight, TextWrap } from 'ag-charts-types';

import { formatSingleLabel } from '../util/labelFormatter';

export function visibleLabelBoxes<T>(selection: Selection<T, Node<T>>, boxes: BBox[] = []): BBox[] {
    for (const { node } of selection) {
        if (!node.visible) continue;
        const box = node.getBBox();
        if (box.isFinite()) boxes.push(box);
    }
    return boxes;
}

export function collidesWithAny(box: BBox, obstacles: readonly BBox[], threshold = 0): boolean {
    const probe = box.clone().grow(threshold);
    return obstacles.some((obstacle) => probe.collidesBBox(obstacle));
}

export function hiddenByCollision(
    box: BBox,
    collision: AgChartLabelCollisionOptions | undefined,
    obstacles: readonly BBox[]
): boolean {
    return collision != null && !collision.alwaysShow && collidesWithAny(box, obstacles, collision.threshold);
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

export function updateGaugeTargetLabelNode(node: Text, label: GaugeTargetDatumLabel, x: number, y: number) {
    const { text } = label;
    node.visible = text != null;
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

export function hasTargetLabelCollision<T extends { label: { collision: AgChartLabelCollisionOptions | undefined } }>(
    selection: Selection<T, Node<T>>
): boolean {
    for (const { datum } of selection) {
        if (datum.label.collision != null) return true;
    }
    return false;
}

/** Hides target labels with a `collision` option that overlap a scale, gauge or earlier target label. */
export function avoidTargetLabelCollisions<
    T extends { label: { collision: AgChartLabelCollisionOptions | undefined } },
>(selection: Selection<T, Node<T>>, getObstacles: () => BBox[]) {
    if (!hasTargetLabelCollision(selection)) return;

    const obstacles = getObstacles();
    for (const { node, datum } of selection) {
        if (!node.visible) continue;
        const box = node.getBBox();
        if (hiddenByCollision(box, datum.label.collision, obstacles)) {
            node.visible = false;
            continue;
        }
        obstacles.push(box);
    }
}
