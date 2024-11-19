import type { Point, SizedPoint } from '../point';

export type LabelPlacement =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

export interface MeasuredLabel {
    readonly text: string;
    readonly width: number;
    readonly height: number;
}

export interface PlacedLabelDatum {
    readonly point: Point;
    readonly label: MeasuredLabel;
}

export interface PointLabelDatum {
    readonly point: Readonly<SizedPoint>;
    readonly label: MeasuredLabel;
    readonly marker: { center: Point } | undefined;
    readonly placement: LabelPlacement | undefined;
}

export interface PlacedLabel<PLD = PointLabelDatum> extends MeasuredLabel, Readonly<Point> {
    readonly index: number;
    readonly datum: PLD;
}

export interface LabelBounds extends Readonly<Point> {
    readonly width: number;
    readonly height: number;
}

function circleRectOverlap(
    c: SizedPoint,
    unitCenter: Point | undefined,
    x: number,
    y: number,
    w: number,
    h: number
): boolean {
    if (c.size === 0) {
        return false;
    }

    let cx = c.x;
    let cy = c.y;

    if (unitCenter != null) {
        cx -= (unitCenter.x - 0.5) * c.size;
        cy -= (unitCenter.y - 0.5) * c.size;
    }

    // Find the closest horizontal and vertical edges.
    let edgeX = cx;
    if (cx < x) {
        edgeX = x;
    } else if (cx > x + w) {
        edgeX = x + w;
    }
    let edgeY = cy;
    if (cy < y) {
        edgeY = y;
    } else if (cy > y + h) {
        edgeY = y + h;
    }
    // Find distance to the closest edges.
    const dx = cx - edgeX;
    const dy = cy - edgeY;
    const d = Math.sqrt(dx * dx + dy * dy);
    return d <= c.size * 0.5;
}

function rectRectOverlap(r1: LabelBounds, x2: number, y2: number, w2: number, h2: number): boolean {
    const xOverlap = r1.x + r1.width > x2 && r1.x < x2 + w2;
    const yOverlap = r1.y + r1.height > y2 && r1.y < y2 + h2;
    return xOverlap && yOverlap;
}

function rectContainsRect(r1: LabelBounds, r2x: number, r2y: number, r2w: number, r2h: number) {
    return r2x + r2w < r1.x + r1.width && r2x > r1.x && r2y > r1.y && r2y + r2h < r1.y + r1.height;
}

export function isPointLabelDatum(x: any): x is PointLabelDatum {
    return x != null && typeof x.point === 'object' && typeof x.label === 'object';
}

const labelPlacements: Record<LabelPlacement, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    'top-left': { x: -1, y: -1 },
    'top-right': { x: 1, y: -1 },
    'bottom-left': { x: -1, y: 1 },
    'bottom-right': { x: 1, y: 1 },
};

/**
 * @param data Points and labels for one or more series. The order of series determines label placement precedence.
 * @param bounds Bounds to fit the labels into. If a label can't be fully contained, it doesn't fit.
 * @param padding
 * @returns Placed labels for all series.
 */
export function placeLabels(data: Map<string, PointLabelDatum[]>, bounds?: LabelBounds, padding = 5) {
    const result: Map<string, PlacedLabel[]> = new Map();
    const previousResults: PlacedLabel[] = [];

    const sortedDataClone = new Map(
        [...data.entries()].map(([k, d]) => [k, d.toSorted((a, b) => b.point.size - a.point.size)])
    );
    const dataValues = [...sortedDataClone.values()].flat();
    for (const [seriesId, datums] of sortedDataClone.entries()) {
        const labels: PlacedLabel[] = [];
        if (!datums[0]?.label) continue;
        for (let index = 0, ln = datums.length; index < ln; index++) {
            const d = datums[index];
            const { point, label, marker } = d;
            const { text, width, height } = label;
            const r = point.size * 0.5;
            let dx = 0;
            let dy = 0;
            if (r > 0 && d.placement != null) {
                const placement = labelPlacements[d.placement];
                dx = (width * 0.5 + r + padding) * placement.x;
                dy = (height * 0.5 + r + padding) * placement.y;
            }
            const x = point.x - width * 0.5 + dx - ((marker?.center.x ?? 0.5) - 0.5) * point.size;
            const y = point.y - height * 0.5 + dy - ((marker?.center.y ?? 0.5) - 0.5) * point.size;

            const withinBounds = !bounds || rectContainsRect(bounds, x, y, width, height);
            if (!withinBounds) continue;

            const overlapPoints = dataValues.some((dataDatum) =>
                circleRectOverlap(dataDatum.point, dataDatum.marker?.center, x, y, width, height)
            );
            if (overlapPoints) continue;

            const overlapLabels = previousResults.some((pr) => rectRectOverlap(pr, x, y, width, height));
            if (overlapLabels) continue;

            const resultDatum = { index, text, x, y, width, height, datum: d };
            labels.push(resultDatum);
            previousResults.push(resultDatum);
        }

        result.set(seriesId, labels);
    }

    return result;
}

export function axisLabelsOverlap(data: readonly PlacedLabelDatum[], padding: number = 0): boolean {
    const result: PlacedLabel<PlacedLabelDatum>[] = [];

    for (let index = 0; index < data.length; index++) {
        const datum = data[index];
        const {
            point: { x, y },
            label: { text },
        } = datum;
        let { width, height } = datum.label;

        width += padding;
        height += padding;

        if (result.some((l) => rectRectOverlap(l, x, y, width, height))) {
            return true;
        }

        result.push({ index, text, x, y, width, height, datum });
    }

    return false;
}
