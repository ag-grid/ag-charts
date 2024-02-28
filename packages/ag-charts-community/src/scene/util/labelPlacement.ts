import type { Point, SizedPoint } from '../point';

export interface MeasuredLabel {
    readonly text: string;
    readonly width: number;
    readonly height: number;
}

export interface PlacedLabel<PLD = PointLabelDatum> extends MeasuredLabel, Readonly<Point> {
    readonly index: number;
    readonly datum: PLD;
}

export interface PointLabelDatum {
    readonly point: Readonly<SizedPoint>;
    readonly label: MeasuredLabel;
}

interface Bounds extends Readonly<Point> {
    readonly width: number;
    readonly height: number;
}

function circleRectOverlap(c: SizedPoint, x: number, y: number, w: number, h: number): boolean {
    // Find closest horizontal and vertical edges.
    let edgeX = c.x;
    if (c.x < x) {
        edgeX = x;
    } else if (c.x > x + w) {
        edgeX = x + w;
    }
    let edgeY = c.y;
    if (c.y < y) {
        edgeY = y;
    } else if (c.y > y + h) {
        edgeY = y + h;
    }
    // Find distance to closest edges.
    const dx = c.x - edgeX;
    const dy = c.y - edgeY;
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
            const l = d.label;
            const r = d.point.size * 0.5;
            const x = d.point.x - l.width * 0.5;
            const y = d.point.y - r - l.height - padding;
            const { width, height } = l;

            const withinBounds = !bounds || rectContainsRect(bounds, x, y, width, height);
            if (!withinBounds) {
                continue;
            }

            const overlapPoints = data.some((dataDatums) =>
                dataDatums.some((dataDatum) => circleRectOverlap(dataDatum.point, x, y, width, height))
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
                text: l.text,
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

export function axisLabelsOverlap(data: readonly PointLabelDatum[], padding?: number): boolean {
    const result: PlacedLabel[] = [];

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

        const overlapLabels = result.some((l: PlacedLabel) => {
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
