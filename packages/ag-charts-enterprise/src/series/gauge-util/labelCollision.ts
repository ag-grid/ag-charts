import type { BBox, Node, NormalisedTextOrSegments, Selection } from 'ag-charts-core';
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
    const probe = threshold >= 0 ? box.clone().grow(threshold) : box.clone().shrink(-threshold);
    return obstacles.some((obstacle) => probe.collidesBBox(obstacle));
}

export interface GaugeTargetLabelFit {
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

const unboundedFitting = () => ({ width: Infinity, height: Infinity, meta: null });

/** Fits a target label to its `maxWidth`/`maxHeight`; without either the text is drawn as written. */
export function fitGaugeTargetLabelText(
    text: string,
    fit: GaugeTargetLabelFit
): { text: NormalisedTextOrSegments; fontSize: number } | undefined {
    if (fit.maxWidth == null && fit.maxHeight == null) return { text, fontSize: fit.fontSize };

    const props = { ...fit, wrapping: fit.wrapping ?? 'on-space', truncate: fit.truncate ?? true };
    const layout = formatSingleLabel(text, props, { padding: 0 }, unboundedFitting)?.[0];
    return layout == null ? undefined : { text: layout.text, fontSize: layout.fontSize };
}

export function hasTargetLabelCollision<T extends { label: { collision: AgChartLabelCollisionOptions | undefined } }>(
    selection: Selection<T, Node<T>>
): boolean {
    for (const { datum } of selection) {
        if (datum.label.collision != null) return true;
    }
    return false;
}

/**
 * Hides target labels with a `collision` option that overlap a scale label, a gauge label or an earlier
 * target label, unless `collision.alwaysShow` keeps them.
 */
export function avoidTargetLabelCollisions<
    T extends { label: { collision: AgChartLabelCollisionOptions | undefined } },
>(selection: Selection<T, Node<T>>, getObstacles: () => BBox[]) {
    if (!hasTargetLabelCollision(selection)) return;

    const obstacles = getObstacles();
    for (const { node, datum } of selection) {
        if (!node.visible) continue;
        const box = node.getBBox();
        const { collision } = datum.label;
        if (collision != null && !collision.alwaysShow && collidesWithAny(box, obstacles, collision.threshold)) {
            node.visible = false;
            continue;
        }
        obstacles.push(box);
    }
}
