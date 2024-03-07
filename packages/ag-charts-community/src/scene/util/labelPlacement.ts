import type { Point, SizedPoint } from '../point';

export type LabelPlacement = 'top' | 'bottom' | 'left' | 'right';

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
    readonly placement: LabelPlacement;
}

export interface PlacedLabel<PLD = PointLabelDatum> extends MeasuredLabel, Readonly<Point> {
    readonly index: number;
    readonly datum: PLD;
}

interface Bounds extends Readonly<Point> {
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
    if (c.size === 0) return false;

    let cx = c.x;
    let cy = c.y;

    if (unitCenter != null) {
        cx -= (unitCenter.x - 0.5) * c.size;
        cy -= (unitCenter.y - 0.5) * c.size;
    }

    // Find closest horizontal and vertical edges.
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
    // Find distance to closest edges.
    const dx = cx - edgeX;
    const dy = cy - edgeY;
    const d = Math.sqrt(dx * dx + dy * dy);
    return d <= c.size * 0.5;
}

function rectRectOverlap(r1: Bounds, x2: number, y2: number, w2: number, h2: number): boolean {
    const xOverlap = r1.x + r1.width > x2 && r1.x < x2 + w2;
    const yOverlap = r1.y + r1.height > y2 && r1.y < y2 + h2;
    return xOverlap && yOverlap;
}

function rectContainsRect(r1: Bounds, r2x: number, r2y: number, r2w: number, r2h: number) {
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
};

/**
 * @param data Points and labels for one or more series. The order of series determines label placement precedence.
 * @param bounds Bounds to fit the labels into. If a label can't be fully contained, it doesn't fit.
 * @returns Placed labels for the given series (in the given order).
 */
export function placeLabels(
    data: readonly (readonly PointLabelDatum[])[],
    bounds?: Bounds,
    padding = 5
): PlacedLabel[][] {
    const result: PlacedLabel[][] = [];

    data = data.map((d) => d.slice().sort((a, b) => b.point.size - a.point.size));
    for (let j = 0; j < data.length; j++) {
        const labels: PlacedLabel[] = (result[j] = []);
        const datum = data[j];
        if (!(datum?.length && datum[0].label)) {
            continue;
        }
        for (let i = 0, ln = datum.length; i < ln; i++) {
            const d = datum[i];
            const { point, label, marker } = d;
            const { text, width, height } = label;
            const r = point.size * 0.5;
            const placement = labelPlacements[d.placement];
            const dx = r > 0 ? (width * 0.5 + r + padding) * placement.x : 0;
            const dy = r > 0 ? (height * 0.5 + r + padding) * placement.y : 0;
            const x = point.x - width * 0.5 + dx - ((marker?.center.x ?? 0.5) - 0.5) * point.size;
            const y = point.y - height * 0.5 + dy - ((marker?.center.y ?? 0.5) - 0.5) * point.size;

            const withinBounds = !bounds || rectContainsRect(bounds, x, y, width, height);
            if (!withinBounds) {
                continue;
            }

            const overlapPoints = data.some((dataDatums) =>
                dataDatums.some((dataDatum) =>
                    circleRectOverlap(dataDatum.point, dataDatum.marker?.center, x, y, width, height)
                )
            );
            if (overlapPoints) {
                continue;
            }

            const overlapLabels = result.some((l2) => l2.some((l3) => rectRectOverlap(l3, x, y, width, height)));
            if (overlapLabels) {
                continue;
            }

            labels.push({
                index: i,
                text,
                x,
                y,
                width,
                height,
                datum: d,
            });
        }
    }

    return result;
}

export function axisLabelsOverlap(data: readonly PlacedLabelDatum[], padding?: number): boolean {
    const result: PlacedLabel<PlacedLabelDatum>[] = [];

    for (let i = 0; i < data.length; i++) {
        const datum = data[i];
        const {
            point: { x, y },
            label: { text },
        } = datum;
        let {
            label: { width, height },
        } = datum;

        width += padding ?? 0;
        height += padding ?? 0;

        const overlapLabels = result.some((l) => {
            return rectRectOverlap(l, x, y, width, height);
        });

        if (overlapLabels) {
            return true;
        }

        result.push({
            index: i,
            text,
            x,
            y,
            width,
            height,
            datum,
        });
    }

    return false;
}
