import { type BoxBounds, boxCollides, countFractionDigits, dropFirstWhile, dropLastWhile } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle } from 'ag-charts-types';

import { BandScale } from '../../scale/bandScale';
import { CategoryScale } from '../../scale/categoryScale';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { type Scale, ScaleAlignment, type ScaleTickParams } from '../../scale/scale';
import { TimeScale } from '../../scale/timeScale';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { Matrix } from '../../scene/matrix';
import { type PlacedLabelDatum } from '../../scene/util/labelPlacement';
import { normalizeAngle360FromDegrees } from '../../util/angle';
import { compareDates } from '../../util/date';
import { findMinMax, findRangeExtent } from '../../util/number';
import { type AxisPrimaryTickCount, calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { createIdsGenerator } from '../../util/tempUtils';
import { CachedTextMeasurerPool } from '../../util/textMeasurer';
import { TextWrapper, type WrapOptions } from '../../util/textWrapper';
import { estimateTickCount, getTickTimeInterval } from '../../util/ticks';
import {
    intervalCeil,
    intervalExtent,
    intervalFloor,
    intervalHierarchy,
    intervalMilliseconds,
    intervalNext,
    intervalPrevious,
    intervalRange,
    intervalUnit,
} from '../../util/time';
import type { ChartAxis, ChartAxisLabelFlipFlag } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import {
    calculateLabelRotation,
    createFixedLabelData,
    createLabelData,
    getLabelSpacing,
    getTextAlign,
    getTextBaseline,
    timeIntervalMaxLabelSize,
} from '../label';
import type { AxisInterval } from './axisInterval';
import type { TickInterval } from './axisTick';
import { NiceMode, type TickDatum } from './axisUtil';

export type AnyTimeInterval = AgTimeInterval | AgTimeIntervalUnit;

export interface TickData<D = any> {
    tickDomain: D[];
    rawTicks: D[];
    rawTickCount: number | undefined;
    fractionDigits: number;
    ticks: TickDatum[];
    timeInterval: AnyTimeInterval | undefined;
    niceDomain?: D[];
}

export interface TickGenerationParams<D = any> {
    range: [number, number];
    domain: D[];
    reverse: boolean;
    defaultTickMinSpacing: number;
    primaryTickCount: AxisPrimaryTickCount | undefined;
    visibleRange: [number, number];
    niceMode: NiceMode;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    labelX: number;
    sideFlag: ChartAxisLabelFlipFlag;
    sizeLimit?: number;
    removeOverflowLabels: boolean;
    removeOverflowThreshold?: number;
}

export interface TickGenerationResult<D = any> {
    tickData: TickData<D>;
    rotation: number;
    textBaseline: CanvasTextBaseline;
    textAlign: CanvasTextAlign;
}

interface TickStrategyParams<D = any> {
    readonly index: number;
    readonly tickData: TickData<D>;
    readonly terminate: boolean;
    readonly primaryTickCount: AxisPrimaryTickCount | undefined;
    readonly defaultTickMinSpacing: number;
    readonly visibleRange: [number, number];
    labelsOverlap(this: void): boolean;
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
    // FILTER,
    VALUES,
}

enum ParentLevelMode {
    TimeScaleTicks,
    OrdinalStepTicks,
    ScaleTicks,
}

const DENSE_TICK_COUNT = 18;
// Multiples of 2 & 3
const TICK_STEP_VALUES = [1, 2, 3, 4, 6, 8, 9, 10, 12];

export interface TickGenerationAxis<S extends Scale<D, number, TickInterval<S>>, D> {
    readonly scale: S;
    readonly label: ChartAxis['label'];
    readonly primaryLabel?: ChartAxis['label'];
    readonly interval: AxisInterval<S>;
    readonly inRange: ChartAxis['inRange'];
    readonly direction?: ChartAxis['direction'];
    readonly minimumTimeGranularity?: ChartAxis['minimumTimeGranularity'];
    tickFormatter(
        domain: D[],
        ticks: D[],
        primary: boolean,
        fractionDigits: number | undefined,
        // eslint-disable-next-line sonarjs/use-type-alias
        timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined,
        dateStyle: DateFormatterStyle
    ): (value: any, index: number) => string | undefined;
}

const sunday = new Date(1970, 0, 4);

export class AxisTickGenerator<S extends Scale<D, number, TickInterval<S>>, D> {
    constructor(private readonly axis: TickGenerationAxis<S, D>) {}

    private estimateTickCount(
        range: [number, number],
        visibleRange: [number, number],
        defaultTickMinSpacing: number,
        minSpacing?: number,
        maxSpacing?: number
    ) {
        const { scale, label } = this.axis;
        const { defaultTickCount } = scale;

        const rangeExtent = findRangeExtent(range);
        const zoomExtent = findRangeExtent(visibleRange);

        if (CategoryScale.is(scale)) {
            const maxTickCount = scale.bands.length;
            let estimatedTickCount = Math.ceil(rangeExtent / (zoomExtent * label.fontSize));
            estimatedTickCount = Math.min(estimatedTickCount, maxTickCount);
            return {
                minTickCount: 0,
                maxTickCount,
                tickCount: estimatedTickCount,
            };
        }

        return estimateTickCount(
            rangeExtent,
            zoomExtent,
            minSpacing,
            maxSpacing,
            defaultTickCount,
            defaultTickMinSpacing
        );
    }

    generateTicks({
        range,
        domain,
        reverse,
        primaryTickCount,
        defaultTickMinSpacing,
        visibleRange,
        niceMode,
        parallelFlipRotation,
        regularFlipRotation,
        labelX,
        sideFlag,
        removeOverflowLabels,
        removeOverflowThreshold = 0,
        sizeLimit,
    }: TickGenerationParams<D>): TickGenerationResult<D> {
        const {
            label,
            primaryLabel,
            interval: { minSpacing, maxSpacing },
        } = this.axis;
        const { parallel, fontFamily, fontSize, fontStyle, fontWeight } = label;

        const secondaryAxis = primaryTickCount !== undefined;

        const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation(
            label.rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation
        );

        const { maxTickCount } = this.estimateTickCount(
            range,
            visibleRange,
            defaultTickMinSpacing,
            minSpacing,
            maxSpacing
        );

        const maxIterations = Number.isFinite(maxTickCount) ? maxTickCount : 10;

        const textBaseline = getTextBaseline(parallel, configuredRotation, sideFlag, parallelFlipFlag);
        const font = { fontFamily, fontSize, fontStyle, fontWeight };
        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font });
        const checkLabelOverlap = label.enabled && label.avoidCollisions;

        const initialRotation = configuredRotation + defaultRotation;
        const labelMatrix = new Matrix();
        const updateLabelMatrix = (iterationRotation: number) => {
            const labelRotation = initialRotation + iterationRotation;
            Matrix.updateTransformMatrix(labelMatrix, 1, 1, labelRotation, 0, 0);
        };

        const getLabelData = ({ ticks }: TickData, iterationRotation: number) => {
            updateLabelMatrix(iterationRotation);
            return createLabelData(ticks, labelX, labelMatrix, textMeasurer);
        };

        const getTimeLabelData = (tickData: TickData, iterationRotation: number) => {
            const { niceDomain, ticks, timeInterval } = tickData;
            if (timeInterval == null) return [];

            updateLabelMatrix(iterationRotation);

            const spacing = ticksSpacing(ticks);
            const { width, height } = timeIntervalMaxLabelSize(
                label,
                primaryLabel,
                niceDomain ?? domain,
                timeInterval,
                textMeasurer
            );

            return createFixedLabelData({ width, height, spacing }, labelX, labelMatrix);
        };

        const getLabelOverlap = (tickData: TickData, iterationRotation: number) => {
            if (!checkLabelOverlap) return false;

            const rotated = configuredRotation !== 0 || iterationRotation !== 0;
            const labelSpacing = getLabelSpacing(label.minSpacing, rotated);

            return (
                axisLabelsOverlap(getTimeLabelData(tickData, iterationRotation), labelSpacing) ||
                axisLabelsOverlap(getLabelData(tickData, iterationRotation), labelSpacing)
            );
        };

        let tickData: TickData = {
            tickDomain: [],
            ticks: [],
            rawTicks: [],
            rawTickCount: undefined,
            timeInterval: undefined,
            fractionDigits: 0,
            niceDomain: undefined,
        };

        let index = 0;
        let autoRotation = 0;
        let labelOverlap = true;
        let terminate = false;
        while (!terminate && labelOverlap && index <= maxIterations) {
            autoRotation = 0;

            for (const strategy of this.getTickStrategies({
                domain,
                range,
                reverse,
                niceMode,
                secondaryAxis,
                sizeLimit,
            })) {
                ({ tickData, index, autoRotation, terminate } = strategy({
                    index,
                    tickData,
                    terminate,
                    primaryTickCount,
                    defaultTickMinSpacing,
                    visibleRange,
                    labelsOverlap() {
                        return getLabelOverlap(tickData, autoRotation);
                    },
                }));
            }

            labelOverlap = getLabelOverlap(tickData, autoRotation);
        }

        const textAlign = getTextAlign(parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
        const rotation = configuredRotation + autoRotation;

        if (removeOverflowLabels && tickData.ticks.length > 2) {
            const labelData = getLabelData(tickData, autoRotation);
            const lastTick = tickData.ticks.at(-1);
            const lastLabel = labelData.at(-1);
            if (
                lastTick != null &&
                lastLabel != null &&
                lastTick.translation + lastLabel.label.width / 2 > range[1] + removeOverflowThreshold
            ) {
                lastTick.tickLabel = undefined;

                const firstTick = tickData.ticks[0];
                if (firstTick.translation === 0 && visibleRange[0] === 0 && visibleRange[1] === 1) {
                    firstTick.tickLabel = undefined;
                }
            }
        }

        return { tickData, rotation, textBaseline, textAlign };
    }

    private getTickStrategies({
        domain,
        range,
        reverse,
        niceMode,
        secondaryAxis,
        sizeLimit,
    }: {
        domain: D[];
        range: [number, number];
        reverse: boolean;
        niceMode: NiceMode;
        secondaryAxis: boolean;
        sizeLimit?: number;
    }): TickStrategy[] {
        const { label, interval } = this.axis;
        const avoidLabelCollisions = label.enabled && label.avoidCollisions;
        const autoRotate = label.autoRotate === true && label.rotation === undefined;

        const strategies: TickStrategy[] = [];
        let tickGenerationType: TickGenerationType;
        if (interval.values) {
            tickGenerationType = TickGenerationType.VALUES;
        } else if (secondaryAxis) {
            tickGenerationType = TickGenerationType.CREATE_SECONDARY;
        } else {
            tickGenerationType = TickGenerationType.CREATE;
        }

        const tickGenerationStrategy = ({
            index,
            tickData,
            primaryTickCount,
            defaultTickMinSpacing,
            visibleRange,
            terminate,
        }: TickStrategyParams) =>
            this.createTickData(
                domain,
                range,
                reverse,
                niceMode,
                visibleRange,
                primaryTickCount,
                defaultTickMinSpacing,
                tickGenerationType,
                index,
                tickData,
                terminate,
                sizeLimit
            );

        strategies.push(tickGenerationStrategy);

        if (avoidLabelCollisions && autoRotate) {
            const autoRotateStrategy = ({ index, tickData, labelsOverlap, terminate }: TickStrategyParams) => ({
                index,
                tickData,
                autoRotation: labelsOverlap() ? normalizeAngle360FromDegrees(label.autoRotateAngle) : 0,
                terminate,
            });
            strategies.push(autoRotateStrategy);
        }

        return strategies;
    }

    private createTickData(
        domain: D[],
        range: [number, number],
        reverse: boolean,
        niceMode: NiceMode,
        visibleRange: [number, number],
        primaryTickCount: AxisPrimaryTickCount | undefined,
        defaultTickMinSpacing: number,
        tickGenerationType: TickGenerationType,
        index: number,
        tickData: TickData,
        terminate: boolean,
        sizeLimit?: number
    ): TickStrategyResult {
        // Find the next tick data where the tick data is different from the previous tick data - and return the index of this data
        const { interval } = this.axis;
        // const { scale, interval } = this.axis;
        const { step, values, minSpacing, maxSpacing } = interval;
        const { maxTickCount, minTickCount, tickCount } = this.estimateTickCount(
            range,
            visibleRange,
            defaultTickMinSpacing,
            minSpacing,
            maxSpacing
        );

        // const continuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
        // const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        // const countTicks = (i: number) => (continuous ? Math.max(tickCount - i, minTickCount) : maxTickCount);

        const maxIterations = tickCount - minTickCount;
        const countTicks = (i: number) => Math.max(tickCount - i, minTickCount);

        const previousTicks = tickData.rawTicks;

        // const regenerateTicks =
        //     step == null &&
        //     values == null &&
        //     countTicks(index) > minTickCount &&
        //     (continuous || tickGenerationType === TickGenerationType.FILTER);

        const regenerateTicks = step == null && values == null && countTicks(index) > minTickCount;

        const getTickParams = {
            domain,
            range,
            reverse,
            niceMode,
            visibleRange,
            primaryTickCount,
            tickGenerationType,
            previousTicks,
            minTickCount,
            maxTickCount,
            tickCount: 0,
            sizeLimit,
        };

        // First guess - generate ticks at current index
        getTickParams.tickCount = countTicks(index);
        tickData = this.getTicks(getTickParams);

        if (regenerateTicks && ticksEqual(tickData.rawTicks, previousTicks)) {
            // Ticks didn't change
            // Use binary search to find the index, as there could be a lot of ticks in some cases
            let lowerBound = index;
            let upperBound = maxIterations;
            while (lowerBound <= upperBound) {
                index = ((lowerBound + upperBound) / 2) | 0;
                getTickParams.tickCount = countTicks(index);
                const nextTickData = this.getTicks(getTickParams);

                if (ticksEqual(nextTickData.rawTicks, previousTicks)) {
                    lowerBound = index + 1;
                } else {
                    tickData = nextTickData;
                    upperBound = index - 1;
                }
            }
        }

        index += 1;
        terminate ||= step != null || values != null;

        return { tickData, index, autoRotation: 0, terminate };
    }

    private getTimeIntervalTicks(
        visibleRange: [number, number],
        tickCount: number,
        maxTickCount: number,
        tickParams: Readonly<ScaleTickParams<any>>,
        timeInterval: AgTimeInterval | AgTimeIntervalUnit,
        reverse: boolean
    ) {
        const parentInterval = intervalHierarchy(timeInterval);
        if (parentInterval == null) return;

        const { scale } = this.axis;
        if (!TimeScale.is(scale) && !DiscreteTimeScale.is(scale)) return;

        if (reverse) {
            visibleRange = [1 - visibleRange[1], 1 - visibleRange[0]];
        }

        const dv0 = Math.min(scale.domain[0].valueOf(), scale.domain[scale.domain.length - 1].valueOf());
        const dv1 = Math.max(scale.domain[0].valueOf(), scale.domain[scale.domain.length - 1].valueOf());

        // Generate at least one tick outside the range on each side
        let [dp0, dp1] = intervalExtent(new Date(dv0), new Date(dv1), visibleRange);
        dp0 = intervalFloor(parentInterval, dp0);
        if (dp0.valueOf() >= dv0) dp0 = intervalPrevious(parentInterval, dp0);
        dp1 = intervalCeil(parentInterval, dp1);
        if (dp1.valueOf() <= dv1) dp1 = intervalNext(parentInterval, dp1);
        const primaryTicks = intervalRange(parentInterval, dp0, dp1);

        const milliseconds = intervalMilliseconds(timeInterval);

        let primaryTicksIndices: Set<number> | undefined = new Set<number>();
        const skipFirstPrimaryTick = OrdinalTimeScale.is(scale);
        const ticks = [];
        const intervalTickParams = {
            ...tickParams,
            interval: timeInterval,
        };
        let parentLevelMode: ParentLevelMode;
        let alignment: ScaleAlignment | undefined;
        let ordinalTickStep = 0;
        if (OrdinalTimeScale.is(scale)) {
            const minimumTimeGranularity = this.axis.minimumTimeGranularity;
            const timeIntervalGranularity = intervalUnit(timeInterval);
            parentLevelMode =
                minimumTimeGranularity != null &&
                intervalMilliseconds(minimumTimeGranularity) >= intervalMilliseconds(timeIntervalGranularity)
                    ? ParentLevelMode.OrdinalStepTicks
                    : ParentLevelMode.ScaleTicks;
            alignment = ScaleAlignment.Trailing;

            // The tick algorithm will try lower tick counts when labels don't fit
            // The tick count doesn't match exactly what we do here - so we just use it as a guideline
            const tickDensity = tickCount / maxTickCount;
            const baseTickStep = scale.bandCount(visibleRange) / (tickDensity * DENSE_TICK_COUNT);
            ordinalTickStep = TICK_STEP_VALUES.findLast((t) => baseTickStep >= t) ?? 1;
        } else if (
            UnitTimeScale.is(scale) &&
            (scale.interval == null || intervalMilliseconds(scale.interval) >= milliseconds)
        ) {
            parentLevelMode = ParentLevelMode.ScaleTicks;
        } else {
            parentLevelMode = ParentLevelMode.TimeScaleTicks;
            alignment = ScaleAlignment.Interpolate;
        }

        for (let i = 0; i < primaryTicks.length - 1; i += 1) {
            const p0 = primaryTicks[i];
            const p1 = primaryTicks[i + 1];

            const first = i === 0;
            const last = i === primaryTicks.length - 2;

            const dp = p1.valueOf() - p0.valueOf();
            const pVisibleRange: [number, number] = [
                Math.max((dv0 - p0.valueOf()) / dp, 0),
                Math.min((dv1 - p0.valueOf()) / dp, 1),
            ];

            let intervalTicks: Date[];
            switch (parentLevelMode) {
                case ParentLevelMode.TimeScaleTicks:
                    intervalTicks = createTimeScaleTicks(intervalTickParams.interval, [p0, p1], pVisibleRange, true);
                    break;
                case ParentLevelMode.ScaleTicks:
                    intervalTicks =
                        scale.ticks(intervalTickParams, [p0, p1], pVisibleRange, { extend: true, dropInitial: true })
                            ?.ticks ?? [];
                    break;
                case ParentLevelMode.OrdinalStepTicks:
                    intervalTicks = (scale as any as OrdinalTimeScale).stepTicks(
                        ordinalTickStep,
                        [p0, p1],
                        undefined,
                        !last
                    );
                    break;
            }

            dropFirstWhile(intervalTicks, (firstTick) => firstTick.valueOf() < p0.valueOf());

            if (!last) {
                dropLastWhile(intervalTicks, (lastTick) => {
                    if (parentLevelMode === ParentLevelMode.TimeScaleTicks) {
                        return lastTick.valueOf() + milliseconds > p1.valueOf();
                    } else {
                        return lastTick.valueOf() >= p1.valueOf();
                    }
                });
            }

            if (intervalTicks.length === 0) continue;

            const firstTick = intervalTicks[0];
            const firstTickDiff = compareDates(firstTick, p0);
            const firstPrimary =
                parentLevelMode === ParentLevelMode.TimeScaleTicks
                    ? firstTickDiff === 0
                    : firstTickDiff <= milliseconds;

            if (firstPrimary && (!skipFirstPrimaryTick || !first)) {
                primaryTicksIndices.add(ticks.length);
            }

            ticks.push(...intervalTicks);
        }

        if (
            primaryTicksIndices.size === 0 ||
            // If there's only one primary tick and it's the first tick, don't show primary ticks
            (primaryTicksIndices.size === 1 && primaryTicksIndices.has(0))
        ) {
            primaryTicksIndices = undefined;
        }

        return { ticks, tickCount: undefined, primaryTicksIndices, alignment };
    }

    private getTicks({
        domain,
        range,
        reverse,
        niceMode,
        visibleRange,
        tickGenerationType,
        // previousTicks,
        tickCount,
        minTickCount,
        maxTickCount,
        primaryTickCount,
        sizeLimit = Infinity,
    }: {
        domain: D[];
        range: [number, number];
        reverse: boolean;
        niceMode: NiceMode;
        visibleRange: [number, number];
        tickGenerationType: TickGenerationType;
        primaryTickCount: AxisPrimaryTickCount | undefined;
        previousTicks: TickDatum[];
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
        sizeLimit?: number;
    }): TickData {
        const { axis } = this;
        const { label, primaryLabel, scale, interval } = axis;

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

        let secondaryAxisTicks: { domain: D[]; ticks: number[] } | undefined;
        if (
            tickGenerationType === TickGenerationType.CREATE_SECONDARY &&
            primaryTickCount != null &&
            ContinuousScale.is(scale)
        ) {
            // AG-10654 Just use normal ticks for categorical axes.
            secondaryAxisTicks = calculateNiceSecondaryAxis(scale, domain, primaryTickCount, reverse, visibleRange);
        }

        const niceDomain =
            niceMode === NiceMode.TickAndDomain
                ? secondaryAxisTicks?.domain ?? scale.niceDomain(domainParams, domain)
                : domain;
        let tickDomain: D[] = niceDomain;
        let rawTicks: any[] | undefined;
        let rawTickCount: number | undefined;
        let timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined;
        let primaryTicksIndices: Set<number> | undefined;
        let alignment: ScaleAlignment | undefined;

        const generatePrimaryTicks = primaryLabel?.enabled === true && tickParams.interval == null;

        const scaleDomain = scale.domain;
        scale.domain = niceDomain; // Reset at end of function

        switch (tickGenerationType) {
            case TickGenerationType.VALUES:
                tickDomain = interval.values!;
                rawTicks = interval.values!;
                rawTickCount = rawTicks.length;
                if (OrdinalTimeScale.is(scale)) {
                    alignment = ScaleAlignment.Trailing;
                } else if (UnitTimeScale.is(scale)) {
                    alignment = ScaleAlignment.Interpolate;
                }
                if (ContinuousScale.is(scale)) {
                    const [d0, d1] = findMinMax(niceDomain.map(Number));
                    rawTicks = rawTicks
                        .filter((value) => Number(value) >= d0 && Number(value) <= d1)
                        .sort((a, b) => Number(a) - Number(b));
                }
                break;

            case TickGenerationType.CREATE_SECONDARY:
                if (secondaryAxisTicks) {
                    rawTicks = secondaryAxisTicks.ticks;
                    rawTickCount = secondaryAxisTicks.ticks.length; // Visible range isn't used (yet)
                } else {
                    const tickGeneration = scale.ticks(tickParams, niceDomain, visibleRange);
                    rawTicks = tickGeneration?.ticks ?? [];
                    rawTickCount = tickGeneration?.count;
                }
                break;

            // case TickGenerationType.FILTER:
            //     rawTicks = this.filterTicks(previousTicks, tickCount);
            //     rawTickCount = undefined; // AG-10654 Filter ticks is only done for category axes, so we can ignore this
            //     break;

            default: {
                if (
                    niceDomain.length > 0 &&
                    tickParams.interval == null &&
                    (UnitTimeScale.is(scale) ||
                        (generatePrimaryTicks && (TimeScale.is(scale) || OrdinalTimeScale.is(scale))))
                ) {
                    const dates = niceDomain as (Date | number)[];
                    const start = Math.min(dates[0].valueOf(), dates[dates.length - 1].valueOf());
                    const end = Math.max(dates[0].valueOf(), dates[dates.length - 1].valueOf());
                    timeInterval = getTickTimeInterval(start, end, tickCount, minTickCount, maxTickCount, {
                        weekStart: primaryLabel == null ? sunday : undefined,
                        primaryOnly: true,
                    });
                }

                let minTimeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined;
                if (OrdinalTimeScale.is(scale)) {
                    minTimeInterval = axis.minimumTimeGranularity;
                } else if (UnitTimeScale.is(scale)) {
                    minTimeInterval = scale.interval;
                }
                if (
                    minTimeInterval != null &&
                    timeInterval != null &&
                    // Prefer UnitTimeAxis.unit over this interval, because the user may have defined an epoch
                    intervalMilliseconds(minTimeInterval) >= intervalMilliseconds(timeInterval)
                ) {
                    timeInterval = minTimeInterval;
                }

                const intervalTicks = timeInterval
                    ? this.getTimeIntervalTicks(
                          visibleRange,
                          tickCount,
                          maxTickCount,
                          tickParams,
                          timeInterval,
                          reverse
                      )
                    : undefined;
                if (intervalTicks) {
                    ({ ticks: rawTicks, tickCount: rawTickCount, primaryTicksIndices, alignment } = intervalTicks);
                } else {
                    const intervalTickParams =
                        UnitTimeScale.is(scale) && tickParams.interval == null && timeInterval != null
                            ? { ...tickParams, interval: timeInterval }
                            : tickParams;
                    const tickGeneration = scale.ticks(intervalTickParams, niceDomain, visibleRange);

                    rawTicks = tickGeneration?.ticks ?? [];
                    rawTickCount = tickGeneration?.count;
                    if (TimeScale.is(scale) || DiscreteTimeScale.is(scale)) {
                        timeInterval ??= tickParams.interval ?? tickGeneration?.timeInterval;
                    }
                }
            }
        }

        const fractionDigits = rawTicks.reduce(
            (max, tick) => Math.max(max, typeof tick === 'number' ? countFractionDigits(tick) : 0),
            0
        );

        if (!generatePrimaryTicks) {
            primaryTicksIndices = undefined;
        }

        const dateStyle: DateFormatterStyle = generatePrimaryTicks ? 'component' : 'long';
        const axisTickFormatter = label.enabled
            ? axis.tickFormatter(niceDomain, rawTicks, false, fractionDigits, timeInterval, dateStyle)
            : undefined;
        const parentInterval = timeInterval != null ? intervalHierarchy(timeInterval) : undefined;
        const axisPrimaryTickFormatter = generatePrimaryTicks
            ? axis.tickFormatter(niceDomain, rawTicks, true, fractionDigits, parentInterval, dateStyle)
            : undefined;

        const halfBandwidth = (scale.bandwidth ?? 0) / 2;
        const ticks: TickDatum[] = [];
        const continuous = TimeScale.is(scale) || DiscreteTimeScale.is(scale);
        const idGenerator = createIdsGenerator();
        const isVertical = axis.direction === ChartAxisDirection.Y;
        const maxBand = (BandScale.is(scale) ? scale.bandwidth : null) ?? Infinity;
        const wrapOptions: WrapOptions = {
            font: label,
            maxWidth: isVertical ? sizeLimit : maxBand,
            maxHeight: isVertical ? maxBand : sizeLimit,
            overflow: label.truncate ? 'ellipsis' : 'hide',
            textWrap: label.wrapping,
        };

        for (let i = 0; i < rawTicks.length; i++) {
            const tick = rawTicks[i];
            const translation = scale.convert(tick, { alignment }) + halfBandwidth;

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !axis.inRange(translation, 0.001)) continue;

            const primary = primaryTicksIndices?.has(i) ?? false;
            let tickLabel = primary ? axisPrimaryTickFormatter?.(tick, i) : axisTickFormatter?.(tick, i);

            if (label.avoidCollisions) {
                tickLabel = TextWrapper.wrapText(tickLabel ?? String(tick), wrapOptions) || tickLabel;
            }

            let tickId: string;
            const continuousValue = continuous ? tick?.valueOf() : undefined;
            if (Number.isFinite(continuousValue)) {
                tickId = idGenerator(`v:${continuousValue}`);
            } else {
                tickId = idGenerator(`l:${tickLabel}`);
            }

            // Create a tick id from the label, or as an increment of the last label if this tick label is blank
            ticks.push({
                tick,
                tickId,
                tickLabel,
                translation: Math.floor(translation),
                primary,
            });
        }

        scale.domain = scaleDomain;

        return {
            tickDomain,
            rawTicks,
            rawTickCount,
            fractionDigits,
            timeInterval,
            ticks,
            niceDomain,
        };
    }
}

function axisLabelsOverlap(data: readonly PlacedLabelDatum[], padding: number = 0): boolean {
    const result: BoxBounds[] = [];

    for (const datum of data) {
        const { x, y } = datum.point;
        let { width, height } = datum.label;

        width += padding;
        height += padding;

        if (result.some((l) => boxCollides(l, x, y, width, height))) {
            return true;
        }

        result.push({ x, y, width, height });
    }

    return false;
}

function createTimeScaleTicks(
    interval: AgTimeInterval | AgTimeIntervalUnit | number,
    domain: [Date, Date],
    visibleRange?: [number, number],
    extend?: boolean
) {
    if (interval == null) {
        return domain;
    }

    const d0 = domain[0].valueOf();
    const d1 = domain[1].valueOf();

    if (typeof interval !== 'number') {
        const epoch = domain[0];
        const alignedInterval: AgTimeInterval =
            typeof interval === 'string' ? { unit: interval, epoch } : { ...interval, epoch };
        return intervalRange(alignedInterval, domain[0], domain[1], { visibleRange, extend });
    }

    const ticks: Date[] = [];
    for (let intervalTickTime = d0; intervalTickTime <= d1; intervalTickTime += interval) {
        ticks.push(new Date(intervalTickTime));
    }

    return ticks;
}

function ticksEqual(a: unknown[], b: unknown[]) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i += 1) {
        if (a[i]?.valueOf() !== b[i]?.valueOf()) {
            return false;
        }
    }
    return true;
}

function ticksSpacing(ticks: TickDatum[]) {
    if (ticks.length < 2) return Infinity;

    let spacing = 0;
    let y0 = ticks[0].translation;
    for (let i = 1; i < ticks.length; i++) {
        const y1 = ticks[i].translation;
        const delta = Math.abs(y1 - y0);
        spacing = Math.max(spacing, delta);
        y0 = y1;
    }
    return spacing;
}
