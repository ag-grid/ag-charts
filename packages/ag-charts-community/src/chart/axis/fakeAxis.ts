import type { AgCartesianAxisPosition, CssColor, FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { resetMotion } from '../../motion/resetMotion';
import { ContinuousScale } from '../../scale/continuousScale';
import { LinearScale } from '../../scale/linearScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { Matrix } from '../../scene/matrix';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { Text, type TextSizeProperties } from '../../scene/shape/text';
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

type TickStrategyParams = {
    index: number;
    tickData: TickData;
    textProps: TextSizeProperties;
    labelOverlap: boolean;
    terminate: boolean;
    primaryTickCount?: number;
};

type TickStrategyResult = {
    index: number;
    tickData: TickData;
    autoRotation: number;
    terminate: boolean;
};

type TickStrategy = (params: TickStrategyParams) => TickStrategyResult;

enum TickGenerationType {
    CREATE,
    FILTER,
    VALUES,
}

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

    protected defaultTickMinSpacing: number = FakeAxis.defaultTickMinSpacing;

    readonly translation = { x: 0, y: 0 };
    rotation: number = 0; // axis rotation angle in degrees

    private minRect?: BBox = undefined;

    readonly scale = new LinearScale();

    constructor(private readonly moduleCtx: ModuleContext) {
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

    private updateRange() {
        const { range: rr, visibleRange: vr, scale } = this;
        const span = (rr[1] - rr[0]) / (vr[1] - vr[0]);
        const shift = span * vr[0];
        const start = rr[0] - shift;

        scale.range = [start, start + span];
    }

    attachAxis(axisNode: Node) {
        axisNode.appendChild(this.axisGroup);
    }

    range: [number, number] = [0, 1];
    visibleRange: [number, number] = [0, 1];

    /**
     * Checks if a point or an object is in range.
     * @param x A point (or object's starting point).
     * @param tolerance Expands the range on both ends by this amount.
     */
    private inRange(x: number, tolerance = 0): boolean {
        const [min, max] = findMinMax(this.range);
        return x >= min - tolerance && x <= max + tolerance;
    }

    private datumFormatter?: (datum: any) => string;
    private labelFormatter?: (datum: any) => string;
    private setFormatters(ticks: any[], fractionDigits: number, _domain: any[], format?: string) {
        const formatter = format ? this.scale.tickFormat({ ticks, specifier: format }) : null;
        const defaultFormatter = (formatOffset: number) => (x: any) =>
            typeof x === 'number' ? x.toFixed(fractionDigits + formatOffset) : String(x);

        this.labelFormatter = formatter ?? defaultFormatter(0);
        this.datumFormatter = formatter ?? defaultFormatter(1);
    }

    /**
     * Is used to avoid collisions between axis labels and series.
     */
    seriesAreaPadding = 0;

    /**
     * Creates/removes/updates the scene graph nodes that constitute the axis.
     */
    update(_primaryTickCount: number = 0): number | undefined {
        this.updateDirection();
        if (!this.tickGenerationResult) {
            return;
        }
        this.updatePosition();

        const lineData = this.getAxisLineCoordinates();
        const { tickData, combinedRotation, textBaseline, textAlign, primaryTickCount } = this.tickGenerationResult;
        this.updateSelections(lineData, tickData.ticks, {
            combinedRotation,
            textAlign,
            textBaseline,
            range: this.scale.range,
        });

        this.updateLabels();
        this.updateVisibility();

        return primaryTickCount;
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

    calculateLayout(primaryTickCount?: number): { primaryTickCount: number | undefined; bbox: BBox } {
        this.updateDirection();

        const { parallelFlipRotation, regularFlipRotation } = this.calculateRotations();
        const sideFlag = this.label.getSideFlag();
        const labelX = sideFlag * (this.label.padding + this.seriesAreaPadding);

        this.updateScale();

        this.tickGenerationResult = this.generateTicks({
            primaryTickCount,
            parallelFlipRotation,
            regularFlipRotation,
            labelX,
            sideFlag,
        });

        const { tickData, combinedRotation, textBaseline, textAlign, ...ticksResult } = this.tickGenerationResult;

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
        const transformedBBox = this.getTransformBox(bbox);

        return {
            primaryTickCount: ticksResult.primaryTickCount,
            bbox: transformedBBox,
        };
    }

    private getTransformBox(bbox: BBox) {
        const matrix = new Matrix();
        const {
            rotation: axisRotation,
            translationX,
            translationY,
            rotationCenterX,
            rotationCenterY,
        } = this.getAxisTransform();
        Matrix.updateTransformMatrix(matrix, 1, 1, axisRotation, translationX, translationY, {
            scalingCenterX: 0,
            scalingCenterY: 0,
            rotationCenterX,
            rotationCenterY,
        });
        return matrix.transformBBox(bbox);
    }

    setDomain(domain: D[]) {
        this.dataDomain = { domain: [...domain], clipped: false };
        this.scale.domain = this.dataDomain.domain;
    }

    private updateScale() {
        const { scale } = this;
        this.updateRange();
        scale.interval = this.interval.step;
        if (!ContinuousScale.is(scale)) return;
        scale.nice = false;
        scale.update();
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

        const textProps: TextSizeProperties = {
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            textBaseline,
            textAlign,
        };

        let tickData: TickData = {
            rawTicks: [],
            fractionDigits: 0,
            ticks: [],
            labelCount: 0,
        };

        let index = 0;
        let autoRotation = 0;
        let labelOverlap = true;
        let terminate = false;
        while (labelOverlap && index <= maxIterations) {
            if (terminate) {
                break;
            }
            autoRotation = 0;
            textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);

            const tickStrategies = this.getTickStrategies(index);

            for (const strategy of tickStrategies) {
                ({ tickData, index, autoRotation, terminate } = strategy({
                    index,
                    tickData,
                    textProps,
                    labelOverlap,
                    terminate,
                    primaryTickCount,
                }));

                const rotated = configuredRotation !== 0 || autoRotation !== 0;
                const labelRotation = initialRotation + autoRotation;
                textAlign = getTextAlign(parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
                labelOverlap = this.label.avoidCollisions
                    ? this.checkLabelOverlap(labelRotation, rotated, labelMatrix, tickData.ticks, labelX, { font })
                    : false;
            }
        }

        const combinedRotation = defaultRotation + configuredRotation + autoRotation;

        if (tickData.rawTicks.length) {
            primaryTickCount = tickData.rawTicks.length;
        }

        return { tickData, primaryTickCount, combinedRotation, textBaseline, textAlign };
    }

    private getTickStrategies(iteration: number): TickStrategy[] {
        const { scale, label } = this;
        const { minSpacing } = this.interval;
        const continuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const avoidLabelCollisions = label.enabled && label.avoidCollisions;
        const filterTicks = !continuous && iteration !== 0 && avoidLabelCollisions;

        const strategies: TickStrategy[] = [];
        let tickGenerationType: TickGenerationType;
        if (this.interval.values) {
            tickGenerationType = TickGenerationType.VALUES;
        } else if (filterTicks) {
            tickGenerationType = TickGenerationType.FILTER;
        } else {
            tickGenerationType = TickGenerationType.CREATE;
        }

        const tickGenerationStrategy = ({ index, tickData, terminate }: TickStrategyParams) =>
            this.createTickData(tickGenerationType, index, tickData, terminate);

        strategies.push(tickGenerationStrategy);

        if (!continuous && !isNaN(minSpacing)) {
            const tickFilterStrategy = ({ index, tickData, terminate }: TickStrategyParams) =>
                this.createTickData(TickGenerationType.FILTER, index, tickData, terminate);
            strategies.push(tickFilterStrategy);
        }

        if (!avoidLabelCollisions) {
            return strategies;
        }

        return strategies;
    }

    private createTickData(
        tickGenerationType: TickGenerationType,
        index: number,
        tickData: TickData,
        terminate: boolean
    ): TickStrategyResult {
        const { scale } = this;
        const { step, values, minSpacing, maxSpacing } = this.interval;
        const { maxTickCount, minTickCount, defaultTickCount } = this.estimateTickCount({ minSpacing, maxSpacing });

        const continuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        let tickCount = continuous ? Math.max(defaultTickCount - index, minTickCount) : maxTickCount;

        const regenerateTicks =
            step === undefined &&
            values === undefined &&
            tickCount > minTickCount &&
            (continuous || tickGenerationType === TickGenerationType.FILTER);

        let unchanged = true;
        while (unchanged && index <= maxIterations) {
            const prevTicks = tickData.rawTicks;
            tickCount = continuous ? Math.max(defaultTickCount - index, minTickCount) : maxTickCount;

            const { rawTicks, fractionDigits, ticks, labelCount } = this.getTicks({
                tickGenerationType,
                previousTicks: prevTicks,
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

        return { tickData, index, autoRotation: 0, terminate };
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
        tickGenerationType,
        previousTicks,
        tickCount,
        minTickCount,
        maxTickCount,
    }: {
        tickGenerationType: TickGenerationType;
        previousTicks: TickDatum[];
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
    }) {
        const { range, scale, visibleRange } = this;

        const rawTicks =
            tickGenerationType === TickGenerationType.FILTER
                ? this.filterTicks(previousTicks, tickCount)
                : this.createTicks(tickCount, minTickCount, maxTickCount);

        const fractionDigits = rawTicks.reduce((max, tick) => Math.max(max, countFractionDigits(tick)), 0);
        const ticks: TickDatum[] = [];

        let labelCount = 0;
        const tickIdCounts = new Map<string, number>();

        // Only get the ticks within a sliding window of the visible range to improve performance
        const start = Math.max(0, Math.floor(visibleRange[0] * rawTicks.length));
        const end = Math.min(rawTicks.length, Math.ceil(visibleRange[1] * rawTicks.length));

        const filteredTicks = rawTicks.slice(start, end);
        // When the scale domain or the ticks change, the label format may change
        this.setFormatters(filteredTicks, fractionDigits, rawTicks, this.label.format);

        for (let i = 0; i < filteredTicks.length; i++) {
            const tick = filteredTicks[i];
            const translationY = scale.convert(tick);

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !this.inRange(translationY, 0.001)) continue;

            const tickLabel = this.formatTick(tick, fractionDigits, start + i);

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

    private filterTicks(ticks: any, tickCount: number): any[] {
        const { minSpacing, maxSpacing } = this.interval;
        const tickSpacing = !isNaN(minSpacing) || !isNaN(maxSpacing);
        const keepEvery = tickSpacing ? Math.ceil(ticks.length / tickCount) : 2;
        return ticks.filter((_: any, i: number) => i % keepEvery === 0);
    }

    private createTicks(tickCount: number, minTickCount: number = 0, maxTickCount: number = Infinity) {
        const { scale } = this;

        if (tickCount) {
            scale.tickCount = tickCount;
            scale.minTickCount = minTickCount;
            scale.maxTickCount = maxTickCount;
        }

        return scale.ticks?.() ?? [];
    }

    private estimateTickCount({ minSpacing, maxSpacing }: { minSpacing: number; maxSpacing: number }): {
        minTickCount: number;
        maxTickCount: number;
        defaultTickCount: number;
    } {
        const { minRect } = this;
        const rangeWithBleed = this.calculateRangeWithBleed();
        const defaultMinSpacing = Math.max(
            this.defaultTickMinSpacing,
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
        let minRectDistance = 1;
        if (minRect) {
            minRectDistance = this.direction === ChartAxisDirection.X ? minRect.width : minRect.height;
        }
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
        resetMotion([tickLabelGroupSelection], resetAxisLabelSelectionFn() as any);
        resetMotion([lineNode], resetAxisLineSelectionFn());

        this.tickLabelGroup.visible = this.label.enabled;
    }

    /**
     * Calculates the available range with an additional "bleed" beyond the canvas that encompasses the full axis when
     * the visible range is only a portion of the axis.
     */
    private calculateRangeWithBleed() {
        const visibleScale = 1 / findRangeExtent(this.visibleRange);
        return round(findRangeExtent(this.range) * visibleScale, 2);
    }

    private getAxisTransform() {
        return {
            rotation: toRadians(this.rotation),
            rotationCenterX: 0,
            rotationCenterY: 0,
            translationX: Math.floor(this.translation.x),
            translationY: Math.floor(this.translation.y),
        };
    }

    private updatePosition() {
        this.axisGroup.datum = this.getAxisTransform();
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
        const { label } = this;
        if (!label.enabled) {
            return;
        }

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

    // For formatting (nice rounded) tick values.
    private formatTick(datum: any, fractionDigits: number, index: number): string {
        return String(this.getFormatter(index, true)(datum, fractionDigits));
    }

    private getFormatter(index: number = 0, isTickLabel?: boolean): (datum: any, fractionDigits?: number) => string {
        const {
            label,
            labelFormatter,
            datumFormatter,
            moduleCtx: { callbackCache },
        } = this;

        if (label.formatter) {
            return (datum, fractionDigits) =>
                callbackCache.call(label.formatter!, { value: datum, index, fractionDigits }) ?? datum;
        } else if (!isTickLabel && datumFormatter) {
            return (datum) => datumFormatter(datum) ?? String(datum);
        } else if (labelFormatter) {
            return (datum) => labelFormatter(datum) ?? String(datum);
        }
        // The axis is using a logScale or the`datum` is an integer, a string or an object
        return String;
    }
}
