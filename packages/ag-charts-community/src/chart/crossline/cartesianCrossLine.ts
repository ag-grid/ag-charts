import {
    type TextMeasurer,
    cachedTextMeasurer,
    clampArray,
    createId,
    findMinMax,
    fitLabelText,
    fitLabelTextAutoSize,
    fontWithSize,
    resolveCollideWith,
    resolveLabelFit,
    resolvePadding,
    toRadians,
} from 'ag-charts-core';
import type {
    BoxBounds,
    CanvasPoint,
    DynamicContext,
    NormalisedAxisCrossLineLabelOptions,
    NormalisedAxisCrossLineOptions,
    PointLabelDatum,
    PositionedLabelCandidate,
    Scale,
} from 'ag-charts-core';
import type { AgCartesianAxisPosition, AgCrossLineLabelPosition, AgCrossLineListeners } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import { Range } from '../../scene/shape/range';
import { TransformableText } from '../../scene/shape/text';
import { Transformable } from '../../scene/transformable';
import { rangeAlignment } from '../rangeAlignment';
import { bandRangeExpansion } from '../scaleValue';
import { type Anchor, type AnchorDirection, resolveCrossLinePlacements } from './cartesianCrossLinePlacement';
import { type CrossLine, type CrossLineType, validateCrossLineValue } from './crossLine';

type PaddingSide = 'left' | 'right' | 'top' | 'bottom';

/** Mirrors an anchor across the cross line. Guards match `labelPaddingSide`, so the result cannot pad. */
function realignAnchor(anchor: Anchor, horizontal: boolean): Anchor {
    if (horizontal) {
        if (anchor.rangeH === -1 && anchor.labelH === 1) return { ...anchor, labelH: -1 };
        if (anchor.rangeH === 1 && anchor.labelH === -1) return { ...anchor, labelH: 1 };
    } else {
        if (anchor.rangeV === -1 && anchor.labelV === 1) return { ...anchor, labelV: -1 };
        if (anchor.rangeV === 1 && anchor.labelV === -1) return { ...anchor, labelV: 1 };
    }
    return anchor;
}

/** A rotation component below this is a rounding artefact, not a real one, and must not divide a bound. */
const ROTATION_EPSILON = 1e-6;

/**
 * Room along one axis from the point the anchor pins. `labelDir` is `labelH`/`labelV`: the label grows away
 * from `anchorAt` when that is `1` or `-1`, symmetrically about it when `0`.
 */
function availableExtent(anchorAt: number, labelDir: AnchorDirection, pad: number, low: number, high: number) {
    if (labelDir === 1) return anchorAt - pad - low;
    if (labelDir === -1) return high - (anchorAt + pad);
    return 2 * Math.min(anchorAt - low, high - anchorAt);
}

export type CartesianCrossLineLabelOptions = NormalisedAxisCrossLineLabelOptions & {
    reserveSpace: boolean;
};

type NodeData = [number, number];
type FittedLabel = { text: string; fontSize: number };

const CROSS_LINE_MIN_HIT_TOLERANCE = 5;

/** Pointer hit tolerance in pixels: half the stroke, floored so thin `line` cross lines remain targetable. */
export function crossLineHitTolerance(strokeWidth: number | undefined): number {
    return Math.max(CROSS_LINE_MIN_HIT_TOLERANCE, (strokeWidth ?? 1) / 2);
}

const DEFAULT_RANGE_FILL = '#c16068';

export class CartesianCrossLine implements CrossLine<CartesianCrossLineLabelOptions> {
    static readonly className = 'CrossLine';
    readonly internalId = createId(this);

    id?: string;
    enabled?: boolean;
    type!: CrossLineType;
    range?: [unknown, unknown];
    value?: unknown;
    fill: string = DEFAULT_RANGE_FILL;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    label!: CartesianCrossLineLabelOptions;
    listeners?: AgCrossLineListeners<unknown>;

    scale?: Scale<any, number> = undefined; // TODO: this type does not match the interface
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    gridPadding: number = 0;
    containerBox?: BoxBounds = undefined;
    position: AgCartesianAxisPosition = 'top';

    readonly rangeGroup = new Group({ name: this.internalId });
    readonly lineGroup = new Group({ name: this.internalId });
    readonly labelGroup = new Group({ name: this.internalId });
    private readonly crossLineRange = this.lineGroup.appendChild(new Range());
    private readonly crossLineLabel = this.labelGroup.appendChild(new TransformableText());

    private data: NodeData | undefined = undefined;
    private startLine: boolean = false;
    private endLine: boolean = false;
    /** The last solve's verdict, which the next layout pads for. */
    private labelHidden = false;
    private paddedSide: PaddingSide | undefined = undefined;
    /** Hidden by a re-layout that padded for it, so later layouts keep that padding rather than flip again. */
    private labelPadsHidden = false;
    private relayingOut = false;
    private labelHeld = false;
    private anchors: Anchor[] | undefined = undefined;
    private anchorsResolvedFor = '';
    /** Index into {@link anchors} of the placement the label is drawn at. */
    private chosen = 0;
    private readonly candidateIndices = new Map<PositionedLabelCandidate, number>();
    private labelBounds: BBox | undefined = undefined;
    private fitted: (FittedLabel & { measurer: TextMeasurer }) | undefined = undefined;

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {
        this.crossLineRange.pointerEvents = PointerEvents.None;
    }

    applyOptions(options: NormalisedAxisCrossLineOptions) {
        const { id, enabled, type, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, listeners } =
            options;
        this.id = id;
        this.enabled = enabled;
        this.type = type;
        this.range = options.type === 'range' ? options.range : undefined;
        this.value = options.type === 'line' ? options.value : undefined;
        this.fill = fill ?? DEFAULT_RANGE_FILL;
        this.fillOpacity = fillOpacity;
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
        this.strokeOpacity = strokeOpacity;
        this.lineDash = lineDash;
        this.listeners = listeners;
        this.label = { reserveSpace: false, ...options.label };
        this.fitted = undefined;
        this.anchors = undefined;
        this.chosen = 0;
    }

    /**
     * Hit-tests a canvas-space point against this cross line's rendered line/fill and its label, widened
     * by {@link crossLineHitTolerance}. The `crossLineRange` node holds the geometry for both the `line`
     * (stroke) and `range` (fill) variants; its bbox is transformed into canvas space to match the
     * pointer coordinates carried by pointer events.
     */
    containsPoint(point: CanvasPoint): boolean {
        const group = this.type === 'range' ? this.rangeGroup : this.lineGroup;
        if (!this.enabled || this.data == null || !group.visible) {
            return false;
        }

        const tolerance = crossLineHitTolerance(this.strokeWidth);
        const bbox = Transformable.toCanvas(this.crossLineRange).clone().grow(tolerance);
        if (bbox.containsPoint(point.canvasX, point.canvasY)) {
            return true;
        }

        // The label is only rendered under the same conditions `updateNodes` applies, so an
        // unlabelled cross line must not report a hit on its zero-sized label node.
        return this.getLabelBox()?.containsPoint(point.canvasX, point.canvasY) ?? false;
    }

    private _isRange: boolean | undefined = undefined;
    update(visible: boolean) {
        const { enabled, type, data, scale } = this;
        if (!scale || !enabled || !visible || !validateCrossLineValue(this, scale) || data == null) {
            this.rangeGroup.visible = false;
            this.lineGroup.visible = false;
            this.labelGroup.visible = false;
            return;
        }

        this.rangeGroup.visible = visible;
        this.lineGroup.visible = visible;
        this.labelGroup.visible = visible;
        this.updateNodes();

        const isRange = type === 'range';
        if (isRange !== this._isRange) {
            if (isRange) {
                this.rangeGroup.appendChild(this.crossLineRange);
            } else {
                this.lineGroup.appendChild(this.crossLineRange);
            }
        }
        this._isRange = isRange;
    }

    calculateLayout(visible: boolean) {
        this.data = undefined;

        if (!visible) return;

        const { type, range, value, scale, clippedRange, strokeWidth = 0 } = this;
        if (!scale) return;

        const { bandwidth, rangePadding } = bandRangeExpansion(scale);

        const [clipMin, clipMax] = findMinMax(clippedRange);

        let yStart: number;
        let yEnd: number;
        let clampedYStart: number;
        let clampedYEnd: number;
        if (type === 'line') {
            const offset = bandwidth / 2;
            yStart = scale.convert(value as any) + offset;
            yEnd = Number.NaN;
            clampedYStart = scale.convert(value as any, { clamp: true }) + offset;
            clampedYEnd = Number.NaN;

            if (yStart > clipMax + bandwidth || yStart < clipMin - bandwidth) {
                return;
            }
        } else if (range) {
            const [r0, r1] = range;
            const [startAlignment, endAlignment] = rangeAlignment(r0, r1);

            yStart = scale.convert(r0 as any, { alignment: startAlignment });
            yEnd = scale.convert(r1 as any, { alignment: endAlignment });
            clampedYStart = scale.convert(r0 as any, { clamp: true, alignment: startAlignment });
            clampedYEnd = scale.convert(r1 as any, { clamp: true, alignment: endAlignment });

            if (clampedYStart > clampedYEnd) {
                [clampedYStart, clampedYEnd] = [clampedYEnd, clampedYStart];
                [yStart, yEnd] = [yEnd, yStart];
            }

            // Both ends clamped onto the same scale bound means the range lies wholly outside the domain.
            const clampedAway = clampedYStart === clampedYEnd && clampedYStart !== yStart && clampedYEnd !== yEnd;
            if (clampedAway) {
                return;
            }

            if (Number.isFinite(yStart)) {
                clampedYStart -= rangePadding;
            }

            if (Number.isFinite(yEnd)) {
                yEnd += bandwidth;
                clampedYEnd += bandwidth + rangePadding;
            }

            if (clampedYStart >= clipMax || clampedYEnd <= clipMin) {
                return;
            }
        } else {
            return;
        }

        clampedYStart = clampArray(clampedYStart, clippedRange);
        clampedYEnd = clampArray(clampedYEnd, clippedRange);

        if (yStart - rangePadding >= clampedYStart) yStart -= rangePadding;
        if (yEnd + rangePadding <= clampedYEnd) yEnd += rangePadding;

        this.startLine = strokeWidth > 0 && yStart >= clampedYStart && yStart <= clampedYStart + rangePadding;
        this.endLine = strokeWidth > 0 && yEnd >= clampedYEnd - bandwidth - rangePadding && yEnd <= clampedYEnd;

        this.data = [clampedYStart, clampedYEnd];

        if (this.label.enabled === false || this.label.text == null || this.label.text === '') return;
    }

    getLabelBox(): BBox | undefined {
        if (this.crossLineLabel.visible) return this.labelFootprint();
    }

    /** Taken from the drawn node, so whatever `positionLabel` and `clipLabelText` settled on is reserved. */
    private labelFootprint(): BBox | undefined {
        if (!this.hasFittedText || !this.labelGroup.visible) return;

        return Transformable.toCanvas(this.crossLineLabel);
    }

    get keepsLabel(): boolean {
        return this.label.collision?.alwaysShow ?? true;
    }

    getLabelDatum(seriesRect: BBox): PointLabelDatum | undefined {
        if (this.labelHeld) return;
        const box = this.labelFootprint();
        if (box == null) return;

        const { collision, reserveSpace } = this.label;
        const keep = this.keepsLabel;
        // Not themed, as the cross-line theme also reaches polar axes; outer labels sit outside the series area.
        const seriesArea = collision?.collideWith?.seriesArea ?? false;
        const collideWith = { ...resolveCollideWith(collision ?? { alwaysShow: true }), seriesArea };
        const { width, height } = box;

        // A re-layout settles the placement already chosen rather than choosing again.
        const indices = this.relayingOut ? [this.chosen] : Array.from(this.resolvedAnchors.keys());
        const sole = indices.length === 1;
        const positionedCandidates: PositionedLabelCandidate[] = [];
        this.candidateIndices.clear();
        for (const index of indices) {
            const anchor = this.anchorAt(index);
            const footprint = this.footprintAt(index, box);
            const candidateBox = {
                x: footprint.x - seriesRect.x,
                y: footprint.y - seriesRect.y,
                width: footprint.width,
                height: footprint.height,
            };
            // Already the rotated footprint, so it carries no rotation for the engine to inflate it by again.
            const candidate = {
                box: candidateBox,
                region: keep && sole ? undefined : this.labelRegion(seriesRect, seriesArea, candidateBox, anchor, sole),
                flushToRegion: false,
            };
            this.candidateIndices.set(candidate, index);
            positionedCandidates.push(candidate);
        }

        return {
            point: { x: 0, y: 0, size: 0 },
            label: { text: this.crossLineLabel.text ?? '', width, height },
            anchor: undefined,
            placement: undefined,
            alwaysShow: keep ? undefined : false,
            neverDrop: keep,
            obstacle: keep ? reserveSpace : true,
            collideWith,
            threshold: collision?.threshold,
            positionedCandidates,
        };
    }

    private labelRegion(
        seriesRect: BBox,
        seriesArea: boolean,
        box: BoxBounds,
        anchor: Anchor,
        sole: boolean
    ): BoxBounds | undefined {
        if (seriesArea) return { x: 0, y: 0, width: seriesRect.width, height: seriesRect.height };
        if (!sole && this.type === 'range' && anchor.labelH === anchor.rangeH && anchor.labelV === anchor.rangeV) {
            const band = Transformable.toCanvas(this.crossLineRange);
            return { x: band.x - seriesRect.x, y: band.y - seriesRect.y, width: band.width, height: band.height };
        }
        const { containerBox } = this;
        const side = this.paddingSideOf(anchor);
        const unpadded = side != null && side !== this.paddedSide;
        if (containerBox == null) return unpadded ? box : undefined;
        const { width, height } = containerBox;
        const region = { x: containerBox.x - seriesRect.x, y: containerBox.y - seriesRect.y, width, height };
        if (!unpadded) return region;

        // Laid out without padding for it, an outer label is tested against the room that padding would give it.
        const extent = this.paddingExtent(side) ?? 0;
        if (side === 'left' || side === 'right') region.width += extent;
        else region.height += extent;
        if (side === 'left') region.x -= extent;
        if (side === 'top') region.y -= extent;
        return region;
    }

    /** A `'clip-text'` label shortens to the room at its anchor, so another placement is laid out to measure it. */
    private footprintAt(index: number, box: BBox): BoxBounds {
        if (index === this.chosen) return box;
        if (this.label.overflow !== 'clip-text') {
            const offset = this.labelOffset(this.anchorAt(index));
            return { x: box.x + offset.x, y: box.y + offset.y, width: box.width, height: box.height };
        }

        const { chosen } = this;
        this.chosen = index;
        this.layoutLabel();
        const footprint = Transformable.toCanvas(this.crossLineLabel);
        this.chosen = chosen;
        this.layoutLabel();
        return footprint;
    }

    /** Canvas offset of the label drawn at `anchor` from where it is drawn now. */
    private labelOffset(anchor: Anchor): { x: number; y: number } {
        const { labelBounds, labelGroup } = this;
        const bbox = this.crossLineLabel.getBBox();
        if (labelBounds == null || bbox == null) return { x: 0, y: 0 };
        const from = this.labelPoint(labelBounds, this.anchor, bbox);
        const to = this.labelPoint(labelBounds, anchor, bbox);
        const start = Transformable.toCanvasPoint(labelGroup, from.x, from.y);
        const end = Transformable.toCanvasPoint(labelGroup, to.x, to.y);
        return { x: end.canvasX - start.canvasX, y: end.canvasY - start.canvasY };
    }

    /** Returns whether the last layout padded for a different verdict or placement, so the chart must lay out again. */
    applyLabelPlacement(hidden: boolean, candidate?: PositionedLabelCandidate): boolean {
        const index = candidate == null ? undefined : this.candidateIndices.get(candidate);
        if (index != null && index !== this.chosen) {
            this.chosen = index;
            this.layoutLabel();
        }
        this.labelHidden = hidden;
        this.crossLineLabel.visible = !hidden;
        if (!hidden) {
            this.labelPadsHidden = false;
        } else if (this.relayingOut && this.paddedSide != null) {
            this.labelPadsHidden = true;
        }
        return this.paddedSide !== (this.padsForLabel ? this.labelPaddingSide : undefined);
    }

    private get padsForLabel(): boolean {
        return !this.labelHidden || this.labelPadsHidden;
    }

    /** A held hidden label sits the re-layout out, as it was laid out unpadded. */
    holdLabelPlacement(hold: boolean) {
        this.relayingOut = hold;
        this.labelHeld = hold && this.labelHidden;
    }

    private updateNodes() {
        const { position, data: [r0, r1] = [0, 0], gridLength, gridPadding } = this;

        const dr = Number.isFinite(r1) ? r1 - r0 : 0;
        // Mirror the grid line padding pattern (see cartesianAxis.ts calculateTickLayout).
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;
        const crossStart = Math.min(direction * gridPadding, direction * (gridLength + gridPadding));

        let bounds: BBox;
        switch (position) {
            case 'top':
            case 'bottom':
                bounds = new BBox(r0, crossStart, dr, gridLength);
                break;
            case 'left':
            case 'right':
                bounds = new BBox(crossStart, r0, gridLength, dr);
        }

        this.updateRangeNode(bounds);

        this.labelBounds = bounds;
        this.crossLineLabel.visible = !this.labelHidden;
        this.layoutLabel();
    }

    private layoutLabel() {
        const { label, labelBounds } = this;
        if (labelBounds == null || label.enabled === false || label.text == null || label.text === '') return;
        this.updateLabel();
        if (label.overflow === 'clip-text') {
            this.clipLabelText(labelBounds);
        }
        this.positionLabel(labelBounds);
    }

    private updateRangeNode(bounds: BBox) {
        const {
            type,
            position,
            crossLineRange,
            startLine,
            endLine,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
        } = this;

        crossLineRange.x1 = bounds.x;
        crossLineRange.x2 = bounds.x + bounds.width;
        crossLineRange.y1 = bounds.y;
        crossLineRange.y2 = bounds.y + bounds.height;
        crossLineRange.horizontal = position === 'top' || position === 'bottom';

        crossLineRange.startLine = startLine;
        crossLineRange.endLine = endLine;

        crossLineRange.fill = type === 'range' ? fill : undefined;
        crossLineRange.fillOpacity = fillOpacity ?? 1;

        crossLineRange.stroke = stroke;
        crossLineRange.strokeWidth = strokeWidth ?? 1;
        crossLineRange.strokeOpacity = strokeOpacity ?? 1;
        crossLineRange.lineDash = lineDash;
    }

    private updateLabel() {
        const { crossLineLabel, label } = this;

        if (label.text == null || label.text === '') return;

        const { text, fontSize } = this.fittedLabel();
        crossLineLabel.fill = label.color;
        crossLineLabel.text = text;
        crossLineLabel.rotation = toRadians(label.rotation ?? 0);
        crossLineLabel.textAlign = 'center';
        crossLineLabel.textBaseline = 'middle';
        crossLineLabel.setFont(label);
        crossLineLabel.fontSize = fontSize;
        crossLineLabel.setBoxing(label);
    }

    /**
     * The label fitted to its own `maxWidth`/`maxHeight`, which do not depend on where it is placed. Keyed on
     * the measurer, which a web font load replaces.
     */
    private fittedLabel(): FittedLabel {
        const { label } = this;
        const measurer = cachedTextMeasurer(label);
        if (this.fitted?.measurer !== measurer) {
            const text = label.text ?? '';
            const fitted = fitLabelTextAutoSize(text, resolveLabelFit(label), label);
            this.fitted = {
                text: typeof fitted.text === 'string' ? fitted.text : text,
                fontSize: fitted.fontSize ?? label.fontSize,
                measurer,
            };
        }
        return this.fitted;
    }

    /** False once the fit has erased the text, as a `maxHeight` below one line does. */
    private get hasFittedText(): boolean {
        const { label } = this;
        if (label.enabled === false || label.text == null || label.text === '') return false;
        return this.fittedLabel().text !== '';
    }

    private get horizontal(): boolean {
        return this.position === 'left' || this.position === 'right';
    }

    /** The placements to try in order, resolved for the axis the cross line is on and the text direction. */
    private get resolvedAnchors(): Anchor[] {
        const { horizontal, type, label } = this;
        const { domManager, logger } = this.ctx;
        const rtl = domManager.isRtl;
        const key = `${horizontal}:${rtl}`;
        if (this.anchors == null || this.anchorsResolvedFor !== key) {
            this.anchors = resolveCrossLinePlacements(label.placement, label.position, {
                type,
                horizontal,
                rtl,
                warn: (message) => logger.warnOnce(message),
                deprecate: (message) => logger.deprecationOnce(message),
            });
            this.anchorsResolvedFor = key;
        }
        return this.anchors;
    }

    private anchorAt(index: number): Anchor {
        const anchors = this.resolvedAnchors;
        const anchor = anchors[index] ?? anchors[0];
        if (this.label.overflow !== 'realign-text') return anchor;
        return realignAnchor(anchor, this.horizontal);
    }

    private get anchor(): Anchor {
        return this.anchorAt(this.chosen);
    }

    /** Offsets `positionLabel` applies to the anchor point, shared so both agree on where the box sits. */
    private labelAnchorOffsets() {
        const {
            crossLineLabel,
            label: { padding },
        } = this;
        const numeric = typeof padding === 'number';
        return {
            pad: numeric && !crossLineLabel.hasBoxing() ? padding : 0,
            xPaddingDiff: numeric ? 0 : (padding.right ?? 0) - (padding.left ?? 0),
            yPaddingDiff: numeric ? 0 : (padding.bottom ?? 0) - (padding.top ?? 0),
        };
    }

    /**
     * Ellipsises a `'clip-text'` label to the chart container. Bounded from the anchor point, not the drawn
     * box: a box-relative bound moves as the text shortens, so it would never settle.
     */
    private clipLabelText(bounds: BBox) {
        const { crossLineLabel, containerBox, label, anchor } = this;
        const { text } = label;
        if (containerBox == null || text == null || text === '') return;

        let bbox = crossLineLabel.getBBox();
        if (bbox == null) return;

        const { x, y, width, height } = containerBox;
        const container = Transformable.fromCanvas(this.labelGroup, new BBox(x, y, width, height));
        const { pad, xPaddingDiff, yPaddingDiff } = this.labelAnchorOffsets();
        const anchorX = bounds.x + (bounds.width * (anchor.rangeH + 1)) / 2 - xPaddingDiff / 2;
        const anchorY = bounds.y + (bounds.height * (anchor.rangeV + 1)) / 2 - yPaddingDiff / 2;
        const availableX = availableExtent(anchorX, anchor.labelH, pad, container.x, container.x + container.width);
        const availableY = availableExtent(anchorY, anchor.labelV, pad, container.y, container.y + container.height);

        // The rotated footprint is affine in the text width, which keeps the boxing padding out of the solve.
        // It cannot bound the lines wrapping adds, so an overflowing wrapped label collapses to one line first.
        const { text: fittedText, fontSize } = this.fittedLabel();
        const font = fontWithSize(label, fontSize);
        const oneLine = (maxWidth: number | undefined) => {
            const fitted = fitLabelText(text, { maxWidth, wrapping: 'never', overflowStrategy: 'ellipsis' }, font);
            return typeof fitted === 'string' ? fitted : text;
        };
        let lineText = fittedText;
        if (fittedText.includes('\n') && (bbox.width > availableX || bbox.height > availableY)) {
            lineText = oneLine(label.maxWidth);
            crossLineLabel.text = lineText;
            bbox = crossLineLabel.getBBox();
            if (bbox == null) return;
        }

        const textWidth = cachedTextMeasurer(font).measureLines(lineText).width;
        const cos = Math.abs(Math.cos(crossLineLabel.rotation));
        const sin = Math.abs(Math.sin(crossLineLabel.rotation));
        // Only a direction the text actually extends along can bound it; the bound is not floored before
        // the minimum, so shrinking room keeps shortening the text instead of jumping back to full length.
        let maxWidth = Infinity;
        if (cos > ROTATION_EPSILON) {
            maxWidth = Math.min(maxWidth, (availableX - (bbox.width - textWidth * cos)) / cos);
        }
        if (sin > ROTATION_EPSILON) {
            maxWidth = Math.min(maxWidth, (availableY - (bbox.height - textWidth * sin)) / sin);
        }
        if (maxWidth >= textWidth) return;

        crossLineLabel.text = oneLine(Math.max(maxWidth, 0));
    }

    private labelPoint(bounds: BBox, anchor: Anchor, { width, height }: { width: number; height: number }) {
        const { pad, xPaddingDiff, yPaddingDiff } = this.labelAnchorOffsets();
        const xOffset = width / 2 + pad;
        const yOffset = height / 2 + pad;
        return {
            x: bounds.x + (bounds.width * (anchor.rangeH + 1)) / 2 - xOffset * anchor.labelH - xPaddingDiff / 2,
            y: bounds.y + (bounds.height * (anchor.rangeV + 1)) / 2 - yOffset * anchor.labelV - yPaddingDiff / 2,
        };
    }

    private positionLabel(bounds: BBox) {
        const { crossLineLabel } = this;

        const bbox = crossLineLabel.getBBox();
        if (bbox == null) return;

        const { x, y } = this.labelPoint(bounds, this.anchor, bbox);
        crossLineLabel.x = x;
        crossLineLabel.y = y;
        crossLineLabel.rotationCenterX = x;
        crossLineLabel.rotationCenterY = y;
    }

    private computeLabelSize(): { width: number; height: number } | undefined {
        if (!this.hasFittedText) return;
        const { label } = this;
        const { text, fontSize } = this.fittedLabel();
        const tempText = new TransformableText();
        tempText.setFont(label);
        tempText.fontSize = fontSize;
        tempText.text = text;
        tempText.rotation = toRadians(label.rotation ?? 0);
        tempText.textBaseline = 'middle';
        tempText.textAlign = 'center';

        const bbox = tempText.getBBox();
        if (bbox == null) return;

        const { width, height } = bbox;
        return { width, height };
    }

    private get labelPaddingSide(): PaddingSide | undefined {
        return this.paddingSideOf(this.anchor);
    }

    private paddingSideOf(anchor: Anchor): PaddingSide | undefined {
        // The theme supplies the default, but a cross line built without one must still pad as it always did.
        if ((this.label.overflow ?? 'pad-chart') !== 'pad-chart') return undefined;

        if (this.horizontal) {
            if (anchor.rangeH === -1 && anchor.labelH === 1) return 'left';
            if (anchor.rangeH === 1 && anchor.labelH === -1) return 'right';
        } else {
            if (anchor.rangeV === -1 && anchor.labelV === 1) return 'top';
            if (anchor.rangeV === 1 && anchor.labelV === -1) return 'bottom';
        }
        return undefined;
    }

    calculatePadding(into: Partial<Record<AgCrossLineLabelPosition, number>>) {
        this.paddedSide = undefined;
        if (!this.padsForLabel) return;

        const side = this.labelPaddingSide;
        if (side == null) return;

        const offset = this.paddingExtent(side);
        if (offset == null) return;

        into[side] = Math.max(into[side] ?? 0, offset);
        this.paddedSide = side;
    }

    private paddingExtent(side: PaddingSide): number | undefined {
        const size = this.computeLabelSize();
        if (!size) return;

        const padding = resolvePadding(this.label.padding);
        return side === 'left' || side === 'right'
            ? padding.left + padding.right + size.width
            : padding.top + padding.bottom + size.height;
    }
}
