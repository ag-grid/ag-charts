import type {
    AgCartesianCrossLineLabelOptions,
    AgCrossLineLabelPosition,
    FontStyle,
    FontWeight,
} from '../../options/agChartOptions';
import { BandScale } from '../../scale/bandScale';
import { ContinuousScale } from '../../scale/continuousScale';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import type { Point } from '../../scene/point';
import { Range } from '../../scene/shape/range';
import { Text } from '../../scene/shape/text';
import { createId } from '../../util/id';
import { clampArray } from '../../util/number';
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
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
    Validate,
} from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelRotation } from '../label';
import { Layers } from '../layers';
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

class CartesianCrossLineLabel implements AgCartesianCrossLineLabelOptions {
    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean = undefined;

    @Validate(STRING, { optional: true })
    text?: string = undefined;

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle = undefined;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight = undefined;

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
    position?: CrossLineLabelPosition = undefined;

    @Validate(DEGREE, { optional: true })
    rotation?: number = undefined;

    @Validate(BOOLEAN, { optional: true })
    parallel?: boolean = undefined;
}

type NodeData = number[];

export class CartesianCrossLine implements CrossLine<CartesianCrossLineLabel> {
    protected static readonly LINE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_LINE_ZINDEX;
    protected static readonly RANGE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_RANGE_ZINDEX;
    protected static readonly LABEL_LAYER_ZINDEX = Layers.SERIES_LABEL_ZINDEX;

    static readonly className = 'CrossLine';
    readonly id = createId(this);

    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean = undefined;

    @Validate(UNION(['range', 'line'], 'a crossLine type'), { optional: true })
    type?: CrossLineType = undefined;

    @Validate(AND(MATCHING_CROSSLINE_TYPE('range'), ARRAY.restrict({ length: 2 })), {
        optional: true,
    })
    range?: [any, any] = undefined;

    @Validate(MATCHING_CROSSLINE_TYPE('value'), { optional: true })
    value?: any = undefined;

    @Validate(COLOR_STRING, { optional: true })
    fill?: string = undefined;

    @Validate(RATIO, { optional: true })
    fillOpacity?: number = undefined;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = undefined;

    @Validate(NUMBER, { optional: true })
    strokeWidth?: number = undefined;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number = undefined;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: [] = undefined;

    label: CartesianCrossLineLabel = new CartesianCrossLineLabel();

    scale?: Scale<any, number> = undefined;
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;
    parallelFlipRotation: number = 0;
    regularFlipRotation: number = 0;
    direction: ChartAxisDirection = ChartAxisDirection.X;

    readonly group = new Group({ name: `${this.id}`, layer: true, zIndex: CartesianCrossLine.LINE_LAYER_ZINDEX });
    readonly labelGroup = new Group({ name: `${this.id}`, layer: true, zIndex: CartesianCrossLine.LABEL_LAYER_ZINDEX });
    private crossLineRange: Range = new Range();
    private crossLineLabel = new Text();
    private labelPoint?: Point = undefined;

    private data: NodeData = [];
    private startLine: boolean = false;
    private endLine: boolean = false;
    private isRange: boolean = false;

    constructor() {
        const { group, labelGroup, crossLineRange, crossLineLabel } = this;

        group.append(crossLineRange);
        labelGroup.append(crossLineLabel);

        crossLineRange.pointerEvents = PointerEvents.None;
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

    calculateLayout(visible: boolean, reversedAxis?: boolean): BBox | undefined {
        if (!visible) {
            return;
        }

        const dataCreated = this.createNodeData(reversedAxis);
        if (!dataCreated) {
            return;
        }

        const { sideFlag, gridLength, data } = this;

        const boxes: BBox[] = [];

        const x1 = 0;
        const x2 = sideFlag * gridLength;
        const y1 = data[0];
        const y2 = data[1];
        const crossLineBox = new BBox(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x1 - x2), Math.abs(y1 - y2));
        boxes.push(crossLineBox);

        const labelBox = this.computeLabelBBox();
        if (labelBox) {
            boxes.push(labelBox);
        }

        return BBox.merge(boxes);
    }

    private updateNodes() {
        this.updateRangeNode();

        if (this.label.enabled) {
            this.updateLabel();
            this.positionLabel();
        }
    }

    private createNodeData(reversedAxis?: boolean): boolean {
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

        if (!scale) {
            return false;
        }

        const bandwidth = scale.bandwidth ?? 0;
        const step = scale.step ?? 0;
        const padding = (reversedAxis ? -1 : 1) * (scale instanceof BandScale ? (step - bandwidth) / 2 : 0);

        const [xStart, xEnd] = [0, sideFlag * gridLength];
        let [yStart, yEnd] = this.getRange();

        let [clampedYStart, clampedYEnd] = [
            Number(scale.convert(yStart, { clampMode: 'clamped' })) - padding,
            scale.convert(yEnd, { clampMode: 'clamped' }) + bandwidth + padding,
        ];
        clampedYStart = clampArray(clampedYStart, clippedRange);
        clampedYEnd = clampArray(clampedYEnd, clippedRange);
        [yStart, yEnd] = [Number(scale.convert(yStart)), scale.convert(yEnd) + bandwidth];

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

        if (!validRange && !this.startLine && !this.endLine) {
            return false;
        }

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

        return true;
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

        if (!label.text) {
            return;
        }

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

        if (x === undefined || y === undefined) {
            return;
        }

        const { defaultRotation, configuredRotation } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        crossLineLabel.rotation = defaultRotation + configuredRotation;

        crossLineLabel.textBaseline = 'middle';
        crossLineLabel.textAlign = 'center';

        const bbox = crossLineLabel.computeTransformedBBox();

        if (!bbox) {
            return;
        }

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
        if (isRange) {
            return CartesianCrossLine.RANGE_LAYER_ZINDEX;
        }

        return CartesianCrossLine.LINE_LAYER_ZINDEX;
    }

    private getRange(): [any, any] {
        const { value, range, scale } = this;

        const isContinuous = ContinuousScale.is(scale);
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
        if (!label.enabled) {
            return;
        }
        const tempText = new Text();
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

        if (x === undefined || y === undefined) {
            return;
        }

        const { configuredRotation } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        tempText.rotation = configuredRotation;

        tempText.textBaseline = 'middle';
        tempText.textAlign = 'center';

        const bbox = tempText.computeTransformedBBox();

        if (!bbox) {
            return;
        }

        const yDirection = direction === ChartAxisDirection.Y;
        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection,
            padding,
            position,
            bbox,
        });

        tempText.translationX = x + xTranslation;
        tempText.translationY = y + yTranslation;

        return tempText.computeTransformedBBox();
    }

    calculatePadding(padding: Partial<Record<AgCrossLineLabelPosition, number>>) {
        const {
            isRange,
            startLine,
            endLine,
            direction,
            label: { padding: labelPadding = 0, position = 'top' },
        } = this;
        if (!isRange && !startLine && !endLine) {
            return;
        }

        const crossLineLabelBBox = this.computeLabelBBox();
        if (crossLineLabelBBox?.x == null || crossLineLabelBBox?.y == null) {
            return;
        }

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
