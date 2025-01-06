import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale, ScaleFormatParams, ScaleTickParams } from '../../scale/scale';
import { Matrix } from '../../scene/matrix';
import type { TextSizeProperties } from '../../scene/shape/text';
import { type PlacedLabelDatum, axisLabelsOverlap } from '../../scene/util/labelPlacement';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { arraysEqual } from '../../util/array';
import { countFractionDigits, findMinMax, findRangeExtent } from '../../util/number';
import { calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { createIdsGenerator } from '../../util/tempUtils';
import { CachedTextMeasurerPool, TextUtils } from '../../util/textMeasurer';
import { estimateTickCount } from '../../util/ticks';
import type { ChartAxis, ChartAxisLabelFlipFlag } from '../chartAxis';
import { calculateLabelRotation, createLabelData, getLabelSpacing, getTextAlign, getTextBaseline } from '../label';
import type { AxisInterval } from './axisInterval';
import type { TickInterval } from './axisTick';
import type { TickDatum } from './axisUtil';
import { NiceMode } from './axisUtil';

export interface TickData<D = any> {
    rawTicks: D[];
    rawVisibleTicks: D[];
    fractionDigits: number;
    ticks: TickDatum[];
    labelCount: number;
    niceDomain: D[];
}

export interface TickGenerationParams<D = any> {
    domain: D[];
    primaryTickCount: number | undefined;
    visibleRange: [number, number];
    niceMode: NiceMode;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    labelX: number;
    sideFlag: ChartAxisLabelFlipFlag;
}

export interface TickGenerationResult<D = any> {
    tickData: TickData<D>;
    primaryTickCount?: number;
    combinedRotation: number;
    textBaseline: CanvasTextBaseline;
    textAlign: CanvasTextAlign;
    labelData: PlacedLabelDatum[];
}

interface TickStrategyParams<D = any> {
    index: number;
    tickData: TickData<D>;
    textProps: TextSizeProperties;
    labelOverlap: boolean;
    terminate: boolean;
    primaryTickCount: number | undefined;
    visibleRange: [number, number];
}

interface TickStrategyResult<D = any> {
    index: number;
    tickData: TickData<D>;
    autoRotation: number;
    terminate: boolean;
}

type TickStrategy<D = any> = (params: TickStrategyParams<D>) => TickStrategyResult<D>;

enum TickGenerationType {
    CREATE,
    CREATE_SECONDARY,
    FILTER,
    VALUES,
}

export interface IAxis<S extends Scale<D, number, TickInterval<S>>, D> extends ChartAxis {
    interval: AxisInterval<S>;
    defaultTickMinSpacing: number;
    formatTick(value: any, index: number, fractionDigits?: number, formatter?: (datum: any) => string): string;
}

export class AxisTickGenerator<S extends Scale<D, number, TickInterval<S>>, D> {
    constructor(private readonly axis: IAxis<S, D>) {}

    private estimateTickCount(visibleRange: [number, number], minSpacing: number, maxSpacing: number) {
        return estimateTickCount(
            findRangeExtent(this.axis.range),
            findRangeExtent(visibleRange),
            minSpacing,
            maxSpacing,
            ContinuousScale.defaultTickCount,
            this.axis.defaultTickMinSpacing
        );
    }

    private filterTicks(ticks: any, tickCount: number): any[] {
        const { minSpacing, maxSpacing } = this.axis.interval;
        const tickSpacing = !isNaN(minSpacing) || !isNaN(maxSpacing);
        const keepEvery = tickSpacing ? Math.ceil(ticks.length / tickCount) : 2;
        return ticks.filter((_: any, i: number) => i % keepEvery === 0);
    }

    generateTicks({
        domain,
        primaryTickCount,
        visibleRange,
        niceMode,
        parallelFlipRotation,
        regularFlipRotation,
        labelX,
        sideFlag,
    }: TickGenerationParams<D>): TickGenerationResult<D> {
        const {
            scale,
            interval: { minSpacing, maxSpacing },
            label,
        } = this.axis;
        const { parallel, rotation, fontFamily, fontSize, fontStyle, fontWeight } = label;

        const secondaryAxis = primaryTickCount !== undefined;

        const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        const initialRotation = configuredRotation + defaultRotation;
        const labelMatrix = new Matrix();

        const { maxTickCount } = this.estimateTickCount(visibleRange, minSpacing, maxSpacing);

        const continuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        let textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);
        const textBaseline = getTextBaseline(parallel, configuredRotation, sideFlag, parallelFlipFlag);
        const font = TextUtils.toFontString({ fontFamily, fontSize, fontStyle, fontWeight });
        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font });

        const textProps: TextSizeProperties = {
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            textBaseline,
            textAlign,
        };

        let tickData: TickData = {
            ticks: [],
            rawTicks: [],
            rawVisibleTicks: [],
            fractionDigits: 0,
            labelCount: 0,
            niceDomain: null!,
        };

        let index = 0;
        let autoRotation = 0;
        let labelOverlap = true;
        let labelData: PlacedLabelDatum[] = [];
        let terminate = false;
        while (!terminate && labelOverlap && index <= maxIterations) {
            autoRotation = 0;
            textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);

            const tickStrategies = this.getTickStrategies({ domain, niceMode, secondaryAxis, index });

            for (const strategy of tickStrategies) {
                ({ tickData, index, autoRotation, terminate } = strategy({
                    index,
                    tickData,
                    textProps,
                    labelOverlap,
                    terminate,
                    primaryTickCount,
                    visibleRange,
                }));

                const rotated = configuredRotation !== 0 || autoRotation !== 0;
                const labelRotation = initialRotation + autoRotation;
                const labelSpacing = getLabelSpacing(label.minSpacing, rotated);
                Matrix.updateTransformMatrix(labelMatrix, 1, 1, labelRotation, 0, 0);

                textAlign = getTextAlign(parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
                labelData = createLabelData(tickData.ticks, labelX, labelMatrix, textMeasurer);
                labelOverlap = label.avoidCollisions && axisLabelsOverlap(labelData, labelSpacing);
            }
        }

        const combinedRotation = defaultRotation + configuredRotation + autoRotation;

        if (!secondaryAxis && tickData.rawTicks.length > 0) {
            primaryTickCount = tickData.rawTicks.length;
        }

        return { tickData, primaryTickCount, combinedRotation, textBaseline, textAlign, labelData };
    }

    private getTickStrategies({
        domain,
        niceMode,
        index: iteration,
        secondaryAxis,
    }: {
        domain: D[];
        niceMode: NiceMode;
        index: number;
        secondaryAxis: boolean;
    }): TickStrategy[] {
        const { scale, label, interval } = this.axis;
        const { minSpacing } = interval;
        const continuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const avoidLabelCollisions = label.enabled && label.avoidCollisions;
        const filterTicks = !continuous && iteration !== 0 && avoidLabelCollisions;
        const autoRotate = label.autoRotate === true && label.rotation === undefined;

        const strategies: TickStrategy[] = [];
        let tickGenerationType: TickGenerationType;
        if (interval.values) {
            tickGenerationType = TickGenerationType.VALUES;
        } else if (secondaryAxis) {
            tickGenerationType = TickGenerationType.CREATE_SECONDARY;
        } else if (filterTicks) {
            tickGenerationType = TickGenerationType.FILTER;
        } else {
            tickGenerationType = TickGenerationType.CREATE;
        }

        const tickGenerationStrategy = ({
            index,
            tickData,
            primaryTickCount,
            visibleRange,
            terminate,
        }: TickStrategyParams) =>
            this.createTickData(
                domain,
                niceMode,
                visibleRange,
                primaryTickCount,
                tickGenerationType,
                index,
                tickData,
                terminate
            );

        strategies.push(tickGenerationStrategy);

        if (!continuous && !isNaN(minSpacing)) {
            const tickFilterStrategy = ({
                index,
                tickData,
                primaryTickCount,
                visibleRange,
                terminate,
            }: TickStrategyParams) =>
                this.createTickData(
                    domain,
                    niceMode,
                    visibleRange,
                    primaryTickCount,
                    TickGenerationType.FILTER,
                    index,
                    tickData,
                    terminate
                );
            strategies.push(tickFilterStrategy);
        }

        if (avoidLabelCollisions && autoRotate) {
            const autoRotateStrategy = ({ index, tickData, labelOverlap, terminate }: TickStrategyParams) => ({
                index,
                tickData,
                autoRotation: labelOverlap ? normalizeAngle360(toRadians(label.autoRotateAngle ?? 0)) : 0,
                terminate,
            });
            strategies.push(autoRotateStrategy);
        }

        return strategies;
    }

    private createTickData(
        domain: D[],
        niceMode: NiceMode,
        visibleRange: [number, number],
        primaryTickCount: number | undefined,
        tickGenerationType: TickGenerationType,
        index: number,
        tickData: TickData,
        terminate: boolean
    ): TickStrategyResult {
        const { scale, interval } = this.axis;
        const { step, values, minSpacing, maxSpacing } = interval;
        const { maxTickCount, minTickCount, tickCount } = this.estimateTickCount(visibleRange, minSpacing, maxSpacing);

        const continuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        const countTicks = (i: number) => (continuous ? Math.max(tickCount - i, minTickCount) : maxTickCount);

        const regenerateTicks =
            step == null &&
            values == null &&
            countTicks(index) > minTickCount &&
            (continuous || tickGenerationType === TickGenerationType.FILTER);

        while (index <= maxIterations) {
            const previousTicks = tickData.rawTicks;

            tickData = this.getTicks({
                domain,
                niceMode,
                visibleRange,
                tickGenerationType,
                previousTicks,
                minTickCount,
                maxTickCount,
                primaryTickCount,
                tickCount: countTicks(index),
            });

            index++;

            if (!regenerateTicks || !arraysEqual(tickData.rawTicks, previousTicks)) break;
        }

        terminate ||= step != null || values != null;

        return { tickData, index, autoRotation: 0, terminate };
    }

    private getTicks({
        domain,
        niceMode,
        visibleRange,
        tickGenerationType,
        previousTicks,
        tickCount,
        minTickCount,
        maxTickCount,
        primaryTickCount,
    }: {
        domain: D[];
        niceMode: NiceMode;
        visibleRange: [number, number];
        tickGenerationType: TickGenerationType;
        previousTicks: TickDatum[];
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
        primaryTickCount?: number;
    }): TickData {
        const { axis } = this;
        const { range, scale, interval } = axis;
        const idGenerator = createIdsGenerator();

        const domainParams: ScaleTickParams<any> = {
            nice: niceMode === NiceMode.TickAndDomain,
            interval: interval.step,
            tickCount,
            minTickCount,
            maxTickCount,
        };

        const tickParams = {
            ...domainParams,
            nice: niceMode === NiceMode.TickAndDomain || niceMode === NiceMode.TicksOnly,
        };

        let niceDomain = niceMode === NiceMode.TickAndDomain ? scale.niceDomain(domainParams, domain) : domain;

        let rawTicks: any[];

        // @todo(xxx) - removing this references makes TS errors
        const scaleStopTsComplaining = scale;

        switch (tickGenerationType) {
            case TickGenerationType.VALUES:
                rawTicks = interval.values!;
                if (ContinuousScale.is(scaleStopTsComplaining)) {
                    const [d0, d1] = findMinMax(niceDomain.map(Number));
                    rawTicks = rawTicks
                        .filter((value) => Number(value) >= d0 && Number(value) <= d1)
                        .sort((a, b) => Number(a) - Number(b));
                }
                break;
            case TickGenerationType.CREATE_SECONDARY:
                if (ContinuousScale.is(scaleStopTsComplaining)) {
                    const secondaryAxisTicks = calculateNiceSecondaryAxis(
                        domain.map(Number),
                        primaryTickCount ?? 0,
                        axis.reverse
                    );

                    rawTicks = secondaryAxisTicks.ticks;
                    niceDomain = secondaryAxisTicks.domain.map((d) => scaleStopTsComplaining.toDomain(d));
                } else {
                    // AG-10654 Just use normal ticks for categorical axes.
                    rawTicks = scaleStopTsComplaining.ticks(tickParams, niceDomain) ?? [];
                }
                break;
            case TickGenerationType.FILTER:
                rawTicks = this.filterTicks(previousTicks, tickCount);
                break;
            default:
                rawTicks = scale.ticks(tickParams, niceDomain) ?? [];
                break;
        }

        const fractionDigits = rawTicks.reduce(
            (max, tick) => Math.max(max, typeof tick === 'number' ? countFractionDigits(tick) : 0),
            0
        );

        let labelCount = 0;

        // Only get the ticks within a sliding window of the visible range to improve performance
        const start = Math.max(0, Math.floor(visibleRange[0] * rawTicks.length));
        const end = Math.min(rawTicks.length, Math.ceil(visibleRange[1] * rawTicks.length));

        const rawVisibleTicks = rawTicks.slice(start, end);

        const formatParams: ScaleFormatParams<D> = {
            ticks: rawTicks,
            visibleTicks: rawVisibleTicks,
            fractionDigits,
            specifier: axis.label.format,
        };
        const labelFormatter = scale.tickFormatter(formatParams);

        // @todo(AG-13604) - the scale domain isn't updated yet. We need a better way to work out if something is in range.
        const scaleDomain = scale.domain;
        scale.domain = niceDomain;
        const halfBandwidth = (scale.bandwidth ?? 0) / 2;
        const ticks: TickDatum[] = [];
        for (let i = 0; i < rawVisibleTicks.length; i++) {
            const tick = rawVisibleTicks[i];
            const translationY = scale.convert(tick) + halfBandwidth;

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !axis.inRange(translationY, 0.001)) continue;

            const tickLabel = axis.formatTick(tick, start + i, fractionDigits, labelFormatter);

            // Create a tick id from the label, or as an increment of the last label if this tick label is blank
            ticks.push({ tick, tickId: idGenerator(tickLabel), tickLabel, translationY: Math.floor(translationY) });

            if (tickLabel === '' || tickLabel == null) {
                continue;
            }
            labelCount++;
        }
        scale.domain = scaleDomain;

        return {
            rawTicks,
            rawVisibleTicks,
            fractionDigits,
            ticks,
            labelCount,
            niceDomain,
        };
    }
}
