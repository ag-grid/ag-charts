import {
    BaseProperties,
    Property,
    cachedTextMeasurer,
    clampArray,
    createId,
    findMinMax,
    fitLabelText,
    toRadians,
} from 'ag-charts-core';
import type { BoxBounds, CanvasPoint, Scale } from 'ag-charts-core';
import type {
    AgCartesianAxisPosition,
    AgCartesianCrossLineLabelOptions,
    AgCrossLineLabelOverflow,
    AgCrossLineLabelPosition,
    AgCrossLineListeners,
    Padding,
} from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import { Range } from '../../scene/shape/range';
import { TransformableText } from '../../scene/shape/text';
import { Transformable } from '../../scene/transformable';
import { LabelStyle } from '../label';
import { rangeAlignment } from '../rangeAlignment';
import { bandRangeExpansion } from '../scaleValue';
import { type CrossLine, type CrossLineType, validateCrossLineValue } from './crossLine';
import type { CrossLineLabelPosition } from './crossLineLabelPosition';

type AnchorDirection = 1 | 0 | -1;

interface Anchor {
    rangeH: AnchorDirection;
    rangeV: AnchorDirection;
    labelH: AnchorDirection;
    labelV: AnchorDirection;
}

const horizontalLineAnchors: Record<AgCrossLineLabelPosition, Anchor> = {
    top: { rangeH: 0, rangeV: -1, labelH: 0, labelV: 1 },
    'inside-top': { rangeH: 0, rangeV: -1, labelH: 0, labelV: 1 },
    'top-left': { rangeH: -1, rangeV: -1, labelH: -1, labelV: 1 },
    'inside-top-left': { rangeH: -1, rangeV: -1, labelH: -1, labelV: 1 },
    left: { rangeH: -1, rangeV: 0, labelH: 1, labelV: 0 },
    'inside-left': { rangeH: -1, rangeV: 0, labelH: -1, labelV: 0 },
    'bottom-left': { rangeH: -1, rangeV: 1, labelH: -1, labelV: -1 },
    'inside-bottom-left': { rangeH: -1, rangeV: 1, labelH: -1, labelV: -1 },
    bottom: { rangeH: 0, rangeV: 1, labelH: 0, labelV: -1 },
    'inside-bottom': { rangeH: 0, rangeV: 1, labelH: 0, labelV: -1 },
    'bottom-right': { rangeH: 1, rangeV: 1, labelH: 1, labelV: -1 },
    'inside-bottom-right': { rangeH: 1, rangeV: 1, labelH: 1, labelV: -1 },
    right: { rangeH: 1, rangeV: 0, labelH: -1, labelV: 0 },
    'inside-right': { rangeH: 1, rangeV: 0, labelH: 1, labelV: 0 },
    'top-right': { rangeH: 1, rangeV: -1, labelH: 1, labelV: 1 },
    'inside-top-right': { rangeH: 1, rangeV: -1, labelH: 1, labelV: 1 },
    inside: { rangeH: 0, rangeV: 0, labelH: 0, labelV: 0 },
};

const verticalLineAnchors: Record<AgCrossLineLabelPosition, Anchor> = {
    top: { rangeH: 0, rangeV: -1, labelH: 0, labelV: 1 },
    'inside-top': { rangeH: 0, rangeV: -1, labelH: 0, labelV: -1 },
    'top-left': { rangeH: -1, rangeV: -1, labelH: 1, labelV: -1 },
    'inside-top-left': { rangeH: -1, rangeV: -1, labelH: 1, labelV: -1 },
    left: { rangeH: -1, rangeV: 0, labelH: 1, labelV: 0 },
    'inside-left': { rangeH: -1, rangeV: 0, labelH: 1, labelV: 0 },
    'bottom-left': { rangeH: -1, rangeV: 1, labelH: 1, labelV: 1 },
    'inside-bottom-left': { rangeH: -1, rangeV: 1, labelH: 1, labelV: 1 },
    bottom: { rangeH: 0, rangeV: 1, labelH: 0, labelV: -1 },
    'inside-bottom': { rangeH: 0, rangeV: 1, labelH: 0, labelV: 1 },
    'bottom-right': { rangeH: 1, rangeV: 1, labelH: -1, labelV: 1 },
    'inside-bottom-right': { rangeH: 1, rangeV: 1, labelH: -1, labelV: 1 },
    right: { rangeH: 1, rangeV: 0, labelH: -1, labelV: 0 },
    'inside-right': { rangeH: 1, rangeV: 0, labelH: -1, labelV: 0 },
    'top-right': { rangeH: 1, rangeV: -1, labelH: -1, labelV: -1 },
    'inside-top-right': { rangeH: -1, rangeV: -1, labelH: -1, labelV: -1 },
    inside: { rangeH: 0, rangeV: 0, labelH: 0, labelV: 0 },
};

const horizontalRangeAnchors: Record<AgCrossLineLabelPosition, Anchor> = {
    top: { rangeH: 0, rangeV: -1, labelH: 0, labelV: 1 },
    'inside-top': { rangeH: 0, rangeV: -1, labelH: 0, labelV: -1 },
    'top-left': { rangeH: -1, rangeV: -1, labelH: -1, labelV: 1 },
    'inside-top-left': { rangeH: -1, rangeV: -1, labelH: -1, labelV: -1 },
    left: { rangeH: -1, rangeV: 0, labelH: 1, labelV: 0 },
    'inside-left': { rangeH: -1, rangeV: 0, labelH: -1, labelV: 0 },
    'bottom-left': { rangeH: -1, rangeV: 1, labelH: -1, labelV: -1 },
    'inside-bottom-left': { rangeH: -1, rangeV: 1, labelH: -1, labelV: 1 },
    bottom: { rangeH: 0, rangeV: 1, labelH: 0, labelV: -1 },
    'inside-bottom': { rangeH: 0, rangeV: 1, labelH: 0, labelV: 1 },
    'bottom-right': { rangeH: 1, rangeV: 1, labelH: 1, labelV: -1 },
    'inside-bottom-right': { rangeH: 1, rangeV: 1, labelH: 1, labelV: 1 },
    right: { rangeH: 1, rangeV: 0, labelH: -1, labelV: 0 },
    'inside-right': { rangeH: 1, rangeV: 0, labelH: 1, labelV: 0 },
    'top-right': { rangeH: 1, rangeV: -1, labelH: 1, labelV: 1 },
    'inside-top-right': { rangeH: 1, rangeV: -1, labelH: 1, labelV: -1 },
    inside: { rangeH: 0, rangeV: 0, labelH: 0, labelV: 0 },
};

const verticalRangeAnchors: Record<AgCrossLineLabelPosition, Anchor> = {
    top: { rangeH: 0, rangeV: -1, labelH: 0, labelV: 1 },
    'inside-top': { rangeH: 0, rangeV: -1, labelH: 0, labelV: -1 },
    'top-left': { rangeH: -1, rangeV: -1, labelH: 1, labelV: -1 },
    'inside-top-left': { rangeH: -1, rangeV: -1, labelH: -1, labelV: -1 },
    left: { rangeH: -1, rangeV: 0, labelH: 1, labelV: 0 },
    'inside-left': { rangeH: -1, rangeV: 0, labelH: -1, labelV: 0 },
    'bottom-left': { rangeH: -1, rangeV: 1, labelH: 1, labelV: 1 },
    'inside-bottom-left': { rangeH: -1, rangeV: 1, labelH: -1, labelV: 1 },
    bottom: { rangeH: 0, rangeV: 1, labelH: 0, labelV: -1 },
    'inside-bottom': { rangeH: 0, rangeV: 1, labelH: 0, labelV: 1 },
    'bottom-right': { rangeH: 1, rangeV: 1, labelH: -1, labelV: 1 },
    'inside-bottom-right': { rangeH: 1, rangeV: 1, labelH: 1, labelV: 1 },
    right: { rangeH: 1, rangeV: 0, labelH: -1, labelV: 0 },
    'inside-right': { rangeH: 1, rangeV: 0, labelH: 1, labelV: 0 },
    'top-right': { rangeH: 1, rangeV: -1, labelH: -1, labelV: -1 },
    'inside-top-right': { rangeH: 1, rangeV: -1, labelH: 1, labelV: -1 },
    inside: { rangeH: 0, rangeV: 0, labelH: 0, labelV: 0 },
};

/**
 * Mirrors an outward-facing anchor back across the cross line. The guards match
 * {@link CartesianCrossLine.calculatePadding}'s exactly, so a realigned label can never demand padding.
 */
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
 * Room the label has along one axis, measured from the point its anchor pins rather than from the box it
 * would draw untruncated. `labelDir` is the anchor's `labelH`/`labelV`: the label grows away from
 * `anchorAt` when that is `1` or `-1`, and symmetrically about it when it is `0`.
 */
function availableExtent(anchorAt: number, labelDir: AnchorDirection, pad: number, low: number, high: number) {
    if (labelDir === 1) return anchorAt - pad - low;
    if (labelDir === -1) return high - (anchorAt + pad);
    return 2 * Math.min(anchorAt - low, high - anchorAt);
}

class CartesianCrossLineLabel extends LabelStyle implements AgCartesianCrossLineLabelOptions {
    @Property
    enabled!: boolean;

    @Property
    override padding: Padding = 5;

    @Property
    text?: string;

    @Property
    position?: CrossLineLabelPosition;

    @Property
    overflow?: AgCrossLineLabelOverflow;

    @Property
    avoidCollisions?: boolean;

    @Property
    rotation?: number;

    @Property
    parallel?: boolean;
}

type NodeData = [number, number];

/** Pointer hit tolerance in pixels, widening a cross line's line/fill so thin `line` cross lines remain targetable. */
const CROSS_LINE_HIT_TOLERANCE = 5;

export class CartesianCrossLine extends BaseProperties implements CrossLine<CartesianCrossLineLabel> {
    static readonly className = 'CrossLine';
    readonly internalId = createId(this);

    @Property
    id?: string;

    @Property
    enabled?: boolean;

    @Property
    type!: CrossLineType;

    @Property
    range?: [unknown, unknown];

    @Property
    value?: unknown;

    @Property
    defaultColorRange: string[] = [];

    @Property
    fill: string = '#c16068';

    @Property
    fillOpacity?: number;

    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;

    @Property
    lineDash?: [];

    @Property
    label: CartesianCrossLineLabel = new CartesianCrossLineLabel();

    @Property
    listeners?: AgCrossLineListeners<unknown>;

    scale?: Scale<any, number> = undefined; // TODO: this type does not match the interface
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    gridPadding: number = 0;
    containerBox?: BoxBounds = undefined;
    position: AgCartesianAxisPosition = 'top';

    get defaultLabelPosition(): AgCrossLineLabelPosition {
        return 'top';
    }

    readonly rangeGroup = new Group({ name: this.internalId });
    readonly lineGroup = new Group({ name: this.internalId });
    readonly labelGroup = new Group({ name: this.internalId });
    private readonly crossLineRange = this.lineGroup.appendChild(new Range());
    private readonly crossLineLabel = this.labelGroup.appendChild(new TransformableText());

    private data: NodeData | undefined = undefined;
    private startLine: boolean = false;
    private endLine: boolean = false;

    constructor() {
        super();
        this.crossLineRange.pointerEvents = PointerEvents.None;
    }

    /**
     * Hit-tests a canvas-space point against this cross line's rendered line/fill and its label, widened
     * by {@link CROSS_LINE_HIT_TOLERANCE} so thin `line` cross lines remain targetable. The `crossLineRange`
     * node holds the geometry for both the `line` (stroke) and `range` (fill) variants; its bbox is
     * transformed into canvas space to match the pointer coordinates carried by pointer events.
     */
    containsPoint(point: CanvasPoint): boolean {
        const group = this.type === 'range' ? this.rangeGroup : this.lineGroup;
        if (!this.enabled || this.data == null || !group.visible) {
            return false;
        }

        const bbox = Transformable.toCanvas(this.crossLineRange).clone().grow(CROSS_LINE_HIT_TOLERANCE);
        if (bbox.containsPoint(point.canvasX, point.canvasY)) {
            return true;
        }

        // The label is only rendered under the same conditions `updateNodes` applies, so an
        // unlabelled cross line must not report a hit on its zero-sized label node.
        const { label } = this;
        if (!this.labelGroup.visible || label.enabled === false || !label.text) {
            return false;
        }
        return Transformable.toCanvas(this.crossLineLabel).containsPoint(point.canvasX, point.canvasY);
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

        let [clippedRange0, clippedRange1] = findMinMax(clippedRange);
        clippedRange0 -= bandwidth;
        clippedRange1 += bandwidth;

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

            if (clampedYStart >= clippedRange1 || clampedYStart <= clippedRange0) {
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

            if (clampedYStart >= clippedRange1 || clampedYEnd <= clippedRange0) {
                return;
            }

            if (Number.isFinite(yStart)) {
                clampedYStart -= rangePadding;
            }

            if (Number.isFinite(yEnd)) {
                yEnd += bandwidth;
                clampedYEnd += bandwidth + rangePadding;
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

        if (this.label.enabled === false || !this.label.text) return;
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

        const { label } = this;
        if (label.enabled !== false && label.text) {
            this.updateLabel();
            if (label.overflow === 'clip-text') {
                this.clipLabelText(bounds);
            }
            this.positionLabel(bounds);
        }
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

        if (!label.text) return;

        crossLineLabel.fill = label.color;
        crossLineLabel.text = label.text;
        crossLineLabel.rotation = toRadians(label.rotation ?? 0);
        crossLineLabel.textAlign = 'center';
        crossLineLabel.textBaseline = 'middle';
        crossLineLabel.setFont(label);
        crossLineLabel.setBoxing(label);
    }

    private get anchor(): Anchor {
        const horizontal = this.position === 'left' || this.position === 'right';
        const range = this.type === 'range';
        const { position = this.defaultLabelPosition, overflow } = this.label;

        let anchors;
        if (range) {
            anchors = horizontal ? horizontalRangeAnchors : verticalRangeAnchors;
        } else {
            anchors = horizontal ? horizontalLineAnchors : verticalLineAnchors;
        }

        const anchor = anchors[position];
        if (overflow !== 'realign-text') return anchor;
        return realignAnchor(anchor, horizontal);
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
     * Truncates a `'clip-text'` label with an ellipsis so its box stays inside the chart container. The
     * label keeps its configured position, so the room available is measured from the anchor point, which
     * truncation does not move — a box-relative bound would shift as the text shortened and never settle.
     */
    private clipLabelText(bounds: BBox) {
        const { crossLineLabel, containerBox, label, anchor } = this;
        const { text } = label;
        if (containerBox == null || !text) return;

        const bbox = crossLineLabel.getBBox();
        if (!bbox) return;

        const { x, y, width, height } = containerBox;
        const container = Transformable.fromCanvas(this.labelGroup, new BBox(x, y, width, height));
        const { pad, xPaddingDiff, yPaddingDiff } = this.labelAnchorOffsets();
        const anchorX = bounds.x + (bounds.width * (anchor.rangeH + 1)) / 2 - xPaddingDiff / 2;
        const anchorY = bounds.y + (bounds.height * (anchor.rangeV + 1)) / 2 - yPaddingDiff / 2;
        const availableX = availableExtent(anchorX, anchor.labelH, pad, container.x, container.x + container.width);
        const availableY = availableExtent(anchorY, anchor.labelV, pad, container.y, container.y + container.height);

        // The drawn box is the rotated footprint of the text plus whatever boxing pads it by, so its extent
        // along either axis is `textWidth * component + a constant` — solving for the text width keeps the
        // boxing padding out of the arithmetic entirely.
        const textWidth = cachedTextMeasurer(label).measureLines(text).width;
        const cos = Math.abs(Math.cos(crossLineLabel.rotation));
        const sin = Math.abs(Math.sin(crossLineLabel.rotation));
        let maxWidth = Infinity;
        // An anchor pinned outside the container has no room to measure; leave such a label as authored.
        if (cos > ROTATION_EPSILON && availableX > 0) {
            maxWidth = Math.min(maxWidth, (availableX - (bbox.width - textWidth * cos)) / cos);
        }
        if (sin > ROTATION_EPSILON && availableY > 0) {
            maxWidth = Math.min(maxWidth, (availableY - (bbox.height - textWidth * sin)) / sin);
        }
        if (maxWidth <= 0 || maxWidth >= textWidth) return;

        const fitted = fitLabelText(text, { maxWidth, wrapping: 'never', overflowStrategy: 'ellipsis' }, label);
        if (typeof fitted === 'string') {
            crossLineLabel.text = fitted;
        }
    }

    private positionLabel(bounds: BBox) {
        const { crossLineLabel, anchor } = this;

        const bbox = crossLineLabel.getBBox();
        if (!bbox) return;
        const { width, height } = bbox;

        const { pad, xPaddingDiff, yPaddingDiff } = this.labelAnchorOffsets();
        const xOffset = width / 2 + pad;
        const yOffset = height / 2 + pad;

        const x = bounds.x + (bounds.width * (anchor.rangeH + 1)) / 2 - xOffset * anchor.labelH - xPaddingDiff / 2;
        const y = bounds.y + (bounds.height * (anchor.rangeV + 1)) / 2 - yOffset * anchor.labelV - yPaddingDiff / 2;

        crossLineLabel.x = x;
        crossLineLabel.y = y;
        crossLineLabel.rotationCenterX = x;
        crossLineLabel.rotationCenterY = y;
    }

    private computeLabelSize(): { width: number; height: number } | undefined {
        const { label } = this;
        if (label.enabled === false || !label.text) return;
        const tempText = new TransformableText();
        tempText.fontFamily = label.fontFamily;
        tempText.fontSize = label.fontSize;
        tempText.fontStyle = label.fontStyle;
        tempText.fontWeight = label.fontWeight;
        tempText.text = label.text;
        tempText.rotation = toRadians(label.rotation ?? 0);
        tempText.textBaseline = 'middle';
        tempText.textAlign = 'center';

        const bbox = tempText.getBBox();
        if (!bbox) return;

        const { width, height } = bbox;
        return { width, height };
    }

    calculatePadding(into: Partial<Record<AgCrossLineLabelPosition, number>>) {
        const {
            label: { padding, overflow },
            anchor,
        } = this;

        if (overflow !== 'pad-chart') return;

        const size = this.computeLabelSize();
        if (!size) return;
        const { width, height } = size;

        const xPadding = typeof padding === 'number' ? padding * 2 : (padding.left ?? 0) + (padding.right ?? 0);
        const yPadding = typeof padding === 'number' ? padding * 2 : (padding.top ?? 0) + (padding.bottom ?? 0);

        const xOffset = xPadding + width;
        const yOffset = yPadding + height;
        const horizontal = this.position === 'left' || this.position === 'right';

        if (horizontal) {
            if (anchor.rangeH === -1 && anchor.labelH === 1) {
                into.left = Math.max(into.left ?? 0, xOffset);
            } else if (anchor.rangeH === 1 && anchor.labelH === -1) {
                into.right = Math.max(into.right ?? 0, xOffset);
            }
        }

        if (!horizontal) {
            if (anchor.rangeV === -1 && anchor.labelV === 1) {
                into.top = Math.max(into.top ?? 0, yOffset);
            } else if (anchor.rangeV === 1 && anchor.labelV === -1) {
                into.bottom = Math.max(into.bottom ?? 0, yOffset);
            }
        }
    }
}
