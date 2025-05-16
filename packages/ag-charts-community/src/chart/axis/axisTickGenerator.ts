import { countFractionDigits, dropFirstWhile, dropLastWhile } from 'ag-charts-core';
import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { ContinuousScale } from '../../scale/continuousScale';
import { ContinuousTimeScale } from '../../scale/continuousTimeScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale, ScaleFormatParams, ScaleTickParams } from '../../scale/scale';
import { TimeScale } from '../../scale/timeScale';
import { Matrix } from '../../scene/matrix';
import type { TextSizeProperties } from '../../scene/shape/text';
import { axisLabelsOverlap } from '../../scene/util/labelPlacement';
import { normalizeAngle360FromDegrees } from '../../util/angle';
import { compareDates } from '../../util/date';
import { findMinMax, findRangeExtent } from '../../util/number';
import { type AxisPrimaryTickCount, calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { createIdsGenerator } from '../../util/tempUtils';
import { CachedTextMeasurerPool } from '../../util/textMeasurer';
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
} from '../../util/time';
import type { ChartAxis, ChartAxisLabelFlipFlag } from '../chartAxis';
import {
    calculateLabelRotation,
    createFixedLabelData,
    createLabelData,
    getLabelSpacing,
    getTextAlign,
    getTextBaseline,
    labelSpecifier,
    timeIntervalMaxLabelSize,
} from '../label';
import type { AxisInterval } from './axisInterval';
import type { TickInterval } from './axisTick';
import { NiceMode, type TickDatum } from './axisUtil';

export interface TickData<D = any> {
    tickDomain: D[];
    rawTicks: D[];
    rawTickCount: number | undefined;
    fractionDigits: number;
    ticks: TickDatum[];
    timeInterval: TimeInterval | TimeIntervalUnit | undefined;
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
    readonly textProps: TextSizeProperties;
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
    FILTER,
    VALUES,
}

export interface TickGenerationAxis<S extends Scale<D, number, TickInterval<S>>, D> {
    readonly scale: S;
    readonly label: ChartAxis['label'];
    readonly primaryLabel?: ChartAxis['label'];
    readonly interval: AxisInterval<S>;
    readonly inRange: ChartAxis['inRange'];
    formatTick(
        value: any,
        index: number,
        domain: D[],
        fractionDigits?: number,
        timeInterval?: TimeInterval | TimeIntervalUnit,
        formatter?: (datum: any) => string
    ): string;
}

const sunday = new Date(1970, 0, 4);

function ticksSpacing(ticks: TickDatum[]) {
    if (ticks.length < 2) return Infinity;

    let spacing = 0;
    let y0 = ticks[0].translationY;
    for (let i = 1; i < ticks.length; i++) {
        const y1 = ticks[i].translationY;
        const delta = Math.abs(y1 - y0);
        spacing = Math.max(spacing, delta);
        y0 = y1;
    }
    return spacing;
}

export class AxisTickGenerator<S extends Scale<D, number, TickInterval<S>>, D> {
    constructor(private readonly axis: TickGenerationAxis<S, D>) {}

    private estimateTickCount(
        range: [number, number],
        visibleRange: [number, number],
        defaultTickMinSpacing: number,
        minSpacing?: number,
        maxSpacing?: number
    ) {
        const { scale } = this.axis;
        const defaultTickCount = TimeScale.is(scale) ? TimeScale.defaultTickCount : ContinuousScale.defaultTickCount;
        return estimateTickCount(
            findRangeExtent(range),
            findRangeExtent(visibleRange),
            minSpacing,
            maxSpacing,
            defaultTickCount,
            defaultTickMinSpacing
        );
    }

    private filterTicks(ticks: any[], tickCount: number): any[] {
        const { minSpacing, maxSpacing } = this.axis.interval;
        const tickSpacing = minSpacing != null || maxSpacing != null;
        const keepEvery = tickSpacing ? Math.ceil(ticks.length / tickCount) : 2;
        const offset = ticks.length % keepEvery ? -1 : 0;
        return ticks.filter((_, i) => (i + offset) % keepEvery === 0);
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
    }: TickGenerationParams<D>): TickGenerationResult<D> {
        const {
            scale,
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

        const continuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        let textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);
        const textBaseline = getTextBaseline(
            parallel,
            configuredRotation,
            sideFlag,
            parallelFlipFlag,
            primaryLabel == null
        );
        const font = { fontFamily, fontSize, fontStyle, fontWeight };
        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font });

        const textProps: TextSizeProperties = {
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            textBaseline,
            textAlign,
        };

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
            const { niceDomain, ticks, rawTicks, timeInterval } = tickData;
            if (timeInterval == null) return [];

            updateLabelMatrix(iterationRotation);

            const spacing = ticksSpacing(ticks);
            const { width, height } = timeIntervalMaxLabelSize(
                scale as any,
                label,
                primaryLabel,
                niceDomain ?? domain,
                rawTicks,
                timeInterval,
                textMeasurer
            );

            return createFixedLabelData({ width, height, spacing }, labelX, labelMatrix);
        };

        const getLabelOverlap = (tickData: TickData, iterationRotation: number) => {
            if (!checkLabelOverlap) return false;

            const rotated = configuredRotation !== 0 || iterationRotation !== 0;
            const labelSpacing = getLabelSpacing(label.minSpacing, rotated);

            const overlap =
                axisLabelsOverlap(getTimeLabelData(tickData, iterationRotation), labelSpacing) ||
                axisLabelsOverlap(getLabelData(tickData, iterationRotation), labelSpacing);

            return overlap;
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

            for (const strategy of this.getTickStrategies({ domain, range, reverse, niceMode, secondaryAxis, index })) {
                ({ tickData, index, autoRotation, terminate } = strategy({
                    index,
                    tickData,
                    textProps,
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

        textAlign = getTextAlign(parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
        const rotation = configuredRotation + autoRotation;

        if (removeOverflowLabels && tickData.ticks.length > 2) {
            const labelData = getLabelData(tickData, autoRotation);
            const lastTick = tickData.ticks.at(-1);
            const lastLabel = labelData.at(-1);
            if (
                lastTick != null &&
                lastLabel != null &&
                lastTick.translationY + lastLabel.label.width / 2 > range[1] + removeOverflowThreshold
            ) {
                lastTick.tickLabel = undefined;

                const firstTick = tickData.ticks[0];
                if (firstTick.translationY === 0 && visibleRange[0] === 0 && visibleRange[1] === 1) {
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
        index: iteration,
        secondaryAxis,
    }: {
        domain: D[];
        range: [number, number];
        reverse: boolean;
        niceMode: NiceMode;
        index: number;
        secondaryAxis: boolean;
    }): TickStrategy[] {
        const { scale, label, interval } = this.axis;
        const { minSpacing } = interval;
        const continuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
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
                terminate
            );

        strategies.push(tickGenerationStrategy);

        if (!continuous && minSpacing != null) {
            const tickFilterStrategy = ({
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
                    TickGenerationType.FILTER,
                    index,
                    tickData,
                    terminate
                );
            strategies.push(tickFilterStrategy);
        }

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

    private ticksEqual(a: any[], b: any[]) {
        if (a.length !== b.length) return false;

        for (let i = 0; i < a.length; i += 1) {
            if (a[i]?.valueOf() !== b[i]?.valueOf()) return false;
        }

        return true;
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
        terminate: boolean
    ): TickStrategyResult {
        // Find the next tick data where the tick data is different from the previous tick data - and return the index of this data
        const { scale, interval } = this.axis;
        const { step, values, minSpacing, maxSpacing } = interval;
        const { maxTickCount, minTickCount, tickCount } = this.estimateTickCount(
            range,
            visibleRange,
            defaultTickMinSpacing,
            minSpacing,
            maxSpacing
        );

        const continuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        const countTicks = (i: number) => (continuous ? Math.max(tickCount - i, minTickCount) : maxTickCount);

        const previousTicks = tickData.rawTicks;

        const regenerateTicks =
            step == null &&
            values == null &&
            countTicks(index) > minTickCount &&
            (continuous || tickGenerationType === TickGenerationType.FILTER);

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
        };

        // First guess - generate ticks at current index
        getTickParams.tickCount = countTicks(index);
        tickData = this.getTicks(getTickParams);

        if (regenerateTicks && this.ticksEqual(tickData.rawTicks, previousTicks)) {
            // Ticks didn't change
            // Use binary search to find the index, as there could be a lot of ticks in some cases
            let lowerBound = index;
            let upperBound = maxIterations;
            while (lowerBound <= upperBound) {
                index = ((lowerBound + upperBound) / 2) | 0;
                getTickParams.tickCount = countTicks(index);
                tickData = this.getTicks(getTickParams);

                if (this.ticksEqual(tickData.rawTicks, previousTicks)) {
                    lowerBound = index + 1;
                } else {
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
        tickParams: Readonly<ScaleTickParams<any>>,
        timeInterval: TimeInterval | TimeIntervalUnit,
        reverse: boolean
    ) {
        const parentInterval = intervalHierarchy(timeInterval);
        if (parentInterval == null) return;

        const { scale } = this.axis;
        if (!ContinuousTimeScale.is(scale) && !DiscreteTimeScale.is(scale)) return;

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
        const interpolate =
            TimeScale.is(scale) && scale.interval != null && intervalMilliseconds(scale.interval) < milliseconds;

        let ticks: Date[];
        let primaryTicksIndices: Set<number> | undefined = new Set<number>();
        if (ContinuousTimeScale.is(scale) || TimeScale.is(scale)) {
            ticks = [];
            const intervalTickParams = {
                ...tickParams,
                interval: timeInterval,
            };
            const timeScaleTicks = !TimeScale.is(scale) || interpolate;
            for (let i = 0; i < primaryTicks.length - 1; i += 1) {
                const p0 = primaryTicks[i];
                const p1 = primaryTicks[i + 1];

                const last = i === primaryTicks.length - 2;

                const dp = p1.valueOf() - p0.valueOf();
                const pVisibleRange: [number, number] = [
                    Math.max((dv0 - p0.valueOf()) / dp, 0),
                    Math.min((dv1 - p0.valueOf()) / dp, 1),
                ];

                const intervalTicks = timeScaleTicks
                    ? this.timeScaleTicks(intervalTickParams, [p0, p1], pVisibleRange, true)
                    : scale.ticks(intervalTickParams, [p0, p1], pVisibleRange, true)?.ticks ?? [];

                dropFirstWhile(intervalTicks, (firstTick) => firstTick.valueOf() < p0.valueOf());

                if (!last) {
                    dropLastWhile(intervalTicks, (lastTick) => {
                        return timeScaleTicks
                            ? lastTick.valueOf() + milliseconds > p1.valueOf()
                            : lastTick.valueOf() >= p1.valueOf();
                    });
                }

                if (intervalTicks.length === 0) continue;

                const firstTick = intervalTicks[0];
                const firstTickDiff = compareDates(firstTick, p0);
                const firstPrimary = timeScaleTicks ? firstTickDiff === 0 : firstTickDiff <= milliseconds;
                if (firstPrimary) primaryTicksIndices.add(ticks.length);

                ticks.push(...intervalTicks);
            }
        } else if (OrdinalTimeScale.is(scale)) {
            ticks = (scale as OrdinalTimeScale).ticks(tickParams, undefined, visibleRange, true)?.ticks ?? [];

            let primaryTickIndex = 0;
            for (let i = 0; i < ticks.length; i++) {
                const tick = ticks[i];
                let primary = false;

                while (
                    primaryTickIndex < primaryTicks.length &&
                    compareDates(primaryTicks[primaryTickIndex], tick) <= 0
                ) {
                    primary = true;
                    primaryTickIndex++;
                }

                if (primary) primaryTicksIndices.add(i);
            }
        } else {
            ticks = [];
        }

        if (
            primaryTicksIndices.size === 0 ||
            // If there's only one primary tick and it's the first tick, don't show primary ticks
            (primaryTicksIndices.size === 1 && primaryTicksIndices.has(0))
        ) {
            primaryTicksIndices = undefined;
        }

        return { ticks, tickCount: undefined, primaryTicksIndices, interpolate };
    }

    private timeScaleTicks(
        params: ScaleTickParams<TimeInterval | TimeIntervalUnit | number>,
        domain: [Date, Date],
        visibleRange?: [number, number],
        extend?: boolean
    ) {
        const { interval } = params;
        if (interval == null) return domain;

        const d0 = domain[0].valueOf();
        const d1 = domain[1].valueOf();

        if (typeof interval !== 'number') {
            const epoch = domain[0];
            const alignedInterval: TimeInterval =
                typeof interval === 'string' ? { unit: interval, epoch } : { ...interval, epoch };
            return intervalRange(alignedInterval, domain[0], domain[1], { visibleRange, extend });
        }

        const ticks: Date[] = [];
        for (let intervalTickTime = d0; intervalTickTime <= d1; intervalTickTime += interval) {
            const intervalTick = new Date(intervalTickTime);
            ticks.push(intervalTick);
        }

        return ticks;
    }

    private getTicks({
        domain,
        range,
        reverse,
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
    }): TickData {
        const { axis } = this;
        const { label, primaryLabel, scale, interval } = axis;
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
        let timeInterval: TimeInterval | TimeIntervalUnit | undefined;
        let primaryTicksIndices: Set<number> | undefined;
        let interpolate = false;

        const scaleDomain = scale.domain;
        scale.domain = niceDomain; // Reset at end of function

        switch (tickGenerationType) {
            case TickGenerationType.VALUES:
                tickDomain = interval.values!;
                rawTicks = interval.values!;
                rawTickCount = rawTicks.length;
                interpolate = TimeScale.is(scale);
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

            case TickGenerationType.FILTER:
                rawTicks = this.filterTicks(previousTicks, tickCount);
                rawTickCount = undefined; // AG-10654 Filter ticks is only done for category axes, so we can ignore this
                break;

            default: {
                if (
                    niceDomain.length > 0 &&
                    tickParams.interval == null &&
                    (TimeScale.is(scale) ||
                        (primaryLabel != null && (ContinuousTimeScale.is(scale) || OrdinalTimeScale.is(scale))))
                ) {
                    const dates = niceDomain as (Date | number)[];
                    const start = Math.min(dates[0].valueOf(), dates[dates.length - 1].valueOf());
                    const end = Math.max(dates[0].valueOf(), dates[dates.length - 1].valueOf());
                    timeInterval = getTickTimeInterval(start, end, tickCount, minTickCount, maxTickCount, {
                        weekStart: primaryLabel == null ? sunday : undefined,
                        primaryOnly: TimeScale.is(scale),
                    });
                }

                const minTimeInterval = TimeScale.is(scale) ? scale.interval : undefined;
                if (
                    minTimeInterval != null &&
                    timeInterval != null &&
                    intervalMilliseconds(minTimeInterval) > intervalMilliseconds(timeInterval)
                ) {
                    timeInterval = minTimeInterval;
                }

                const intervalTicks = timeInterval
                    ? this.getTimeIntervalTicks(visibleRange, tickParams, timeInterval, reverse)
                    : undefined;

                if (intervalTicks) {
                    ({ ticks: rawTicks, tickCount: rawTickCount, primaryTicksIndices, interpolate } = intervalTicks);
                } else {
                    const intervalTickParams =
                        TimeScale.is(scale) && timeInterval != null
                            ? { ...tickParams, interval: tickParams.interval ?? timeInterval }
                            : tickParams;
                    const tickGeneration = scale.ticks(intervalTickParams, niceDomain, visibleRange);
                    rawTicks = tickGeneration?.ticks ?? [];
                    rawTickCount = tickGeneration?.count;
                }
            }
        }

        const fractionDigits = rawTicks.reduce(
            (max, tick) => Math.max(max, typeof tick === 'number' ? countFractionDigits(tick) : 0),
            0
        );

        const specifier =
            labelSpecifier(label.format, timeInterval) ?? (typeof label.format === 'string' ? label.format : undefined);

        const formatParams: ScaleFormatParams<D> = {
            domain: tickDomain,
            ticks: rawTicks,
            fractionDigits,
            specifier,
        };
        const labelFormatter = scale.tickFormatter(formatParams);

        const primarySpecifier = labelSpecifier(
            primaryLabel?.format,
            timeInterval ? intervalHierarchy(timeInterval) : undefined
        );
        const primaryLabelFormatter = primarySpecifier
            ? scale.tickFormatter({
                  ...formatParams,
                  specifier: primarySpecifier,
              })
            : labelFormatter;

        const halfBandwidth = (scale.bandwidth ?? 0) / 2;
        const ticks: TickDatum[] = [];
        for (let i = 0; i < rawTicks.length; i++) {
            const tick = rawTicks[i];
            const translationY = scale.convert(tick, { interpolate }) + halfBandwidth;
            const primary = primaryTicksIndices?.has(i) ?? false;

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !axis.inRange(translationY, 0.001)) continue;

            const tickLabelFormatter =
                primary && primaryLabel?.enabled === true ? primaryLabelFormatter : labelFormatter;
            const tickLabel = label.enabled
                ? axis.formatTick(tick, i, niceDomain, fractionDigits, timeInterval, tickLabelFormatter)
                : '';

            // Create a tick id from the label, or as an increment of the last label if this tick label is blank
            ticks.push({
                tick,
                tickId: idGenerator(tickLabel),
                tickLabel,
                translationY: Math.floor(translationY),
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
