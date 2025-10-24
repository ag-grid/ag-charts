import { type Scale, createId } from 'ag-charts-core';
import type {
    AgCartesianAxisPosition,
    AgCartesianCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    FontStyle,
    FontWeight,
} from 'ag-charts-types';

import { BandScale } from '../../scale/bandScale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import { Range } from '../../scene/shape/range';
import { TransformableText } from '../../scene/shape/text';
import { toRadians } from '../../util/angle';
import { clampArray, findMinMax } from '../../util/number';
import { BaseProperties, Property } from '../../util/properties';
import { rangeAlignment } from '../rangeAlignment';
import { FONT_SIZE } from '../themes/constants';
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

class CartesianCrossLineLabel extends BaseProperties implements AgCartesianCrossLineLabelOptions {
    @Property
    enabled?: boolean;

    @Property
    text?: string;

    @Property
    fontStyle?: FontStyle;

    @Property
    fontWeight?: FontWeight;

    @Property
    fontSize: number = FONT_SIZE.LARGE;

    @Property
    fontFamily: string = 'Verdana, sans-serif';

    /**
     * The padding between the label and the line.
     */
    @Property
    padding: number = 5;

    /**
     * The color of the labels.
     */
    @Property
    color?: string = 'rgba(87, 87, 87, 1)';

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
    position: AgCartesianAxisPosition = 'top';

    get defaultLabelPosition(): AgCrossLineLabelPosition {
        return 'top';
    }

    readonly rangeGroup = new Group({ name: this.id });
    readonly lineGroup = new Group({ name: this.id });
    readonly labelGroup = new Group({ name: this.id });
    private readonly crossLineRange = new Range();
    private readonly crossLineLabel = new TransformableText();

    private data: NodeData | undefined = undefined;
    private startLine: boolean = false;
    private endLine: boolean = false;

    constructor() {
        super();

        this.lineGroup.append(this.crossLineRange);
        this.labelGroup.append(this.crossLineLabel);

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
        const { position, data: [r0, r1] = [0, 0], gridLength } = this;

        const dr = Number.isFinite(r1) ? r1 - r0 : 0;

        let bounds: BBox;
        switch (position) {
            case 'top':
            case 'bottom':
                bounds = new BBox(r0, position === 'top' ? 0 : -gridLength, dr, gridLength);
                break;
            case 'left':
            case 'right':
                bounds = new BBox(position === 'left' ? 0 : -gridLength, r0, gridLength, dr);
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

        crossLineLabel.fontStyle = label.fontStyle;
        crossLineLabel.fontWeight = label.fontWeight;
        crossLineLabel.fontSize = label.fontSize;
        crossLineLabel.fontFamily = label.fontFamily;
        crossLineLabel.fill = label.color;
        crossLineLabel.text = label.text;
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
        const { crossLineLabel, label, anchor } = this;

        crossLineLabel.rotation = toRadians(label.rotation ?? 0);
        crossLineLabel.textBaseline = 'middle';
        crossLineLabel.textAlign = 'center';

        const bbox = crossLineLabel.getBBox();
        if (!bbox) return;
        const { width, height } = bbox;

        const xOffset = label.padding + width / 2;
        const yOffset = label.padding + height / 2;

        const x = bounds.x + (bounds.width * (anchor.rangeH + 1)) / 2 - xOffset * anchor.labelH;
        const y = bounds.y + (bounds.height * (anchor.rangeV + 1)) / 2 - yOffset * anchor.labelV;

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
        const { label, anchor } = this;

        const size = this.computeLabelSize();
        if (!size) return;
        const { width, height } = size;

        const xOffset = label.padding + width;
        const yOffset = label.padding + height;
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
