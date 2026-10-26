import {
    BBox,
    type CollideWith,
    type FontOptions,
    type LabelFitDescriptor,
    type LabelObstacle,
    type NormalisedTextOrSegments,
    type PlacedLabel,
    type PointLabelDatum,
    type SectorBoundaries,
    type SizedPoint,
    Text,
    boxOverlapsSector,
    isPointLabelDatum,
    sectorBox,
} from 'ag-charts-core';
import type { PaddingOptions } from 'ag-charts-types';

/** A polar series label, anchored relative to the series centre. The label solve writes back what it drew. */
export interface PolarLabelDatum {
    readonly x: number;
    readonly y: number;
    readonly text: NormalisedTextOrSegments;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    fittedText?: NormalisedTextOrSegments;
    fittedFontSize?: number;
    placed?: boolean;
}

export interface PolarLabelStyle {
    readonly font: FontOptions;
    readonly boxPadding: Required<PaddingOptions>;
    readonly fit?: (text: NormalisedTextOrSegments) => LabelFitDescriptor | undefined;
}

interface PolarPointLabelDatum extends PointLabelDatum {
    readonly target: PolarLabelDatum;
}

function isPolarPointLabelDatum(datum: unknown): datum is PolarPointLabelDatum {
    return isPointLabelDatum(datum) && 'target' in datum;
}

// Polar labels hold their position: they avoid nothing, yet every other label sees them.
const FIXED_LABEL_COLLISIONS: CollideWith = {
    marker: false,
    label: false,
    seriesItem: false,
    seriesArea: false,
    axisLabel: false,
};

/** Label solve input for labels drawn at `(centreX, centreY)` plus each label's own offset. */
export function polarLabelData(
    nodeData: Iterable<{ readonly label?: PolarLabelDatum; readonly point?: Readonly<SizedPoint> }>,
    style: PolarLabelStyle,
    centreX: number,
    centreY: number
): PointLabelDatum[] {
    const { font, boxPadding: padding, fit } = style;
    const data: PolarPointLabelDatum[] = [];
    for (const { label, point } of nodeData) {
        if (label == null) continue;
        const { text, textAlign, textBaseline } = label;
        const anchor = { x: centreX + label.x, y: centreY + label.y, textAlign, textBaseline };
        const glyph = Text.measureBBox(text, anchor.x, anchor.y, { font, textAlign, textBaseline });
        const box = {
            x: glyph.x - padding.left,
            y: glyph.y - padding.top,
            width: glyph.width + padding.left + padding.right,
            height: glyph.height + padding.top + padding.bottom,
        };
        const labelFit = fit?.(text);
        data.push({
            target: label,
            point: { x: centreX + (point?.x ?? label.x), y: centreY + (point?.y ?? label.y), size: point?.size ?? 0 },
            label: { text, width: box.width, height: box.height },
            fit: labelFit,
            anchor: undefined,
            placement: undefined,
            collideWith: FIXED_LABEL_COLLISIONS,
            neverDrop: true,
            positionedCandidates: [{ box, unbounded: true, fitTo: labelFit && { anchor, padding } }],
        });
    }
    return data;
}

/** Records on each label whether the solve kept it, and the text and size it was fitted at. */
export function writePlacedPolarLabels(
    nodeData: Iterable<{ readonly label?: PolarLabelDatum }>,
    placed: readonly PlacedLabel<unknown>[]
) {
    for (const { label } of nodeData) {
        if (label != null) label.placed = false;
    }
    for (const { datum, text, fontSize } of placed) {
        if (!isPolarPointLabelDatum(datum)) continue;
        const { target } = datum;
        target.placed = true;
        target.fittedText = datum.fit == null ? undefined : text;
        target.fittedFontSize = fontSize;
    }
}

/** The label to draw for a node, or `undefined` when the solve dropped it. */
export function placedPolarLabel(label: PolarLabelDatum | undefined): PolarLabelDatum | undefined {
    return label?.placed === true ? label : undefined;
}

/** Room the placed labels take, relative to the series centre. */
export function polarLabelsBBox(
    placed: readonly PlacedLabel<unknown>[],
    centreX: number,
    centreY: number
): BBox | null {
    if (placed.length === 0) return null;
    return BBox.merge(placed.map(({ x, y, width, height }) => new BBox(x - centreX, y - centreY, width, height)));
}

/** Centre-relative sectors as `seriesItem` obstacles in the label solve's space. */
export function polarSectorObstacles(
    sectors: Iterable<SectorBoundaries>,
    centreX: number,
    centreY: number
): LabelObstacle[] {
    const obstacles: LabelObstacle[] = [];
    for (const sector of sectors) {
        const box = sectorBox(sector).translate(centreX, centreY);
        obstacles.push({
            kind: 'custom',
            box,
            overlaps: ({ x, y, width, height }) =>
                boxOverlapsSector({ x: x - centreX, y: y - centreY, width, height }, sector),
            category: 'seriesItem',
        });
    }
    return obstacles;
}
