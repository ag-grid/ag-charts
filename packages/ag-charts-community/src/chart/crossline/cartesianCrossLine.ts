import type {
    AgCartesianCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    FontStyle,
    FontWeight,
} from 'ag-charts-types';

import { BandScale } from '../../scale/bandScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import type { Point } from '../../scene/point';
import { Range } from '../../scene/shape/range';
import { TransformableText } from '../../scene/shape/text';
import { createId } from '../../util/id';
import { clampArray } from '../../util/number';
import { BaseProperties } from '../../util/properties';
import {
    AND,
    ARRAY,
    BOOLEAN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FONT_STYLE,
    FONT_WEIGHT,
    LINE_DASH,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TempValidate,
    UNION,
} from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelRotation } from '../label';
import {
    type CrossLine,
    type CrossLineType,
    MATCHING_CROSSLINE_TYPE,
    getCrossLineValue,
    validateCrossLineValue,
} from './crossLine';
import type { CrossLineLabelPosition } from './crossLineLabelPosition';
import {
    POSITION_TOP_COORDINATES,
    calculateLabelChartPadding,
    calculateLabelTranslation,
    labelDirectionHandling,
} from './crossLineLabelPosition';

const CROSSLINE_LABEL_POSITION = UNION(
    [
        'top',
        'left',
        'right',
        'bottom',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'inside',
        'inside-left',
        'inside-right',
        'inside-top',
        'inside-bottom',
        'inside-top-left',
        'inside-bottom-left',
        'inside-top-right',
        'inside-bottom-right',
    ],
    'crossLine label position'
);

class CartesianCrossLineLabel extends BaseProperties implements AgCartesianCrossLineLabelOptions {
    @TempValidate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @TempValidate(STRING, { optional: true })
    text?: string;

    @TempValidate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @TempValidate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @TempValidate(POSITIVE_NUMBER)
    fontSize: number = 14;

    @TempValidate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    /**
     * The padding between the label and the line.
     */
    @TempValidate(NUMBER)
    padding: number = 5;

    /**
     * The color of the labels.
     */
    @TempValidate(COLOR_STRING, { optional: true })
    color?: string = 'rgba(87, 87, 87, 1)';

    @TempValidate(CROSSLINE_LABEL_POSITION, { optional: true })
    position?: CrossLineLabelPosition;

    @TempValidate(NUMBER, { optional: true })
    rotation?: number;

    @TempValidate(BOOLEAN, { optional: true })
    parallel?: boolean;
}

type NodeData = number[];

export class CartesianCrossLine extends BaseProperties implements CrossLine<CartesianCrossLineLabel> {
    static readonly className = 'CrossLine';
    readonly id = createId(this);

    @TempValidate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @TempValidate(UNION(['range', 'line'], 'a crossLine type'))
    type!: CrossLineType;

    @TempValidate(AND(MATCHING_CROSSLINE_TYPE('range'), ARRAY.restrict({ length: 2 })), {
        optional: true,
    })
    range?: [unknown, unknown];

    @TempValidate(MATCHING_CROSSLINE_TYPE('value'), { optional: true })
    value?: unknown;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(COLOR_STRING)
    fill: string = '#c16068';

    @TempValidate(RATIO, { optional: true })
    fillOpacity?: number;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(NUMBER, { optional: true })
    strokeWidth?: number;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity?: number;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash?: [];

    @TempValidate(OBJECT)
    label: CartesianCrossLineLabel = new CartesianCrossLineLabel();

    scale?: Scale<any, number> = undefined;
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;
    parallelFlipRotation: number = 0;
    regularFlipRotation: number = 0;
    direction: ChartAxisDirection = ChartAxisDirection.X;

    readonly rangeGroup = new Group({ name: this.id });
    readonly lineGroup = new Group({ name: this.id });
    readonly labelGroup = new Group({ name: this.id });
    private readonly crossLineRange = new Range();
    private readonly crossLineLabel = new TransformableText();
    private labelPoint?: Point = undefined;

    private data: NodeData = [];
    private startLine: boolean = false;
    private endLine: boolean = false;
    private isRange: boolean = false;

    constructor() {
        super();

        this.lineGroup.append(this.crossLineRange);
        this.labelGroup.append(this.crossLineLabel);

        this.crossLineRange.pointerEvents = PointerEvents.None;
    }

    private _isRange: boolean | undefined = undefined;
    update(visible: boolean) {
        const { enabled, data, scale } = this;
        if (
            !scale ||
            !enabled ||
            !visible ||
            !this.isValid() ||
            !validateCrossLineValue(getCrossLineValue(this), scale) ||
            data.length === 0
        ) {
            this.rangeGroup.visible = false;
            this.lineGroup.visible = false;
            this.labelGroup.visible = false;
            return;
        }

        this.rangeGroup.visible = visible;
        this.lineGroup.visible = visible;
        this.labelGroup.visible = visible;
        this.updateNodes();

        const { isRange } = this;
        if (isRange !== this._isRange) {
            if (isRange) {
                this.rangeGroup.appendChild(this.crossLineRange);
            } else {
                this.lineGroup.appendChild(this.crossLineRange);
            }
        }
        this._isRange = isRange;
    }

    calculateLayout(visible: boolean, reversedAxis?: boolean) {
        if (!visible) return;

        const {
            type,
            range,
            value,
            scale,
            gridLength,
            sideFlag,
            direction,
            label: { position = 'top' },
            clippedRange,
            strokeWidth = 0,
        } = this;

        this.data = [];

        if (!scale) return;

        const bandwidth = scale.bandwidth ?? 0;
        const step = scale.step ?? 0;
        const rangePadding = (reversedAxis ? -1 : 1) * (scale instanceof BandScale ? (step - bandwidth) / 2 : 0);

        const [xStart, xEnd] = [0, sideFlag * gridLength];

        let yStart: number;
        let yEnd: number;
        let clampedYStart: number;
        let clampedYEnd: number;
        if (type === 'line') {
            const offset = bandwidth / 2;
            yStart = scale.convert(value as any) + offset;
            yEnd = NaN;
            clampedYStart = scale.convert(value as any, true) + offset;
            clampedYEnd = NaN;
        } else if (range) {
            const ordinalTimeScalePadding = OrdinalTimeScale.is(scale) ? bandwidth / 2 + rangePadding : 0;
            yStart = scale.convert(range[0] as any) + ordinalTimeScalePadding;
            yEnd = scale.convert(range[1] as any) + bandwidth;
            clampedYStart = scale.convert(range[0] as any, true) - rangePadding + ordinalTimeScalePadding;
            clampedYEnd = scale.convert(range[1] as any, true) + bandwidth + rangePadding;
        } else {
            return;
        }

        clampedYStart = clampArray(clampedYStart, clippedRange);
        clampedYEnd = clampArray(clampedYEnd, clippedRange);

        const validRange =
            (yStart === clampedYStart || yEnd === clampedYEnd || clampedYStart !== clampedYEnd) &&
            Math.abs(clampedYEnd - clampedYStart) > 0;

        if (validRange && clampedYStart > clampedYEnd) {
            [clampedYStart, clampedYEnd] = [clampedYEnd, clampedYStart];
            [yStart, yEnd] = [yEnd, yStart];
        }

        if (yStart - rangePadding >= clampedYStart) yStart -= rangePadding;
        if (yEnd + rangePadding <= clampedYEnd) yEnd += rangePadding;

        this.isRange = validRange;
        this.startLine = strokeWidth > 0 && yStart >= clampedYStart && yStart <= clampedYStart + rangePadding;
        this.endLine = strokeWidth > 0 && yEnd >= clampedYEnd - bandwidth - rangePadding && yEnd <= clampedYEnd;

        if (!validRange && !this.startLine && !this.endLine) return;

        this.data = [clampedYStart, clampedYEnd];

        if (this.label.enabled === false || !this.label.text) return;

        const { c = POSITION_TOP_COORDINATES } = labelDirectionHandling[position] ?? {};
        const { x: labelX, y: labelY } = c({
            direction,
            xStart,
            xEnd,
            yStart: clampedYStart,
            yEnd: clampedYEnd,
        });

        this.labelPoint = {
            x: labelX,
            y: labelY,
        };
    }

    private updateNodes() {
        this.updateRangeNode();

        const { label } = this;
        if (label.enabled !== false && label.text) {
            this.updateLabel();
            this.positionLabel();
        }
    }

    private updateRangeNode() {
        const {
            crossLineRange,
            sideFlag,
            gridLength,
            data,
            startLine,
            endLine,
            isRange,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            lineDash,
        } = this;

        crossLineRange.x1 = 0;
        crossLineRange.x2 = sideFlag * gridLength;
        crossLineRange.y1 = data[0];
        crossLineRange.y2 = data[1];
        crossLineRange.startLine = startLine;
        crossLineRange.endLine = endLine;
        crossLineRange.isRange = isRange;

        crossLineRange.fill = fill;
        crossLineRange.fillOpacity = fillOpacity ?? 1;

        crossLineRange.stroke = stroke;
        crossLineRange.strokeWidth = strokeWidth ?? 1;
        crossLineRange.strokeOpacity = this.strokeOpacity ?? 1;
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

    private positionLabel() {
        const {
            crossLineLabel,
            labelPoint: { x = undefined, y = undefined } = {},
            label: { parallel, rotation, position = 'top', padding = 0 },
            direction,
            parallelFlipRotation,
            regularFlipRotation,
        } = this;

        if (x === undefined || y === undefined) return;

        const { defaultRotation, configuredRotation } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        crossLineLabel.rotation = defaultRotation + configuredRotation;

        crossLineLabel.textBaseline = 'middle';
        crossLineLabel.textAlign = 'center';

        const bbox = crossLineLabel.getBBox();

        if (!bbox) return;

        const yDirection = direction === ChartAxisDirection.Y;
        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection,
            padding,
            position,
            bbox,
        });

        crossLineLabel.translationX = x + xTranslation;
        crossLineLabel.translationY = y + yTranslation;
    }

    private computeLabelBBox(): BBox | undefined {
        const { label } = this;
        if (label.enabled === false || !label.text) return;
        const tempText = new TransformableText();
        tempText.fontFamily = label.fontFamily;
        tempText.fontSize = label.fontSize;
        tempText.fontStyle = label.fontStyle;
        tempText.fontWeight = label.fontWeight;
        tempText.text = label.text;

        const {
            labelPoint: { x = undefined, y = undefined } = {},
            label: { parallel, rotation, position = 'top', padding = 0 },
            direction,
            parallelFlipRotation,
            regularFlipRotation,
        } = this;

        if (x === undefined || y === undefined) return;

        const { configuredRotation } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        tempText.rotation = configuredRotation;
        tempText.textBaseline = 'middle';
        tempText.textAlign = 'center';

        const bbox = tempText.getBBox();

        if (!bbox) return;

        const yDirection = direction === ChartAxisDirection.Y;
        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection,
            padding,
            position,
            bbox,
        });

        tempText.x = x + xTranslation;
        tempText.y = y + yTranslation;

        return tempText.getBBox();
    }

    calculatePadding(padding: Partial<Record<AgCrossLineLabelPosition, number>>) {
        const {
            isRange,
            startLine,
            endLine,
            direction,
            label: { padding: labelPadding = 0, position = 'top' },
        } = this;
        if (!isRange && !startLine && !endLine) return;

        const crossLineLabelBBox = this.computeLabelBBox();
        if (crossLineLabelBBox?.x == null || crossLineLabelBBox?.y == null) return;

        const chartPadding = calculateLabelChartPadding({
            yDirection: direction === ChartAxisDirection.Y,
            padding: labelPadding,
            position,
            bbox: crossLineLabelBBox,
        });

        padding.left = Math.max(padding.left ?? 0, chartPadding.left ?? 0);
        padding.right = Math.max(padding.right ?? 0, chartPadding.right ?? 0);
        padding.top = Math.max(padding.top ?? 0, chartPadding.top ?? 0);
        padding.bottom = Math.max(padding.bottom ?? 0, chartPadding.bottom ?? 0);
    }
}
