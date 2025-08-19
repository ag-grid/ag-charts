import {
    type BoxBounds,
    type WrapOptions,
    boxCollides,
    cachedTextMeasurer,
    countFractionDigits,
    dropFirstWhile,
    dropLastWhile,
    wrapText,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle } from 'ag-charts-types';

import { BandScale } from '../../scale/bandScale';
import { CategoryScale } from '../../scale/categoryScale';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { type Scale, ScaleAlignment, type ScaleTickParams } from '../../scale/scale';
import { TimeScale } from '../../scale/timeScale';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { normalizeAngle360FromDegrees } from '../../util/angle';
import { compareDates } from '../../util/date';
import { findMinMax, findRangeExtent } from '../../util/number';
import { type AxisPrimaryTickCount, calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { createIdsGenerator } from '../../util/tempUtils';
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
import { lowestGranularityForInterval } from '../../util/timeFormatDefaults';
import type { ChartAxis, ChartAxisLabelFlipFlag } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { AxisInterval } from './axisInterval';
import type { TickInterval } from './axisTick';
import { NiceMode, type TickDatum } from './axisUtil';
import {
    calculateLabelRotation,
    createFixedLabelData,
    createLabelData,
    getTextAlign,
    getTextBaseline,
    timeIntervalMaxLabelSize,
} from './tickGenerationUtils';

export type AnyTimeInterval = AgTimeInterval | AgTimeIntervalUnit;

export interface TickData<D = any> {
    niceDomain: D[];
    tickDomain: D[];
    rawTicks: D[];
    rawTickCount: number | undefined;
    fractionDigits: number;
    ticks: TickDatum[];
    timeInterval: AnyTimeInterval | undefined;
}

export interface TickGenerationParams<D = any> {
    range: [number, number];
    domain: D[];
    reverse: boolean;
    defaultTickMinSpacing: number;
    primaryTickCount: AxisPrimaryTickCount | undefined;
    visibleRange: [number, number];
    niceMode: NiceMode;
    axisRotation: number;
    labelX: number;
    sideFlag: ChartAxisLabelFlipFlag;
    sizeLimit: number | undefined;
}

export interface TickGenerationResult<D = any> {
    tickData: TickData<D>;
    rotation: number;
    textBaseline: CanvasTextBaseline;
    textAlign: CanvasTextAlign;
}

enum TickGenerationType {
    CREATE,
    CREATE_SECONDARY,
    VALUES,
}

enum ParentLevelMode {
    ContinuousTimeScaleTicks,
    UnitTimeScaleTicks,
    OrdinalTimeStepTicks,
    OrdinalTimeScaleTicks,
}

const DENSE_TICK_COUNT = 18;
const TICK_STEP_VALUES = [1, 2, 3, 4, 6, 8, 9, 10, 12]; // Multiples of 2 & 3

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
        timeInterval: AnyTimeInterval | undefined,
        dateStyle: DateFormatterStyle
    ): (value: any, index: number) => string | undefined;
}

const sunday = new Date(1970, 0, 4);

export class AxisTickGenerator<S extends Scale<D, number, TickInterval<S>>, D> {
    constructor(private readonly axis: TickGenerationAxis<S, D>) {}

    private estimateTickCount(
        domain: unknown[],
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
            const maxTickCount = domain.length;
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
        axisRotation,
        labelX,
        sideFlag,
        sizeLimit,
    }: TickGenerationParams<D>): TickGenerationResult<D> {
        const {
            label,
            primaryLabel,
            interval: { values, minSpacing, maxSpacing },
        } = this.axis;
        const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation(
            label.rotation,
            label.parallel,
            axisRotation
        );

        const { maxTickCount } = this.estimateTickCount(
            domain,
            range,
            visibleRange,
            defaultTickMinSpacing,
            minSpacing,
            maxSpacing
        );

        const maxIterations = Number.isFinite(maxTickCount) ? maxTickCount : 10;

        const textMeasurer = cachedTextMeasurer(label);
        const textBaseline = getTextBaseline(label.parallel, configuredRotation, sideFlag, parallelFlipFlag);
        const checkLabelOverlap = label.enabled && label.avoidCollisions;

        const initialRotation = configuredRotation + defaultRotation;

        const getLabelData = ({ ticks }: TickData, iterationRotation: number) => {
            const labelRotation = initialRotation + iterationRotation;
            return createLabelData(ticks, labelX, labelRotation, label);
        };

        const getTimeLabelData = (tickData: TickData, iterationRotation: number) => {
            const { niceDomain, ticks, timeInterval } = tickData;
            if (timeInterval == null) return [];

            const labelRotation = initialRotation + iterationRotation;
            const spacing = ticksSpacing(ticks);
            const { width, height } = timeIntervalMaxLabelSize(
                label,
                primaryLabel,
                niceDomain ?? domain,
                timeInterval,
                textMeasurer
            );

            return createFixedLabelData({ width, height, spacing }, labelX, labelRotation);
        };

        const getLabelOverlap = (tickData: TickData, iterationRotation = 0) => {
            if (!checkLabelOverlap) return false;

            const rotated = configuredRotation !== 0 || iterationRotation !== 0;
            const labelSpacing = label.minSpacing ?? (rotated ? 0 : 10);

            return (
                axisLabelsOverlap(getTimeLabelData(tickData, iterationRotation), labelSpacing) ||
                axisLabelsOverlap(getLabelData(tickData, iterationRotation), labelSpacing)
            );
        };

        let tickData: TickData = {
            tickDomain: [],
            niceDomain: domain,
            ticks: [],
            rawTicks: [],
            rawTickCount: undefined,
            timeInterval: undefined,
            fractionDigits: 0,
        };

        let index = 0;
        let autoRotation = 0;
        let labelOverlap = true;

        const tryAutoRotate = checkLabelOverlap && label.autoRotate && label.rotation == null;
        const secondaryAxis = primaryTickCount != null;

        let tickGenerationType: TickGenerationType;
        if (values) {
            tickGenerationType = TickGenerationType.VALUES;
        } else if (secondaryAxis) {
            tickGenerationType = TickGenerationType.CREATE_SECONDARY;
        } else {
            tickGenerationType = TickGenerationType.CREATE;
        }

        while (labelOverlap && index <= maxIterations) {
            ({ tickData, index } = this.createTickData(
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
                sizeLimit
            ));

            autoRotation =
                tryAutoRotate && getLabelOverlap(tickData, 0) ? normalizeAngle360FromDegrees(label.autoRotateAngle) : 0;

            labelOverlap = getLabelOverlap(tickData, autoRotation);
        }

        const textAlign = getTextAlign(label.parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
        const rotation = configuredRotation + autoRotation;

        return { tickData, rotation, textBaseline, textAlign };
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
        previousTickData: TickData,
        sizeLimit: number | undefined
    ): {
        index: number;
        tickData: TickData<D>;
    } {
        // Find the next tick data where the tick data is different from the previous tick data - and return the index of this data
        const { axis } = this;
        const { step, values, minSpacing, maxSpacing } = axis.interval;
        const { maxTickCount, minTickCount, tickCount } = this.estimateTickCount(
            domain,
            range,
            visibleRange,
            defaultTickMinSpacing,
            minSpacing,
            maxSpacing
        );

        const countTicks = (i: number) => Math.max(tickCount - i, minTickCount);
        const regenerateTicks = step == null && values == null && countTicks(index) > minTickCount;
        const previousTicks = previousTickData.rawTicks;
        const maxIterations = tickCount - minTickCount;

        const getTickParams = {
            domain,
            reverse,
            niceMode,
            visibleRange,
            primaryTickCount,
            tickGenerationType,
            minTickCount,
            maxTickCount,
            tickCount: 0,
        };

        // First guess - generate ticks at current index
        getTickParams.tickCount = countTicks(index);
        let nextTicks = this.getTicks(getTickParams);

        if (regenerateTicks && ticksEqual(nextTicks.rawTicks, previousTicks)) {
            // Ticks didn't change
            // Use binary search to find the index, as there could be a lot of ticks in some cases
            let lowerBound = index;
            let upperBound = maxIterations;
            while (lowerBound <= upperBound) {
                index = ((lowerBound + upperBound) / 2) | 0;
                getTickParams.tickCount = countTicks(index);
                const nextTicksCandidate = this.getTicks(getTickParams);

                if (ticksEqual(nextTicksCandidate.rawTicks, previousTicks)) {
                    lowerBound = index + 1;
                } else {
                    nextTicks = nextTicksCandidate;
                    upperBound = index - 1;
                }
            }
        }

        const {
            tickDomain,
            niceDomain,
            rawTicks,
            rawTickCount,
            rawFirstTickIndex,
            generatePrimaryTicks,
            primaryTicksIndices,
            alignment,
            fractionDigits,
            timeInterval,
        } = nextTicks;

        return {
            tickData: {
                tickDomain,
                niceDomain,
                rawTicks,
                rawTickCount,
                timeInterval,
                fractionDigits,
                ticks: formatTicks({
                    axis,
                    range,
                    niceDomain,
                    rawTicks,
                    rawFirstTickIndex,
                    generatePrimaryTicks,
                    primaryTicksIndices,
                    alignment,
                    fractionDigits,
                    timeInterval,
                    sizeLimit,
                }),
            },
            index: index + 1,
        };
    }

    private getTicks({
        domain,
        reverse,
        niceMode,
        visibleRange,
        tickGenerationType,
        tickCount,
        minTickCount,
        maxTickCount,
        primaryTickCount,
    }: {
        domain: D[];
        reverse: boolean;
        niceMode: NiceMode;
        visibleRange: [number, number];
        tickGenerationType: TickGenerationType;
        primaryTickCount: AxisPrimaryTickCount | undefined;
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
    }) {
        const { axis } = this;
        const { primaryLabel, scale, interval } = axis;

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
        let rawFirstTickIndex: number | undefined;
        let timeInterval: AnyTimeInterval | undefined;
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

                let minTimeInterval: AnyTimeInterval | undefined;
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
                    ? getTimeIntervalTicks(
                          axis,
                          visibleRange,
                          tickCount,
                          maxTickCount,
                          tickParams,
                          timeInterval,
                          reverse
                      )
                    : undefined;
                if (intervalTicks) {
                    ({ ticks: rawTicks, primaryTicksIndices, alignment } = intervalTicks);
                } else {
                    const intervalTickParams =
                        UnitTimeScale.is(scale) && tickParams.interval == null && timeInterval != null
                            ? { ...tickParams, interval: timeInterval }
                            : tickParams;
                    const tickGeneration = scale.ticks(intervalTickParams, niceDomain, visibleRange);

                    rawTicks = tickGeneration?.ticks ?? [];
                    rawTickCount = tickGeneration?.count;
                    rawFirstTickIndex = tickGeneration?.firstTickIndex;
                    if (TimeScale.is(scale) || DiscreteTimeScale.is(scale)) {
                        const paramsInterval =
                            typeof tickParams.interval === 'number'
                                ? lowestGranularityForInterval(tickParams.interval)
                                : tickParams.interval;
                        timeInterval ??= paramsInterval ?? tickGeneration?.timeInterval;
                    }
                }
            }
        }

        let fractionDigits = 0;
        for (const tick of rawTicks) {
            if (typeof tick !== 'number') continue;
            const value = countFractionDigits(tick);
            if (value > fractionDigits) {
                fractionDigits = value;
            }
        }

        if (!generatePrimaryTicks) {
            primaryTicksIndices = undefined;
        }

        scale.domain = scaleDomain;

        return {
            tickDomain,
            niceDomain,
            rawTicks,
            rawTickCount,
            rawFirstTickIndex,
            generatePrimaryTicks,
            primaryTicksIndices,
            alignment,
            fractionDigits,
            timeInterval,
        };
    }
}

function axisLabelsOverlap(data: readonly BoxBounds[], padding: number = 0): boolean {
    const result: BoxBounds[] = [];
    for (const { x, y, width, height } of data) {
        if (result.some((l) => boxCollides(l, x, y, width + padding, height + padding))) {
            return true;
        }
        result.push({ x, y, width, height });
    }
    return false;
}

function createTimeScaleTicks(
    interval: AnyTimeInterval | number,
    domain: [Date, Date],
    visibleRange?: [number, number],
    extend?: boolean
): Date[] {
    if (interval == null) {
        return domain;
    }

    if (typeof interval !== 'number') {
        const epoch = domain[0];
        const alignedInterval: AgTimeInterval =
            typeof interval === 'string' ? { unit: interval, epoch } : { ...interval, epoch };
        return intervalRange(alignedInterval, domain[0], domain[1], { visibleRange, extend });
    }

    const ticks: Date[] = [];
    const d0 = domain[0].valueOf();
    const d1 = domain[1].valueOf();
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

function formatTicks<S extends Scale<D, number, TickInterval<S>>, D>({
    axis,
    niceDomain,
    range,
    rawTicks,
    rawFirstTickIndex = 0,
    generatePrimaryTicks,
    primaryTicksIndices,
    alignment,
    fractionDigits,
    timeInterval,
    sizeLimit = Infinity,
}: {
    axis: TickGenerationAxis<S, D>;
    niceDomain: D[];
    range: [number, number];
    rawTicks: any[];
    rawFirstTickIndex: number | undefined;
    generatePrimaryTicks: boolean;
    primaryTicksIndices: Set<number> | undefined;
    alignment: ScaleAlignment | undefined;
    fractionDigits: number;
    timeInterval: AnyTimeInterval | undefined;
    sizeLimit: number | undefined;
}): TickDatum[] {
    const { label, scale } = axis;
    const originalDomain = scale.domain;
    const isVertical = axis.direction === ChartAxisDirection.Y;
    const isContinuous = TimeScale.is(scale) || DiscreteTimeScale.is(scale);
    const measurer = cachedTextMeasurer(label);
    const idGenerator = createIdsGenerator();
    const ticks: TickDatum[] = [];

    scale.domain = niceDomain; // Reset at the end of function

    const halfBandwidth = (scale.bandwidth ?? 0) / 2;
    const maxBand = BandScale.is(scale) ? scale.bandwidth ?? Infinity : Infinity;

    const wrapOptions: WrapOptions = {
        font: label,
        maxWidth: isVertical ? sizeLimit : maxBand,
        maxHeight: isVertical ? maxBand : sizeLimit,
        overflow: label.truncate ? 'ellipsis' : 'hide',
        textWrap: label.wrapping,
    };

    const axisFormatter = axisTickFormatter(
        axis,
        generatePrimaryTicks,
        niceDomain,
        rawTicks,
        fractionDigits,
        timeInterval
    );

    for (let i = 0; i < rawTicks.length; i++) {
        const tick = rawTicks[i];
        const translation = scale.convert(tick, { alignment }) + halfBandwidth;

        if (range.length && !axis.inRange(translation, 0.001)) continue;

        const isPrimary = primaryTicksIndices?.has(i) ?? false;
        const inputText = axisFormatter(isPrimary, tick, i);
        const wrappedLabel = label.avoidCollisions ? wrapText(inputText, wrapOptions) || null : null;
        const tickLabel = wrappedLabel ?? inputText;

        const tickValue = isContinuous ? tick?.valueOf() : null;
        const tickId = Number.isFinite(tickValue) ? idGenerator(`v:${tickValue}`) : idGenerator(`l:${tickLabel}`);

        ticks.push({
            tick,
            tickId,
            tickLabel,
            isPrimary,
            index: i + rawFirstTickIndex,
            textUntruncated: tickLabel === inputText ? undefined : inputText,
            textMetrics: measurer.measureLines(tickLabel),
            translation: Math.floor(translation),
        });
    }

    scale.domain = originalDomain;

    return ticks;
}

function axisTickFormatter<S extends Scale<D, number, TickInterval<S>>, D>(
    axis: TickGenerationAxis<S, D>,
    generatePrimaryTicks: boolean,
    niceDomain: D[],
    rawTicks: any[],
    fractionDigits: number,
    timeInterval: AnyTimeInterval | undefined
) {
    const dateStyle: DateFormatterStyle = generatePrimaryTicks ? 'component' : 'long';
    const parentInterval = generatePrimaryTicks && timeInterval ? intervalHierarchy(timeInterval) : undefined;

    const primaryFormatter = generatePrimaryTicks
        ? axis.tickFormatter(niceDomain, rawTicks, true, fractionDigits, parentInterval, dateStyle)
        : null;

    const tickFormatter = axis.label.enabled
        ? axis.tickFormatter(niceDomain, rawTicks, false, fractionDigits, timeInterval, dateStyle)
        : null;

    return (isPrimary: boolean, tick: D, index: number) => {
        const formatter = isPrimary ? primaryFormatter : tickFormatter;
        return formatter?.(tick, index) ?? String(tick);
    };
}

function getTimeIntervalTicks<S extends Scale<D, number, TickInterval<S>>, D>(
    axis: TickGenerationAxis<S, D>,
    visibleRange: [number, number],
    tickCount: number,
    maxTickCount: number,
    tickParams: Readonly<ScaleTickParams<any>>,
    timeInterval: AnyTimeInterval,
    reverse: boolean
) {
    const parentInterval = intervalHierarchy(timeInterval);
    if (parentInterval == null) return;

    const { scale } = axis;
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

    let primaryTicksIndices: Set<number> | undefined;
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
        const { minimumTimeGranularity } = axis;
        const timeIntervalGranularity = intervalUnit(timeInterval);
        parentLevelMode =
            minimumTimeGranularity != null &&
            intervalMilliseconds(minimumTimeGranularity) >= intervalMilliseconds(timeIntervalGranularity)
                ? ParentLevelMode.OrdinalTimeStepTicks
                : ParentLevelMode.OrdinalTimeScaleTicks;
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
        parentLevelMode = ParentLevelMode.UnitTimeScaleTicks;
    } else {
        // Can be a unit time scale where the current interval is greater than the unit interval
        parentLevelMode = ParentLevelMode.ContinuousTimeScaleTicks;
        alignment = ScaleAlignment.Interpolate;
    }

    for (let i = 0; i < primaryTicks.length - 1; i++) {
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
            case ParentLevelMode.ContinuousTimeScaleTicks:
                intervalTicks = createTimeScaleTicks(intervalTickParams.interval, [p0, p1], pVisibleRange, true);
                break;
            case ParentLevelMode.UnitTimeScaleTicks:
            case ParentLevelMode.OrdinalTimeScaleTicks:
                const scaleTicks = scale.ticks(intervalTickParams, [p0, p1], pVisibleRange, {
                    extend: true,
                    dropInitial: true,
                });
                intervalTicks = scaleTicks?.ticks ?? [];
                break;
            case ParentLevelMode.OrdinalTimeStepTicks:
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
                switch (parentLevelMode) {
                    case ParentLevelMode.ContinuousTimeScaleTicks:
                    case ParentLevelMode.OrdinalTimeScaleTicks:
                        return lastTick.valueOf() + milliseconds > p1.valueOf();
                    case ParentLevelMode.UnitTimeScaleTicks:
                    case ParentLevelMode.OrdinalTimeStepTicks:
                        return lastTick.valueOf() >= p1.valueOf();
                }
            });
        }

        if (intervalTicks.length === 0) continue;

        const firstTick = intervalTicks[0];
        const firstTickDiff = compareDates(firstTick, p0);
        const firstPrimary =
            parentLevelMode === ParentLevelMode.ContinuousTimeScaleTicks
                ? firstTickDiff === 0
                : firstTickDiff <= milliseconds;

        if (firstPrimary && (!skipFirstPrimaryTick || !first)) {
            primaryTicksIndices ??= new Set();
            primaryTicksIndices.add(ticks.length);
        }

        ticks.push(...intervalTicks);
    }

    // If there's only one primary tick, and it's the first tick, don't show primary ticks
    if (primaryTicksIndices?.size === 1 && primaryTicksIndices.has(0)) {
        primaryTicksIndices = undefined;
    }

    return { ticks, primaryTicksIndices, alignment };
}
