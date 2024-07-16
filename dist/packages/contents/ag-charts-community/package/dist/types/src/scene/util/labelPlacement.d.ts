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
    readonly marker: {
        center: Point;
    } | undefined;
    readonly placement: LabelPlacement | undefined;
}
export interface PlacedLabel<PLD = PointLabelDatum> extends MeasuredLabel, Readonly<Point> {
    readonly index: number;
    readonly datum: PLD;
}
interface Bounds extends Readonly<Point> {
    readonly width: number;
    readonly height: number;
}
export declare function isPointLabelDatum(x: any): x is PointLabelDatum;
/**
 * @param data Points and labels for one or more series. The order of series determines label placement precedence.
 * @param bounds Bounds to fit the labels into. If a label can't be fully contained, it doesn't fit.
 * @returns Placed labels for the given series (in the given order).
 */
export declare function placeLabels(data: readonly (readonly PointLabelDatum[])[], bounds?: Bounds, padding?: number): PlacedLabel[][];
export declare function axisLabelsOverlap(data: readonly PlacedLabelDatum[], padding?: number): boolean;
export {};
