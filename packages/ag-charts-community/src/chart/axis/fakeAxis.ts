import type { AgCartesianAxisPosition, CssColor, FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

import { resetMotion } from '../../motion/resetMotion';
import { ContinuousScale } from '../../scale/continuousScale';
import { LinearScale } from '../../scale/linearScale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { Matrix } from '../../scene/matrix';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Text } from '../../scene/shape/text';
import type { PlacedLabelDatum } from '../../scene/util/labelPlacement';
import { axisLabelsOverlap } from '../../scene/util/labelPlacement';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { areArrayNumbersEqual } from '../../util/equal';
import { createId } from '../../util/id';
import { clamp, countFractionDigits, findMinMax, findRangeExtent, round } from '../../util/number';
import { createIdsGenerator } from '../../util/tempUtils';
import { type MeasureOptions, TextMeasurer } from '../../util/textMeasurer';
import { OBJECT, POSITION, Validate } from '../../util/validation';
import type { ChartAxisLabelFlipFlag } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelBBox, calculateLabelRotation, getLabelSpacing, getTextAlign, getTextBaseline } from '../label';
import { Layers } from '../layers';
import { AxisInterval } from './axisInterval';
import { AxisLabel } from './axisLabel';
import { resetAxisGroupFn, resetAxisLabelSelectionFn } from './axisUtil';

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

type TickData = { rawTicks: any[]; fractionDigits: number; ticks: TickDatum[] };

interface TickGenerationParams {
    primaryTickCount?: number;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    labelX: number;
    sideFlag: ChartAxisLabelFlipFlag;
}

interface TickGenerationResult {
    tickData: TickData;
    combinedRotation: number;
    textBaseline: CanvasTextBaseline;
    textAlign: CanvasTextAlign;
}

export class FakeAxis {
    readonly id = createId(this);

    @Validate(OBJECT)
    readonly interval = new AxisInterval();

    @Validate(POSITION)
    position!: AgCartesianAxisPosition;

    get direction() {
        return ['top', 'bottom'].includes(this.position) ? ChartAxisDirection.X : ChartAxisDirection.Y;
    }

    readonly axisGroup = new Group({ name: `${this.id}-axis`, zIndex: Layers.AXIS_ZINDEX });

    protected readonly tickLabelGroup = this.axisGroup.appendChild(
        new Group({ name: `${this.id}-Axis-tick-labels`, zIndex: Layers.AXIS_ZINDEX })
    );

    protected readonly labelGroup = new Group({ name: `${this.id}-Labels`, zIndex: Layers.SERIES_ANNOTATION_ZINDEX });

    protected tickLabelGroupSelection = Selection.select<Text, LabelNodeDatum>(this.tickLabelGroup, Text, false);

    readonly label = new AxisLabel();

    readonly translation = { x: 0, y: 0 };
    rotation: number = 0; // axis rotation angle in degrees

    readonly scale = new LinearScale();

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

    public padding: number = 0;

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
        const labelX = sideFlag * (label.padding + this.padding);
        return {
            visible: Boolean(text),
            tickId: datum.tickId,
            fill: label.color,
            fontFamily: label.fontFamily,
            fontSize: label.fontSize,
            fontStyle: label.fontStyle,
            fontWeight: label.fontWeight,
            rotation: combinedRotation,
            rotationCenterX: labelX,
            translationY: Math.round(datum.translationY),
            text,
            textAlign,
            textBaseline,
            x: labelX,
            y: 0,
            range,
        };
    }

    calculateLayout(): BBox {
        this.updateDirection();

        const { parallelFlipRotation, regularFlipRotation } = this.calculateRotations();
        const sideFlag = this.label.getSideFlag();
        const labelX = sideFlag * (this.label.padding + this.padding);

        this.scale.interval = this.interval.step;
        this.scale.range = this.range;
        this.scale.update();

        const { tickData, combinedRotation, textBaseline, textAlign } = this.generateTicks({
            parallelFlipRotation,
            regularFlipRotation,
            labelX,
            sideFlag,
        });

        const [r0, r1] = findMinMax(this.range);
        const padding = this.padding;
        const boxes: BBox[] = [];

        boxes.push(new BBox(Math.min(sideFlag * padding, 0), r0, padding, r1 - r0)); // lineBox

        if (this.label.enabled) {
            const tempText = new Text();
            tickData.ticks.forEach((datum) => {
                if (!datum.tickLabel) return;

                tempText.setProperties(
                    this.getTickLabelProps(datum, {
                        range: this.range,
                        combinedRotation,
                        textAlign,
                        textBaseline,
                    })
                );

                const bbox = tempText.computeTransformedBBox();
                if (bbox) {
                    boxes.push(bbox);
                }
            });
        }

        this.updateDirection();
        this.axisGroup.datum = this.getAxisTransform();
        this.updateSelections(tickData.ticks, {
            combinedRotation,
            textAlign,
            textBaseline,
            range: this.scale.range,
        });
        this.updateLabels();

        resetMotion([this.axisGroup], resetAxisGroupFn());
        resetMotion([this.tickLabelGroupSelection], resetAxisLabelSelectionFn());

        this.tickLabelGroup.visible = this.label.enabled;

        const bbox = BBox.merge(boxes);
        return this.getTransformBox(bbox);
    }

    private getTransformBox(bbox: BBox) {
        const matrix = new Matrix();
        const { rotation: axisRotation, translationX, translationY } = this.getAxisTransform();
        Matrix.updateTransformMatrix(matrix, 1, 1, axisRotation, translationX, translationY);
        return matrix.transformBBox(bbox);
    }

    setDomain(domain: number[]) {
        this.scale.domain = [...domain];
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
        parallelFlipRotation,
        regularFlipRotation,
        labelX,
        sideFlag,
    }: TickGenerationParams): TickGenerationResult {
        const { parallel, rotation } = this.label;
        const { step, values, minSpacing, maxSpacing } = this.interval;
        const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        const labelMatrix = new Matrix();
        const initialRotation = configuredRotation + defaultRotation;
        const { maxTickCount } = this.estimateTickCount({ minSpacing, maxSpacing });
        const maxIterations = isNaN(maxTickCount) ? 10 : maxTickCount;
        const font = TextMeasurer.toFontString(this.label);

        let tickData: TickData = {
            rawTicks: [],
            fractionDigits: 0,
            ticks: [],
        };

        let index = 0;
        let terminate = false;
        let labelOverlap = true;

        while (labelOverlap && index <= maxIterations && !terminate) {
            const { maxTickCount, minTickCount, defaultTickCount } = this.estimateTickCount({ minSpacing, maxSpacing });
            const maxIterations = isNaN(maxTickCount) ? 10 : maxTickCount;

            let tickCount = Math.max(defaultTickCount - index, minTickCount);

            const regenerateTicks = step == null && values == null && tickCount > minTickCount;

            for (let unchanged = true; unchanged && index <= maxIterations; index++) {
                const prevTicks = tickData.rawTicks;
                tickCount = Math.max(defaultTickCount - index, minTickCount);

                tickData = this.getTicks({
                    tickCount,
                    minTickCount,
                    maxTickCount,
                });

                unchanged = regenerateTicks ? areArrayNumbersEqual(tickData.rawTicks, prevTicks) : false;
            }

            terminate ||= step != null || values != null;

            labelOverlap = this.checkLabelOverlap(
                initialRotation,
                configuredRotation !== 0,
                labelMatrix,
                tickData.ticks,
                labelX,
                { font }
            );
        }

        const combinedRotation = defaultRotation + configuredRotation;
        const textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);
        const textBaseline = getTextBaseline(parallel, configuredRotation, sideFlag, parallelFlipFlag);

        return { tickData, combinedRotation, textBaseline, textAlign };
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
        const ticks: TickDatum[] = [];
        const rawTicks = this.createTicks(tickCount, minTickCount, maxTickCount);
        const fractionDigits = rawTicks.reduce((max, tick) => Math.max(max, countFractionDigits(tick)), 0);
        const idGenerator = createIdsGenerator();

        // When the scale domain or the ticks change, the label format may change
        this.labelFormatter = this.label.format
            ? this.scale.tickFormat({ ticks: rawTicks, specifier: this.label.format })
            : (x: unknown) => (typeof x === 'number' ? x.toFixed(fractionDigits) : String(x));

        for (let i = 0; i < rawTicks.length; i++) {
            const tick = rawTicks[i];
            const translationY = this.scale.convert(tick);

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (!this.inRange(translationY, 0.001)) continue;

            const tickLabel =
                this.label.formatter?.({ value: tick, index: i, fractionDigits }) ??
                this.labelFormatter?.(tick) ??
                String(tick);

            ticks.push({ tick, tickId: idGenerator(tickLabel), tickLabel, translationY: Math.floor(translationY) });
        }

        return { rawTicks, fractionDigits, ticks };
    }

    private createTicks(tickCount: number, minTickCount: number = 0, maxTickCount: number = Infinity) {
        if (tickCount) {
            this.scale.tickCount = tickCount;
            this.scale.minTickCount = minTickCount;
            this.scale.maxTickCount = maxTickCount;
        }
        return this.scale.ticks();
    }

    private estimateTickCount({ minSpacing, maxSpacing }: { minSpacing: number; maxSpacing: number }): {
        minTickCount: number;
        maxTickCount: number;
        defaultTickCount: number;
    } {
        const rangeWithBleed = round(findRangeExtent(this.range), 2);
        const defaultMinSpacing = Math.max(
            50, // defaultTickMinSpacing
            rangeWithBleed / 6 // defaultMaxTickCount
        );

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
        const clampMaxTickCount = !isNaN(maxSpacing) && minRectDistance < defaultMinSpacing;

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

    private getAxisTransform() {
        return {
            rotation: toRadians(this.rotation),
            translationX: Math.floor(this.translation.x),
            translationY: Math.floor(this.translation.y),
        };
    }

    private updateSelections(
        data: TickDatum[],
        params: {
            combinedRotation: number;
            textBaseline: CanvasTextBaseline;
            textAlign: CanvasTextAlign;
            range: number[];
        }
    ) {
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
