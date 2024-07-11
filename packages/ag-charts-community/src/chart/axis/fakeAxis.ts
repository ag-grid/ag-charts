import type { AgCartesianAxisPosition, CssColor, FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

import { resetMotion } from '../../motion/resetMotion';
import { ContinuousScale } from '../../scale/continuousScale';
import { LinearScale } from '../../scale/linearScale';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { Matrix } from '../../scene/matrix';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { Text } from '../../scene/shape/text';
import type { PlacedLabelDatum } from '../../scene/util/labelPlacement';
import { axisLabelsOverlap } from '../../scene/util/labelPlacement';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { areArrayNumbersEqual } from '../../util/equal';
import { createId } from '../../util/id';
import { clamp, countFractionDigits, findMinMax, findRangeExtent, round } from '../../util/number';
import { type MeasureOptions, TextMeasurer } from '../../util/textMeasurer';
import { OBJECT, POSITION, Validate } from '../../util/validation';
import type { ChartAxisLabelFlipFlag } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelBBox, calculateLabelRotation, getLabelSpacing, getTextAlign, getTextBaseline } from '../label';
import { Layers } from '../layers';
import { AxisInterval } from './axisInterval';
import { AxisLabel } from './axisLabel';
import { type TickInterval } from './axisTick';
import type { AxisLineDatum } from './axisUtil';
import { resetAxisGroupFn, resetAxisLabelSelectionFn, resetAxisLineSelectionFn } from './axisUtil';

type TickStrategyResult = {
    index: number;
    tickData: TickData;
    terminate: boolean;
};

type TickDatum = {
    tickLabel: string;
    tick: any;
    tickId: string;
    translationY: number;
};

type LabelNodeDatum = {
    tickId: string;
    fill?: CssColor;
    fontFamily?: FontFamily;
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    rotation: number;
    rotationCenterX: number;
    text: string;
    textAlign?: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    visible: boolean;
    x: number;
    y: number;
    translationY: number;
    range: number[];
};

type TickData = { rawTicks: any[]; fractionDigits: number; ticks: TickDatum[]; labelCount: number };

interface TickGenerationParams {
    primaryTickCount?: number;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    labelX: number;
    sideFlag: ChartAxisLabelFlipFlag;
}

interface TickGenerationResult {
    tickData: TickData;
    primaryTickCount?: number;
    combinedRotation: number;
    textBaseline: CanvasTextBaseline;
    textAlign: CanvasTextAlign;
}

export abstract class FakeAxis<
    S extends Scale<D, number, TickInterval<S>> = Scale<any, number, any>,
    D extends number = number,
> {
    static readonly defaultTickMinSpacing = 50;

    readonly id = createId(this);

    @Validate(OBJECT)
    readonly interval = new AxisInterval();

    dataDomain: { domain: D[]; clipped: boolean } = { domain: [], clipped: false };

    @Validate(POSITION)
    position!: AgCartesianAxisPosition;

    get direction() {
        return ['top', 'bottom'].includes(this.position) ? ChartAxisDirection.X : ChartAxisDirection.Y;
    }

    readonly axisGroup = new Group({ name: `${this.id}-axis`, zIndex: Layers.AXIS_ZINDEX });

    protected lineNode = this.axisGroup.appendChild(new Line());
    protected readonly tickLabelGroup = this.axisGroup.appendChild(
        new Group({ name: `${this.id}-Axis-tick-labels`, zIndex: Layers.AXIS_ZINDEX })
    );
    protected readonly labelGroup = new Group({ name: `${this.id}-Labels`, zIndex: Layers.SERIES_ANNOTATION_ZINDEX });

    protected tickLabelGroupSelection = Selection.select<Text, LabelNodeDatum>(this.tickLabelGroup, Text, false);

    readonly label = new AxisLabel();

    readonly translation = { x: 0, y: 0 };
    rotation: number = 0; // axis rotation angle in degrees

    readonly scale = new LinearScale();

    constructor() {
        this.range = this.scale.range.slice() as [number, number];
    }

    private updateDirection() {
        switch (this.position) {
            case 'top':
                this.rotation = -90;
                this.label.mirrored = true;
                this.label.parallel = true;
                break;
            case 'right':
                this.rotation = 0;
                this.label.mirrored = true;
                this.label.parallel = false;
                break;
            case 'bottom':
                this.rotation = -90;
                this.label.mirrored = false;
                this.label.parallel = true;
                break;
            case 'left':
                this.rotation = 0;
                this.label.mirrored = false;
                this.label.parallel = false;
                break;
        }
    }

    attachAxis(axisNode: Node) {
        axisNode.appendChild(this.axisGroup);
    }

    range: [number, number] = [0, 1];

    /**
     * Checks if a point or an object is in range.
     * @param x A point (or object's starting point).
     * @param tolerance Expands the range on both ends by this amount.
     */
    private inRange(x: number, tolerance = 0): boolean {
        const [min, max] = findMinMax(this.range);
        return x >= min - tolerance && x <= max + tolerance;
    }

    private labelFormatter?: (datum: any) => string;

    /**
     * Is used to avoid collisions between axis labels and series.
     */
    seriesAreaPadding = 0;

    /**
     * Creates/removes/updates the scene graph nodes that constitute the axis.
     */
    update(_primaryTickCount: number = 0): number | undefined {
        if (!this.tickGenerationResult) return;

        this.updateDirection();

        this.axisGroup.datum = this.getAxisTransform();

        const lineData = this.getAxisLineCoordinates();
        const { tickData, combinedRotation, textBaseline, textAlign } = this.tickGenerationResult;
        this.updateSelections(lineData, tickData.ticks, {
            combinedRotation,
            textAlign,
            textBaseline,
            range: this.scale.range,
        });

        this.updateLabels();
        this.updateVisibility();
    }

    private getAxisLineCoordinates(): AxisLineDatum {
        const [min, max] = findMinMax(this.range);
        return { x: 0, y1: min, y2: max };
    }

    private getTickLabelProps(
        datum: TickDatum,
        params: {
            combinedRotation: number;
            textBaseline: CanvasTextBaseline;
            textAlign: CanvasTextAlign;
            range: number[];
        }
    ): LabelNodeDatum {
        const { label } = this;
        const { combinedRotation, textBaseline, textAlign, range } = params;
        const text = datum.tickLabel;
        const sideFlag = label.getSideFlag();
        const labelX = sideFlag * (label.padding + this.seriesAreaPadding);
        const visible = text !== '' && text != null;
        return {
            tickId: datum.tickId,
            translationY: datum.translationY,
            fill: label.color,
            fontFamily: label.fontFamily,
            fontSize: label.fontSize,
            fontStyle: label.fontStyle,
            fontWeight: label.fontWeight,
            rotation: combinedRotation,
            rotationCenterX: labelX,
            text,
            textAlign,
            textBaseline,
            visible,
            x: labelX,
            y: 0,
            range,
        };
    }

    private tickGenerationResult: TickGenerationResult | undefined = undefined;

    calculateLayout(primaryTickCount?: number): BBox {
        this.updateDirection();

        const { parallelFlipRotation, regularFlipRotation } = this.calculateRotations();
        const sideFlag = this.label.getSideFlag();
        const labelX = sideFlag * (this.label.padding + this.seriesAreaPadding);

        this.scale.interval = this.interval.step;
        this.scale.range = this.range;
        this.scale.update();
        this.tickGenerationResult = this.generateTicks({
            primaryTickCount,
            parallelFlipRotation,
            regularFlipRotation,
            labelX,
            sideFlag,
        });

        const { tickData, combinedRotation, textBaseline, textAlign } = this.tickGenerationResult;

        const boxes: BBox[] = [];

        const { x, y1, y2 } = this.getAxisLineCoordinates();
        const lineBox = new BBox(
            x + Math.min(sideFlag * this.seriesAreaPadding, 0),
            y1,
            this.seriesAreaPadding,
            y2 - y1
        );
        boxes.push(lineBox);

        if (this.label.enabled) {
            const tempText = new Text();
            tickData.ticks.forEach((datum) => {
                const labelProps = this.getTickLabelProps(datum, {
                    combinedRotation,
                    textAlign,
                    textBaseline,
                    range: this.scale.range,
                });
                if (!labelProps.visible) {
                    return;
                }

                tempText.setProperties({
                    ...labelProps,
                    translationY: Math.round(datum.translationY),
                });

                const box = tempText.computeTransformedBBox();
                if (box) {
                    boxes.push(box);
                }
            });
        }

        const bbox = BBox.merge(boxes);
        return this.getTransformBox(bbox);
    }

    private getTransformBox(bbox: BBox) {
        const matrix = new Matrix();
        const { rotation: axisRotation, translationX, translationY } = this.getAxisTransform();
        Matrix.updateTransformMatrix(matrix, 1, 1, axisRotation, translationX, translationY);
        return matrix.transformBBox(bbox);
    }

    setDomain(domain: D[]) {
        this.dataDomain = { domain: [...domain], clipped: false };
        this.scale.domain = this.dataDomain.domain;
    }

    private calculateRotations() {
        const rotation = toRadians(this.rotation);
        // When labels are parallel to the axis line, the `parallelFlipFlag` is used to
        // flip the labels to avoid upside-down text, when the axis is rotated
        // such that it is in the right hemisphere, i.e. the angle of rotation
        // is in the [0, π] interval.
        // The rotation angle is normalized, so that we have an easier time checking
        // if it's in the said interval. Since the axis is always rendered vertically
        // and then rotated, zero rotation means 12 (not 3) o-clock.
        // -1 = flip
        //  1 = don't flip (default)
        const parallelFlipRotation = normalizeAngle360(rotation);
        const regularFlipRotation = normalizeAngle360(rotation - Math.PI / 2);
        return { rotation, parallelFlipRotation, regularFlipRotation };
    }

    private generateTicks({
        primaryTickCount,
        parallelFlipRotation,
        regularFlipRotation,
        labelX,
        sideFlag,
    }: TickGenerationParams): TickGenerationResult {
        const {
            interval: { minSpacing, maxSpacing },
            label: { parallel, rotation, fontFamily, fontSize, fontStyle, fontWeight },
        } = this;

        const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        const initialRotation = configuredRotation + defaultRotation;
        const labelMatrix = new Matrix();

        const { maxTickCount } = this.estimateTickCount({ minSpacing, maxSpacing });

        const maxIterations = isNaN(maxTickCount) ? 10 : maxTickCount;

        let textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);
        const textBaseline = getTextBaseline(parallel, configuredRotation, sideFlag, parallelFlipFlag);
        const font = TextMeasurer.toFontString({ fontFamily, fontSize, fontStyle, fontWeight });

        let tickData: TickData = {
            rawTicks: [],
            fractionDigits: 0,
            ticks: [],
            labelCount: 0,
        };

        let index = 0;
        let labelOverlap = true;
        let terminate = false;
        while (labelOverlap && index <= maxIterations) {
            if (terminate) break;

            ({ tickData, index, terminate } = this.createTickData(index, tickData, terminate));

            const rotated = configuredRotation !== 0;

            textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);
            labelOverlap = this.label.avoidCollisions
                ? this.checkLabelOverlap(initialRotation, rotated, labelMatrix, tickData.ticks, labelX, { font })
                : false;
        }

        const combinedRotation = defaultRotation + configuredRotation;

        if (tickData.rawTicks.length) {
            primaryTickCount = tickData.rawTicks.length;
        }

        return { tickData, primaryTickCount, combinedRotation, textBaseline, textAlign };
    }

    private createTickData(index: number, tickData: TickData, terminate: boolean): TickStrategyResult {
        const { step, values, minSpacing, maxSpacing } = this.interval;
        const { maxTickCount, minTickCount, defaultTickCount } = this.estimateTickCount({ minSpacing, maxSpacing });
        const maxIterations = isNaN(maxTickCount) ? 10 : maxTickCount;

        let tickCount = Math.max(defaultTickCount - index, minTickCount);

        const regenerateTicks = step == null && values == null && tickCount > minTickCount;

        let unchanged = true;
        while (unchanged && index <= maxIterations) {
            const prevTicks = tickData.rawTicks;
            tickCount = Math.max(defaultTickCount - index, minTickCount);

            const { rawTicks, fractionDigits, ticks, labelCount } = this.getTicks({
                tickCount,
                minTickCount,
                maxTickCount,
            });

            tickData.rawTicks = rawTicks;
            tickData.fractionDigits = fractionDigits;
            tickData.ticks = ticks;
            tickData.labelCount = labelCount;

            unchanged = regenerateTicks ? areArrayNumbersEqual(rawTicks, prevTicks) : false;
            index++;
        }

        const shouldTerminate = step !== undefined || values !== undefined;

        terminate ||= shouldTerminate;

        return { tickData, index, terminate };
    }

    private checkLabelOverlap(
        rotation: number,
        rotated: boolean,
        labelMatrix: Matrix,
        tickData: TickDatum[],
        labelX: number,
        textProps: MeasureOptions
    ): boolean {
        Matrix.updateTransformMatrix(labelMatrix, 1, 1, rotation, 0, 0);

        const labelData: PlacedLabelDatum[] = this.createLabelData(tickData, labelX, textProps, labelMatrix);
        const labelSpacing = getLabelSpacing(this.label.minSpacing, rotated);

        return axisLabelsOverlap(labelData, labelSpacing);
    }

    private createLabelData(
        tickData: TickDatum[],
        labelX: number,
        textProps: MeasureOptions,
        labelMatrix: Matrix
    ): PlacedLabelDatum[] {
        const labelData: PlacedLabelDatum[] = [];

        for (const { tickLabel, translationY } of tickData) {
            if (!tickLabel) continue;

            const { width, height } = TextMeasurer.measureLines(tickLabel, textProps);
            const bbox = new BBox(labelX, translationY, width, height);
            const labelDatum = calculateLabelBBox(tickLabel, bbox, labelMatrix);

            labelData.push(labelDatum);
        }

        return labelData;
    }

    private getTicks({
        tickCount,
        minTickCount,
        maxTickCount,
    }: {
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
    }) {
        const { range, scale } = this;

        const rawTicks = this.createTicks(tickCount, minTickCount, maxTickCount);

        const fractionDigits = rawTicks.reduce((max, tick) => Math.max(max, countFractionDigits(tick)), 0);
        const ticks: TickDatum[] = [];

        let labelCount = 0;
        const tickIdCounts = new Map<string, number>();
        const filteredTicks = rawTicks.slice(0, rawTicks.length);

        // When the scale domain or the ticks change, the label format may change
        this.labelFormatter = this.label.format
            ? this.scale.tickFormat({ ticks: filteredTicks, specifier: this.label.format })
            : (x: unknown) => (typeof x === 'number' ? x.toFixed(fractionDigits) : String(x));

        for (let i = 0; i < filteredTicks.length; i++) {
            const tick = filteredTicks[i];
            const translationY = scale.convert(tick);

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !this.inRange(translationY, 0.001)) continue;

            const tickLabel =
                this.label.formatter?.({ value: tick, index: i, fractionDigits }) ??
                this.labelFormatter?.(tick) ??
                String(tick);

            // Create a tick id from the label, or as an increment of the last label if this tick label is blank
            let tickId = tickLabel;
            if (tickIdCounts.has(tickId)) {
                const count = tickIdCounts.get(tickId)!;
                tickIdCounts.set(tickId, count + 1);
                tickId = `${tickId}_${count}`;
            } else {
                tickIdCounts.set(tickId, 1);
            }

            ticks.push({ tick, tickId, tickLabel, translationY: Math.floor(translationY) });

            if (tickLabel != null && tickLabel !== '') {
                labelCount++;
            }
        }

        return { rawTicks, fractionDigits, ticks, labelCount };
    }

    private createTicks(tickCount: number, minTickCount: number = 0, maxTickCount: number = Infinity) {
        const { scale } = this;

        if (tickCount) {
            scale.tickCount = tickCount;
            scale.minTickCount = minTickCount;
            scale.maxTickCount = maxTickCount;
        }

        return scale.ticks();
    }

    private estimateTickCount({ minSpacing, maxSpacing }: { minSpacing: number; maxSpacing: number }): {
        minTickCount: number;
        maxTickCount: number;
        defaultTickCount: number;
    } {
        const rangeWithBleed = round(findRangeExtent(this.range), 2);
        const defaultMinSpacing = Math.max(
            FakeAxis.defaultTickMinSpacing,
            rangeWithBleed / ContinuousScale.defaultMaxTickCount
        );
        let clampMaxTickCount = !isNaN(maxSpacing);

        if (isNaN(minSpacing)) {
            minSpacing = defaultMinSpacing;
        }

        if (isNaN(maxSpacing)) {
            maxSpacing = rangeWithBleed;
        }

        if (minSpacing > maxSpacing) {
            if (minSpacing === defaultMinSpacing) {
                minSpacing = maxSpacing;
            } else {
                maxSpacing = minSpacing;
            }
        }

        // Clamps the min spacing between ticks to be no more than the min distance between datums
        const minRectDistance = 1;
        clampMaxTickCount &&= minRectDistance < defaultMinSpacing;

        // TODO: Remove clamping to hardcoded 100 max tick count, this is a temp fix for zooming
        const maxTickCount = clamp(
            1,
            Math.floor(rangeWithBleed / minSpacing),
            clampMaxTickCount ? Math.min(Math.floor(rangeWithBleed / minRectDistance), 100) : 100
        );
        const minTickCount = Math.min(maxTickCount, Math.ceil(rangeWithBleed / maxSpacing));
        const defaultTickCount = clamp(minTickCount, ContinuousScale.defaultTickCount, maxTickCount);

        return { minTickCount, maxTickCount, defaultTickCount };
    }

    private updateVisibility() {
        const { tickLabelGroupSelection, lineNode } = this;

        resetMotion([this.axisGroup], resetAxisGroupFn());
        resetMotion([tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([lineNode], resetAxisLineSelectionFn());

        this.tickLabelGroup.visible = this.label.enabled;
    }

    private getAxisTransform() {
        return {
            rotation: toRadians(this.rotation),
            translationX: Math.floor(this.translation.x),
            translationY: Math.floor(this.translation.y),
        };
    }

    private updateSelections(
        lineData: AxisLineDatum,
        data: TickDatum[],
        params: {
            combinedRotation: number;
            textBaseline: CanvasTextBaseline;
            textAlign: CanvasTextAlign;
            range: number[];
        }
    ) {
        this.lineNode.datum = lineData;
        this.tickLabelGroupSelection.update(
            data.map((d) => this.getTickLabelProps(d, params)),
            (group) => group.appendChild(new Text()),
            (datum) => datum.tickId
        );
    }

    private updateLabels() {
        if (this.label.enabled) {
            // Apply label option values
            this.tickLabelGroupSelection.each((node, datum) => {
                node.setProperties(datum, [
                    'fill',
                    'fontFamily',
                    'fontSize',
                    'fontStyle',
                    'fontWeight',
                    'text',
                    'textAlign',
                    'textBaseline',
                ]);
            });
        }
    }
}
