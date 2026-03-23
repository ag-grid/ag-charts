import { BaseProperties, Property, type Scale, clampArray, createId, findMinMax, toRadians } from 'ag-charts-core';
import type {
    AgCartesianAxisPosition,
    AgCartesianCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    Padding,
} from 'ag-charts-types';

import { BandScale } from '../../scale/bandScale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import { Range } from '../../scene/shape/range';
import { TransformableText } from '../../scene/shape/text';
import { LabelStyle } from '../label';
import { rangeAlignment } from '../rangeAlignment';
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
    rotation?: number;

    @Property
    parallel?: boolean;
}

type NodeData = [number, number];

export class CartesianCrossLine extends BaseProperties implements CrossLine<CartesianCrossLineLabel> {
    static readonly className = 'CrossLine';
    readonly id = createId(this);

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

    scale?: Scale<any, number> = undefined;
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    gridPadding: number = 0;
    position: AgCartesianAxisPosition = 'top';

    get defaultLabelPosition(): AgCrossLineLabelPosition {
        return 'top';
    }

    readonly rangeGroup = new Group({ name: this.id });
    readonly lineGroup = new Group({ name: this.id });
    readonly labelGroup = new Group({ name: this.id });
    private readonly crossLineRange = this.lineGroup.appendChild(new Range());
    private readonly crossLineLabel = this.labelGroup.appendChild(new TransformableText());

    private data: NodeData | undefined = undefined;
    private startLine: boolean = false;
    private endLine: boolean = false;

    constructor() {
        super();
        this.crossLineRange.pointerEvents = PointerEvents.None;
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

        const bandwidth = scale.bandwidth ?? 0;
        const step = scale.step ?? 0;
        const rangePadding = scale instanceof BandScale ? (step - bandwidth) / 2 : 0;

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
        crossLineLabel.textAlign = 'center';
        crossLineLabel.textBaseline = 'middle';
        crossLineLabel.setFont(label);
        crossLineLabel.setBoxing(label);
    }

    private get anchor(): Anchor {
        const horizontal = this.position === 'left' || this.position === 'right';
        const range = this.type === 'range';
        const { position = this.defaultLabelPosition } = this.label;

        if (range) {
            const anchors = horizontal ? horizontalRangeAnchors : verticalRangeAnchors;
            return anchors[position];
        } else {
            const anchors = horizontal ? horizontalLineAnchors : verticalLineAnchors;
            return anchors[position];
        }
    }

    private positionLabel(bounds: BBox) {
        const {
            crossLineLabel,
            label: { padding, rotation },
            anchor,
        } = this;

        crossLineLabel.rotation = toRadians(rotation ?? 0);

        const bbox = crossLineLabel.getBBox();
        if (!bbox) return;
        const { width, height } = bbox;

        const xPaddingDiff = typeof padding === 'number' ? 0 : (padding.right ?? 0) - (padding.left ?? 0);
        const yPaddingDiff = typeof padding === 'number' ? 0 : (padding.bottom ?? 0) - (padding.top ?? 0);

        let xOffset = width / 2;
        let yOffset = height / 2;

        if (typeof padding === 'number' && !crossLineLabel.hasBoxing()) {
            xOffset += padding;
            yOffset += padding;
        }

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
            label: { padding },
            anchor,
        } = this;

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
