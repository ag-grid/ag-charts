import type {
    AgCartesianCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    FontStyle,
    FontWeight,
} from 'ag-charts-types';

import { BandScale } from '../../scale/bandScale';
import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Layer } from '../../scene/layer';
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
    DEGREE,
    FONT_STYLE,
    FONT_WEIGHT,
    LINE_DASH,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
    Validate,
} from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelRotation } from '../label';
import { ZIndexMap } from '../zIndexMap';
import { type CrossLine, type CrossLineType, MATCHING_CROSSLINE_TYPE, validateCrossLineValues } from './crossLine';
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
        'topLeft',
        'topRight',
        'bottomLeft',
        'bottomRight',
        'inside',
        'insideLeft',
        'insideRight',
        'insideTop',
        'insideBottom',
        'insideTopLeft',
        'insideBottomLeft',
        'insideTopRight',
        'insideBottomRight',
    ],
    'crossLine label position'
);

class CartesianCrossLineLabel extends BaseProperties implements AgCartesianCrossLineLabelOptions {
    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @Validate(STRING, { optional: true })
    text?: string;

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @Validate(POSITIVE_NUMBER)
    fontSize: number = 14;

    @Validate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    /**
     * The padding between the label and the line.
     */
    @Validate(NUMBER)
    padding: number = 5;

    /**
     * The color of the labels.
     */
    @Validate(COLOR_STRING, { optional: true })
    color?: string = 'rgba(87, 87, 87, 1)';

    @Validate(CROSSLINE_LABEL_POSITION, { optional: true })
    position?: CrossLineLabelPosition;

    @Validate(DEGREE, { optional: true })
    rotation?: number;

    @Validate(BOOLEAN, { optional: true })
    parallel?: boolean;
}

type NodeData = number[];

export class CartesianCrossLine extends BaseProperties implements CrossLine<CartesianCrossLineLabel> {
    protected static readonly LINE_LAYER_ZINDEX = ZIndexMap.SERIES_CROSSLINE_LINE;
    protected static readonly RANGE_LAYER_ZINDEX = ZIndexMap.SERIES_CROSSLINE_RANGE;
    protected static readonly LABEL_LAYER_ZINDEX = ZIndexMap.SERIES_LABEL;

    static readonly className = 'CrossLine';
    readonly id = createId(this);

    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @Validate(UNION(['range', 'line'], 'a crossLine type'), { optional: true })
    type?: CrossLineType;

    @Validate(AND(MATCHING_CROSSLINE_TYPE('range'), ARRAY.restrict({ length: 2 })), {
        optional: true,
    })
    range?: [any, any];

    @Validate(MATCHING_CROSSLINE_TYPE('value'), { optional: true })
    value?: any;

    @Validate(COLOR_STRING, { optional: true })
    fill?: string;

    @Validate(RATIO, { optional: true })
    fillOpacity?: number;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(NUMBER, { optional: true })
    strokeWidth?: number;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: [];

    @Validate(OBJECT)
    label: CartesianCrossLineLabel = new CartesianCrossLineLabel();

    scale?: Scale<any, number> = undefined;
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;
    parallelFlipRotation: number = 0;
    regularFlipRotation: number = 0;
    direction: ChartAxisDirection = ChartAxisDirection.X;

    readonly group = new Layer({ name: this.id, zIndex: CartesianCrossLine.LINE_LAYER_ZINDEX });
    readonly labelGroup = new Layer({ name: this.id, zIndex: CartesianCrossLine.LABEL_LAYER_ZINDEX });
    private readonly crossLineRange = new Range();
    private readonly crossLineLabel = new TransformableText();
    private labelPoint?: Point = undefined;

    private data: NodeData = [];
    private startLine: boolean = false;
    private endLine: boolean = false;
    private isRange: boolean = false;

    constructor() {
        super();

        this.group.append(this.crossLineRange);
        this.labelGroup.append(this.crossLineLabel);

        this.crossLineRange.pointerEvents = PointerEvents.None;
    }

    update(visible: boolean) {
        const { enabled, data, type, value, range, scale } = this;
        if (
            !type ||
            !scale ||
            !enabled ||
            !visible ||
            !validateCrossLineValues(type, value, range, scale) ||
            data.length === 0
        ) {
            this.group.visible = false;
            this.labelGroup.visible = false;
            return;
        }

        this.group.visible = visible;
        this.labelGroup.visible = visible;
        this.group.zIndex = this.getZIndex(this.isRange);
        this.updateNodes();
    }

    calculateLayout(visible: boolean, reversedAxis?: boolean) {
        if (!visible) return;

        const {
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
        const padding = (reversedAxis ? -1 : 1) * (scale instanceof BandScale ? (step - bandwidth) / 2 : 0);

        const [xStart, xEnd] = [0, sideFlag * gridLength];
        let [yStart, yEnd] = this.getRange();

        const ordinalTimeScalePadding = yEnd === undefined && OrdinalTimeScale.is(scale) ? bandwidth / 2 + padding : 0;

        let [clampedYStart, clampedYEnd] = [
            Number(scale.convert(yStart, { clampMode: 'clamped' })) - padding + ordinalTimeScalePadding,
            scale.convert(yEnd, { clampMode: 'clamped' }) + bandwidth + padding,
        ];
        clampedYStart = clampArray(clampedYStart, clippedRange);
        clampedYEnd = clampArray(clampedYEnd, clippedRange);
        [yStart, yEnd] = [Number(scale.convert(yStart)) + ordinalTimeScalePadding, scale.convert(yEnd) + bandwidth];

        const validRange =
            (yStart === clampedYStart || yEnd === clampedYEnd || clampedYStart !== clampedYEnd) &&
            Math.abs(clampedYEnd - clampedYStart) > 0;

        if (validRange && clampedYStart > clampedYEnd) {
            [clampedYStart, clampedYEnd] = [clampedYEnd, clampedYStart];
            [yStart, yEnd] = [yEnd, yStart];
        }

        if (yStart - padding >= clampedYStart) yStart -= padding;
        if (yEnd + padding <= clampedYEnd) yEnd += padding;

        this.isRange = validRange;
        this.startLine = strokeWidth > 0 && yStart >= clampedYStart && yStart <= clampedYStart + padding;
        this.endLine = strokeWidth > 0 && yEnd >= clampedYEnd - bandwidth - padding && yEnd <= clampedYEnd;

        if (!validRange && !this.startLine && !this.endLine) return;

        this.data = [clampedYStart, clampedYEnd];

        if (this.label.enabled) {
            const yDirection = direction === ChartAxisDirection.Y;

            const { c = POSITION_TOP_COORDINATES } = labelDirectionHandling[position] ?? {};
            const { x: labelX, y: labelY } = c({
                yDirection,
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
    }

    private updateNodes() {
        this.updateRangeNode();

        if (this.label.enabled) {
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

    protected getZIndex(isRange: boolean = false): number {
        return isRange ? CartesianCrossLine.RANGE_LAYER_ZINDEX : CartesianCrossLine.LINE_LAYER_ZINDEX;
    }

    private getRange(): [any, any] {
        const { value, range, scale } = this;

        const isContinuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const start = range?.[0] ?? value;
        let end = range?.[1];

        if (!isContinuous && end === undefined) {
            end = start;
        }

        if (isContinuous && start === end) {
            end = undefined;
        }

        return [start, end];
    }

    private computeLabelBBox(): BBox | undefined {
        const { label } = this;
        if (!label.enabled) return;
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
