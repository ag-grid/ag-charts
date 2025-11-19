import {
    type BoxBounds,
    type Scale,
    ScaleAlignment,
    type ScaleTickParams,
    cachedTextMeasurer,
    countFractionDigits,
    estimateTickCount,
    findMinMax,
    findRangeExtent,
    getTickTimeInterval,
    intervalMilliseconds,
    lowestGranularityForInterval,
    normalizeAngle360FromDegrees,
    rotatePoint,
} from 'ag-charts-core';
import type { PaddingOptions } from 'ag-charts-types';

import { CategoryScale } from '../../scale/categoryScale';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { TimeScale } from '../../scale/timeScale';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { expandLabelPadding } from '../label';
import type { TickInterval } from './axisTick';
import { NiceMode, type TickDatum } from './axisUtil';
import {
    type AnyTimeInterval,
    type GenerateTicksOptions,
    type TickData,
    axisLabelsOverlap,
    calculateLabelRotation,
    formatTicks,
    getTextAlign,
    getTextBaseline,
    getTimeIntervalTicks,
    ticksEqual,
    ticksSpacing,
    timeIntervalMaxLabelSize,
    withTemporaryDomain,
} from './generateTicksUtils';

interface CountParams {
    tickCount: number;
    minTickCount: number;
    maxTickCount: number;
}

enum TickGenerationType {
    CREATE,
    CREATE_SECONDARY,
    VALUES,
}

const sunday = new Date(1970, 0, 4);

export function generateTicks<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>
) {
    const { label, domain, axisRotation, labelOffset, sideFlag } = options;
    const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation(
        label.rotation,
        label.parallel,
        axisRotation
    );

    const initialRotation = configuredRotation + defaultRotation;
    const checkLabelOverlap = (tickData: TickData, rotation = 0) => {
        // minSpacing defaults to 10 unless label is rotated
        const labelSpacing = label.minSpacing ?? (configuredRotation === 0 && rotation === 0 ? 10 : 0);
        const labelRotation = initialRotation + rotation;
        const labelPadding = expandLabelPadding(label);

        return (
            axisLabelsOverlap(createTimeLabelData(options, tickData, labelRotation), labelSpacing) ||
            axisLabelsOverlap(createLabelData(tickData.ticks, labelOffset, labelRotation, labelPadding), labelSpacing)
        );
    };

    const { maxTickCount } = estimateScaleTickCount(options);
    const tickGenerationType = getTickGenerationType(options);
    const avoidCollisions = label.enabled && label.avoidCollisions;
    const maxIterations = Number.isFinite(maxTickCount) ? maxTickCount : 10;
    const tryAutoRotate = avoidCollisions && label.autoRotate && label.rotation == null;

    let index = 0;
    let autoRotation = 0;
    let labelOverlap = true;
    let tickData: TickData = {
        tickDomain: [],
        niceDomain: domain,
        ticks: [],
        rawTicks: [],
        rawTickCount: undefined,
        timeInterval: undefined,
        fractionDigits: 0,
    };

    while (labelOverlap && index <= maxIterations) {
        ({ tickData, index } = buildTickData(options, tickGenerationType, tickData, index));

        autoRotation =
            tryAutoRotate && checkLabelOverlap(tickData, 0) ? normalizeAngle360FromDegrees(label.autoRotateAngle) : 0;

        labelOverlap = avoidCollisions && checkLabelOverlap(tickData, autoRotation);
    }

    const textAlign = getTextAlign(label.parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
    const textBaseline = getTextBaseline(label.parallel, configuredRotation, sideFlag, parallelFlipFlag);
    const rotation = configuredRotation + autoRotation;

    return { tickData, textAlign, textBaseline, rotation };
}

function getTickGenerationType<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>
): TickGenerationType {
    if (options.interval?.values) {
        return TickGenerationType.VALUES;
    } else if (options.primaryTickCount != null) {
        return TickGenerationType.CREATE_SECONDARY;
    }
    return TickGenerationType.CREATE;
}

function estimateScaleTickCount<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>({
    scale,
    domain,
    range,
    visibleRange,
    label,
    defaultTickMinSpacing,
    interval: { minSpacing, maxSpacing },
}: GenerateTicksOptions<TScale, TDatum>): CountParams {
    const { defaultTickCount } = scale;
    const rangeExtent = findRangeExtent(range);
    const zoomExtent = findRangeExtent(visibleRange);

    if (CategoryScale.is(scale)) {
        const maxTickCount = domain.length;
        const estimatedTickCount = Math.ceil(rangeExtent / (zoomExtent * label.fontSize));
        return {
            tickCount: Math.min(estimatedTickCount, maxTickCount),
            minTickCount: 0,
            maxTickCount,
        };
    }

    return estimateTickCount(rangeExtent, zoomExtent, minSpacing, maxSpacing, defaultTickCount, defaultTickMinSpacing);
}

function buildTickData<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickGenerationType: TickGenerationType,
    previousTickData: TickData,
    index: number
): {
    index: number;
    tickData: TickData<TDatum>;
} {
    const { step, values } = options.interval;

    // Find the next tick data where the tick data is different from the previous tick data - and return the index of this data
    const { maxTickCount, minTickCount, tickCount } = estimateScaleTickCount(options);
    const countTicks = (i: number) => Math.max(tickCount - i, minTickCount);
    const regenerateTicks = step == null && values == null && countTicks(index) > minTickCount;
    const previousTicks = previousTickData.rawTicks;
    const maxIterations = tickCount - minTickCount;

    // First guess - generate ticks at current index
    const countParams = { minTickCount, maxTickCount, tickCount: countTicks(index) };

    let nextTicks = calculateRawTicks(options, tickGenerationType, countParams);
    if (regenerateTicks && ticksEqual(nextTicks.rawTicks, previousTicks)) {
        // Ticks didn't change
        // Use binary search to find the index, as there could be a lot of ticks in some cases
        let lowerBound = index;
        let upperBound = maxIterations;
        while (lowerBound <= upperBound) {
            index = Math.trunc((lowerBound + upperBound) / 2);
            countParams.tickCount = countTicks(index);
            const nextTicksCandidate = calculateRawTicks(options, tickGenerationType, countParams);

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
            fractionDigits,
            timeInterval,
            ticks: formatTicks(options, {
                niceDomain,
                rawTicks,
                rawFirstTickIndex,
                generatePrimaryTicks,
                primaryTicksIndices,
                alignment,
                fractionDigits,
                timeInterval,
            }),
        },
        index: index + 1,
    };
}

function calculateRawTicks<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickGenerationType: TickGenerationType,
    countParams: CountParams
) {
    const {
        domain,
        reverse,
        visibleRange,
        scale,
        interval,
        primaryLabel,
        niceMode,
        primaryTickCount,
        minimumTimeGranularity,
    } = options;

    const domainParams: ScaleTickParams<any> = {
        nice: niceMode.map((n) => n === NiceMode.TickAndDomain),
        interval: interval.step,
        ...countParams,
    };

    const tickParams = {
        ...domainParams,
        nice: niceMode.map((n) => n === NiceMode.TickAndDomain || n === NiceMode.TicksOnly),
    };

    let secondaryAxisTicks: { domain: TDatum[]; ticks: number[] } | undefined;
    if (
        tickGenerationType === TickGenerationType.CREATE_SECONDARY &&
        primaryTickCount != null &&
        ContinuousScale.is(scale)
    ) {
        // AG-10654 Just use normal ticks for categorical axes.
        secondaryAxisTicks = calculateNiceSecondaryAxis(scale, domain, primaryTickCount, reverse, visibleRange);
    }

    const niceDomain = niceMode.includes(NiceMode.TickAndDomain)
        ? secondaryAxisTicks?.domain ?? scale.niceDomain(domainParams, domain)
        : domain;
    let tickDomain: TDatum[] = niceDomain;
    let rawTicks: any[] | undefined;
    let rawTickCount: number | undefined;
    let rawFirstTickIndex: number | undefined;
    let timeInterval: AnyTimeInterval | undefined;
    let primaryTicksIndices: Set<number> | undefined;
    let alignment: ScaleAlignment | undefined;

    const generatePrimaryTicks = primaryLabel?.enabled === true && tickParams.interval == null;

    withTemporaryDomain(scale, niceDomain, () => {
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
                    rawTicks = tickGeneration?.ticks;
                    rawTickCount = tickGeneration?.count;
                }
                break;

            default: {
                const { tickCount, minTickCount, maxTickCount } = countParams;

                if (
                    niceDomain.length > 0 &&
                    tickParams.interval == null &&
                    (UnitTimeScale.is(scale) ||
                        (generatePrimaryTicks && (TimeScale.is(scale) || OrdinalTimeScale.is(scale))))
                ) {
                    const dates = niceDomain as (Date | number)[];
                    const start = Math.min(dates[0].valueOf(), dates.at(-1)!.valueOf());
                    const end = Math.max(dates[0].valueOf(), dates.at(-1)!.valueOf());
                    timeInterval = getTickTimeInterval(start, end, tickCount, minTickCount, maxTickCount, {
                        weekStart: primaryLabel == null ? sunday : undefined,
                        primaryOnly: true,
                    });
                }

                let minTimeInterval: AnyTimeInterval | undefined;
                if (OrdinalTimeScale.is(scale)) {
                    minTimeInterval = minimumTimeGranularity;
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
                          scale,
                          visibleRange,
                          tickCount,
                          maxTickCount,
                          tickParams,
                          timeInterval,
                          reverse,
                          minimumTimeGranularity
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

                    rawTicks = tickGeneration?.ticks;
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
    });

    rawTicks ??= [];

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

function createTimeLabelData<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickData: TickData,
    labelRotation: number
) {
    const { niceDomain, ticks, timeInterval } = tickData;
    if (timeInterval == null) return [];

    const spacing = ticksSpacing(ticks);
    const { label, labelOffset, primaryLabel, domain } = options;
    const { width, height } = timeIntervalMaxLabelSize(
        label,
        primaryLabel,
        niceDomain ?? domain,
        timeInterval,
        cachedTextMeasurer(label)
    );

    const labelData: BoxBounds[] = [];
    for (const translation of [0, spacing]) {
        const { x, y } = rotatePoint(labelOffset, translation, labelRotation);
        labelData.push({ x, y, width, height });
    }
    return labelData;
}

function createLabelData(
    tickData: TickDatum[],
    labelOffset: number,
    labelRotation: number,
    labelPadding: Required<PaddingOptions>
) {
    const labelData: BoxBounds[] = [];
    const xPadding = labelPadding.left + labelPadding.right;
    const yPadding = labelPadding.top + labelPadding.bottom;

    for (const { tickLabel, textMetrics, translation } of tickData) {
        if (!tickLabel) continue;

        const { x, y } = rotatePoint(labelOffset, translation, labelRotation);
        const width = textMetrics.width + xPadding;
        const height = textMetrics.height + yPadding;

        labelData.push({ x, y, width, height });
    }

    return labelData;
}
