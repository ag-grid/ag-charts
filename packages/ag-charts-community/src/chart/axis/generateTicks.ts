import {
    BandScale,
    type BoxBounds,
    CategoryScale,
    ContinuousScale,
    DiscreteTimeScale,
    OrdinalTimeScale,
    type ResolvedTextAlign,
    type Scale,
    ScaleAlignment,
    type ScaleTickParams,
    TimeScale,
    UnitTimeScale,
    calculateNiceSecondaryAxis,
    countAxisLabelOverlaps,
    countFractionDigits,
    estimateTickCount,
    findMinMax,
    findRangeExtent,
    getTickTimeInterval,
    intervalMilliseconds,
    lowestGranularityForInterval,
    normalizeAngle360,
    normalizeAngle360FromDegrees,
    rotatePoint,
    thinTickLabels,
    tickLabelSpacing,
    toDegrees,
} from 'ag-charts-core';
import type { PaddingOptions, VerticalAlign } from 'ag-charts-types';

import { expandLabelPadding } from '../label';
import { getVerticalAlignShift } from './axisLabelUtil';
import type { TickInterval } from './axisTick';
import { NiceMode, type TickDatum } from './axisUtil';
import {
    type AnyTimeInterval,
    type GenerateTicksOptions,
    MIN_TRUNCATED_CHARS,
    type TickData,
    axisLabelFit,
    axisLabelRotations,
    calculateLabelRotation,
    droppedLabelChars,
    fitTickAtRotation,
    fitTicksAtRotation,
    formatTicks,
    getTextAlign,
    getTextBaseline,
    getTimeIntervalTicks,
    isLabelFitEnabled,
    keptChars,
    labelFitsRoom,
    ticksEqual,
    ticksSpacing,
    timeIntervalMaxLabelSize,
    withTemporaryDomain,
} from './generateTicksUtils';

interface RotationFit {
    tickData: TickData;
    droppedChars: number;
    overlaps?: boolean;
    overlapCount?: number;
}

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
    const {
        label,
        parallel = false,
        domain,
        axisRotation,
        labelOffset,
        sideFlag,
        labelBaseline,
        labelBandOffsets,
    } = options;
    // The first rotation sets the frame the labels are aligned in; later ones turn the labels within it.
    const rotations = axisLabelRotations(label.rotation);
    const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation(
        rotations[0],
        parallel,
        axisRotation
    );
    const autoRotations = rotations.map((rotation) =>
        normalizeAngle360(normalizeAngle360FromDegrees(rotation) - configuredRotation)
    );

    const initialRotation = configuredRotation + defaultRotation;
    // Labels are fitted again at each later rotation, so collisions are checked as they will be drawn.
    const fitsRoom = labelFitsRoom(label);
    const lastRotationIndex = rotations.length - 1;
    // Fit index `rotations.length` is the last rotation with labels truncated to clear their neighbours.
    const alwaysShow = !label.enabled || label.collision.alwaysShow;
    const truncatesToClear = !alwaysShow && label.truncate === true && BandScale.is(options.scale);
    const rotationOf = (fitIndex: number) => Math.min(fitIndex, lastRotationIndex);
    const rotationFits = Array.from({ length: rotations.length + 1 }, () => new WeakMap<TickData, RotationFit>());
    const labelPadding = expandLabelPadding(label);
    const spacingAt = (rotation: number) =>
        tickLabelSpacing(label.collision.threshold, Math.cos(configuredRotation + rotation) < 1 - 1e-9);
    const computedBaseline = getTextBaseline(parallel, configuredRotation, sideFlag, parallelFlipFlag);
    const labelFrame = (fitIndex: number) => {
        const rotation = autoRotations[rotationOf(fitIndex)];
        return {
            rotation,
            labelRotation: initialRotation + rotation,
            textAlign:
                options.labelTextAlign ??
                getTextAlign(parallel, configuredRotation, rotation, sideFlag, regularFlipFlag),
            textBaseline: labelBaseline ?? computedBaseline,
        };
    };
    const { alongBounds, labelAnchorOffset = 0 } = options;
    // Labels running along the axis shift inward from the chart's edge while that keeps them clear of their
    // neighbours; others are fitted again to the space between their anchor and that edge.
    const keepWithinChart = (ticks: TickDatum[], rotationIndex: number) => {
        if (alongBounds == null) return ticks;
        const [start, end] = alongBounds;
        const { rotation, textAlign, textBaseline } = labelFrame(rotationIndex);
        const drawn = configuredRotation + rotation;
        const slides = Math.abs(options.isVertical ? Math.sin(drawn) : Math.cos(drawn)) > 1 - 1e-6;
        const extentOf = (tick: TickDatum) =>
            labelAlongExtent(
                tick,
                labelAnchorOffset,
                drawn,
                options.isVertical === true,
                labelPadding,
                textBaseline,
                textAlign
            );
        const fitTo = (tick: TickDatum, alongOf: (extent: [number, number], tick: TickDatum) => number | undefined) => {
            for (let attempt = 0; attempt < 3; attempt++) {
                const along = alongOf(extentOf(tick), tick);
                if (along == null) break;
                tick = fitTickAtRotation(options, tick, rotations[rotationOf(rotationIndex)], along);
            }
            return tick;
        };
        const toEdge = (extent: [number, number], tick: TickDatum) =>
            alongWithin(extent, tick.translation + labelAnchorOffset, alongBounds);
        const toChart = (extent: [number, number]) => (extent[1] - extent[0] > end - start ? end - start : undefined);
        const spacing = spacingAt(rotation);
        const reaches = (other: TickDatum | undefined, min: number, max: number) => {
            if (other?.tickLabel == null || other.tickLabel === '') return false;
            const [otherMin, otherMax] = extentOf(other);
            return otherMin < max + spacing && otherMax > min - spacing;
        };
        return ticks.map((tick, i) => {
            if (tick.isPrimary || tick.tickLabel == null || tick.tickLabel === '') return tick;
            if (!slides) return fitTo(tick, toEdge);
            const fitted = fitTo(tick, toChart);
            const [min, max] = extentOf(fitted);
            const labelShift = Math.max(0, start - min) - Math.max(0, max - end);
            if (labelShift === 0) return fitted;
            const shifted = [min + labelShift, max + labelShift] as const;
            if (reaches(ticks[i - 1], ...shifted) || reaches(ticks[i + 1], ...shifted)) return fitTo(tick, toEdge);
            return { ...fitted, labelShift };
        });
    };
    // A label clears the next one along once its text is shorter than their distance apart, seen along the text.
    const clearNeighbours = (ticks: TickDatum[]) => {
        const { rotation } = labelFrame(lastRotationIndex);
        const drawn = configuredRotation + rotation;
        const alongText = Math.abs(options.isVertical ? Math.sin(drawn) : Math.cos(drawn));
        const maxWidth = minTickGap(ticks) * alongText - spacingAt(rotation) - labelPadding.left - labelPadding.right;
        if (Number.isNaN(maxWidth) || maxWidth <= 0) return;
        const cleared: TickDatum[] = [];
        for (let tick of ticks) {
            if (!tick.isPrimary && tick.tickLabel != null && tick.textMetrics.width > maxWidth) {
                const minChars = Math.min(MIN_TRUNCATED_CHARS, keptChars(tick.fitSource ?? tick.tickLabel));
                tick = fitTickAtRotation(options, tick, rotations[lastRotationIndex], Infinity, undefined, maxWidth);
                if (keptChars(tick.tickLabel) < minChars) return;
            }
            cleared.push(tick);
        }
        return cleared;
    };
    const fitAt = (candidate: TickData, rotationIndex: number) => {
        const cache = rotationFits[rotationIndex];
        let fit = cache.get(candidate);
        if (fit == null) {
            let tickData = candidate;
            if (rotationIndex > lastRotationIndex) {
                tickData = fitAt(candidate, lastRotationIndex).tickData;
                const cleared = clearNeighbours(tickData.ticks);
                if (cleared == null) {
                    // Labels truncated past readability are thinned instead.
                    fit = { tickData, droppedChars: Infinity, overlaps: true, overlapCount: Infinity };
                    cache.set(candidate, fit);
                    return fit;
                }
                tickData = { ...candidate, ticks: keepWithinChart(cleared, rotationIndex) };
            } else if (fitsRoom) {
                const ticks =
                    rotationIndex === 0
                        ? candidate.ticks
                        : fitTicksAtRotation(options, candidate.ticks, rotations[rotationIndex]);
                tickData = { ...candidate, ticks: keepWithinChart(ticks, rotationIndex) };
            }
            fit = { tickData, droppedChars: fitsRoom ? droppedLabelChars(tickData.ticks) : 0 };
            cache.set(candidate, fit);
        }
        return fit;
    };
    const countLabelOverlaps = (ticks: TickDatum[], rotationIndex: number, limit: number, spacing?: number) => {
        const { rotation, labelRotation, textAlign, textBaseline } = labelFrame(rotationIndex);
        // Where the band flush will leave each label, rather than where the anchor sits now: rotated
        // labels of differing size flush by differing amounts, along their own text direction.
        // The flush is measured off the label nodes, so it needs the rendered rotation - not
        // `labelRotation`, whose `defaultRotation` is only the frame `createLabelData` compares in.
        const bandOffsets = labelBandOffsets?.(ticks, configuredRotation + rotation, textAlign, computedBaseline);
        const labelData = createLabelData(
            ticks,
            labelOffset,
            labelAnchorOffset,
            labelRotation,
            labelPadding,
            textBaseline,
            textAlign,
            bandOffsets
        );
        return countAxisLabelOverlaps(labelData, spacing ?? spacingAt(rotation), limit);
    };
    const countOverlaps = (candidate: TickData, rotationIndex: number, limit: number) => {
        const { tickData } = fitAt(candidate, rotationIndex);
        const { rotation, labelRotation } = labelFrame(rotationIndex);
        const timeOverlaps = countAxisLabelOverlaps(
            createTimeLabelData(options, tickData, labelRotation, rotation),
            spacingAt(rotation),
            limit
        );
        if (timeOverlaps >= limit) return timeOverlaps;
        return timeOverlaps + countLabelOverlaps(tickData.ticks, rotationIndex, limit - timeOverlaps);
    };
    const labelFit = {
        overlaps: (candidate: TickData, rotationIndex: number) => {
            const fit = fitAt(candidate, rotationIndex);
            fit.overlaps ??= countOverlaps(candidate, rotationIndex, 1) > 0;
            return fit.overlaps;
        },
        droppedChars: (candidate: TickData, rotationIndex: number) => fitAt(candidate, rotationIndex).droppedChars,
        overlapCount: (candidate: TickData, rotationIndex: number) => {
            const fit = fitAt(candidate, rotationIndex);
            fit.overlapCount ??= countOverlaps(candidate, rotationIndex, Infinity);
            return fit.overlapCount;
        },
        // Fixed ticks are only thinned where their labels actually overlap, never to keep the threshold.
        clearStride: (candidate: TickData, rotationIndex: number) => {
            const { ticks } = fitAt(candidate, rotationIndex).tickData;
            if (countLabelOverlaps(ticks, rotationIndex, 1, 0) === 0) return 1;
            const labelCount = ticks.filter(isStridedLabel).length;
            for (let stride = 2; stride < labelCount; stride++) {
                if (countLabelOverlaps(showEveryNthLabel(ticks, stride), rotationIndex, 1, 0) === 0) return stride;
            }
            return Math.max(1, labelCount);
        },
    };

    const { maxTickCount } = estimateScaleTickCount(options);
    const tickGenerationType = getTickGenerationType(options);
    const maxIterations = Number.isFinite(maxTickCount) ? maxTickCount : 10;

    let index = 0;
    let tickData: TickData = {
        tickDomain: [],
        niceDomain: domain,
        ticks: [],
        rawTicks: [],
        rawTickCount: undefined,
        timeInterval: undefined,
        fractionDigits: 0,
        rawFirstTickIndex: 0,
    };

    // A configured step or explicit values pin the ticks, so the search can only move the domain around them.
    const fixedInterval = options.interval?.step != null || options.interval?.values != null;
    // A wider domain only crowds pinned ticks, so later candidates must stay within the first pinned one.
    let domainLimit: TDatum[] | undefined;

    const {
        candidate: thinnedTickData,
        rotationIndex,
        labelStride,
    } = thinTickLabels(
        () => {
            while (index <= maxIterations) {
                const next = buildTickData(options, tickGenerationType, tickData, index, domainLimit);
                index = next.index;
                if (next.tickData == null) continue;
                tickData = next.tickData;
                // A step the scale rejected leaves automatic ticks, which the search can still thin.
                const pinned = fixedInterval && !next.intervalIgnored;
                if (pinned && ContinuousScale.is(options.scale)) domainLimit ??= tickData.niceDomain;
                return { candidate: tickData, pinned };
            }
        },
        labelFit,
        alwaysShow,
        label.enabled ? rotations.length : 1,
        truncatesToClear
    );

    tickData = fitAt(thinnedTickData ?? tickData, rotationIndex).tickData;
    if (labelStride > 1) tickData = { ...tickData, ticks: showEveryNthLabel(tickData.ticks, labelStride) };
    const autoRotation = autoRotations[rotationOf(rotationIndex)];

    const textAlign = getTextAlign(parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
    const textBaseline = getTextBaseline(parallel, configuredRotation, sideFlag, parallelFlipFlag);
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

export function estimateScaleTickCount<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>({
    scale,
    domain,
    range,
    visibleRange,
    label,
    defaultTickMinSpacing,
    interval,
}: GenerateTicksOptions<TScale, TDatum>): CountParams {
    const { minSpacing, maxSpacing } = interval ?? {};
    const { defaultTickCount } = scale;
    const rangeExtent = findRangeExtent(range);
    const zoomExtent = findRangeExtent(visibleRange);

    // Ordinal-time tick steps are discrete, so a lower tickCount need not yield fewer ticks;
    // minTickCount must be 0 or buildTickData's search cannot terminate.
    const isOrdinalTime = OrdinalTimeScale.is(scale);

    if (CategoryScale.is(scale) || (isOrdinalTime && domain.length < 1000)) {
        const maxTickCount = CategoryScale.is(scale)
            ? domain.length
            : Math.min(domain.length, Math.max(1, Math.floor(rangeExtent / (zoomExtent * defaultTickMinSpacing))));
        const estimatedTickCount = Math.ceil(rangeExtent / (zoomExtent * label.fontSize));
        return {
            tickCount: Math.min(estimatedTickCount, maxTickCount),
            minTickCount: 0,
            maxTickCount,
        };
    }

    const result = estimateTickCount(
        rangeExtent,
        zoomExtent,
        minSpacing,
        maxSpacing,
        defaultTickCount,
        defaultTickMinSpacing
    );
    if (isOrdinalTime) {
        result.minTickCount = 0;
    }
    return result;
}

function buildTickData<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickGenerationType: TickGenerationType,
    previousTickData: TickData,
    index: number,
    domainLimit: TDatum[] | undefined
): {
    index: number;
    tickData: TickData<TDatum> | undefined;
    intervalIgnored: boolean | undefined;
} {
    const { step, values } = options.interval ?? {};

    // Find the next tick data where the tick data is different from the previous tick data - and return the index of this data
    const { maxTickCount, minTickCount, tickCount } = estimateScaleTickCount(options);
    const countTicks = (i: number) => Math.max(tickCount - i, minTickCount);
    const regenerateTicks = step == null && values == null && countTicks(index) > minTickCount;
    const previousTicks = previousTickData.rawTicks;
    const maxIterations = tickCount - minTickCount;

    // First guess - generate ticks at the current index
    const countParams = { minTickCount, maxTickCount, tickCount: countTicks(index) };

    const nice = calculateNiceDomain(options, tickGenerationType, countParams);
    if (domainLimit != null && !domainWithin(nice.niceDomain, domainLimit)) {
        return { index: index + 1, tickData: undefined, intervalIgnored: undefined };
    }

    let nextTicks = calculateRawTicks(options, tickGenerationType, countParams, nice);
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
        intervalIgnored,
    } = nextTicks;

    return {
        tickData: {
            tickDomain,
            niceDomain,
            rawTicks,
            rawTickCount,
            fractionDigits,
            timeInterval,
            rawFirstTickIndex: rawFirstTickIndex ?? 0,
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
        intervalIgnored,
    };
}

function domainWithin(domain: unknown[], limit: unknown[]): boolean {
    const [d0, d1] = findMinMax(domain.map(Number));
    const [l0, l1] = findMinMax(limit.map(Number));
    return d0 >= l0 && d1 <= l1;
}

function calculateNiceDomain<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickGenerationType: TickGenerationType,
    countParams: CountParams
) {
    const { domain, reverse, visibleRange, scale, interval, niceMode, primaryTickCount } = options;

    const domainParams: ScaleTickParams<any> = {
        nice: niceMode.map((n) => n === NiceMode.TickAndDomain),
        interval: interval?.step,
        ...countParams,
    };

    let secondaryAxisTicks: { domain: TDatum[]; ticks: number[] } | undefined;
    if (
        tickGenerationType === TickGenerationType.CREATE_SECONDARY &&
        primaryTickCount != null &&
        domain.length > 0 &&
        ContinuousScale.is(scale)
    ) {
        secondaryAxisTicks = calculateNiceSecondaryAxis(scale, domain, primaryTickCount, reverse, visibleRange);
    }

    const niceDomain = niceMode.includes(NiceMode.TickAndDomain)
        ? (secondaryAxisTicks?.domain ?? scale.niceDomain(domainParams, domain))
        : domain;

    return { domainParams, secondaryAxisTicks, niceDomain };
}

function calculateRawTicks<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickGenerationType: TickGenerationType,
    countParams: CountParams,
    { domainParams, secondaryAxisTicks, niceDomain } = calculateNiceDomain(options, tickGenerationType, countParams)
) {
    const { reverse, visibleRange, scale, interval, primaryLabel, niceMode, minimumTimeGranularity } = options;

    const tickParams = {
        ...domainParams,
        nice: niceMode.map((n) => n === NiceMode.TickAndDomain || n === NiceMode.TicksOnly),
    };

    let tickDomain: TDatum[] = niceDomain;
    let rawTicks: any[] | undefined;
    let rawTickCount: number | undefined;
    let rawFirstTickIndex: number | undefined;
    let timeInterval: AnyTimeInterval | undefined;
    let primaryTicksIndices: Set<number> | undefined;
    let alignment: ScaleAlignment | undefined;
    let intervalIgnored: boolean | undefined;

    const generatePrimaryTicks = primaryLabel?.enabled === true && tickParams.interval == null;

    withTemporaryDomain(scale, niceDomain, () => {
        switch (tickGenerationType) {
            case TickGenerationType.VALUES:
                tickDomain = interval!.values!;
                rawTicks = interval!.values!;
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
                    intervalIgnored = tickGeneration?.intervalIgnored;
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

                const intervalTicks =
                    timeInterval == null
                        ? undefined
                        : getTimeIntervalTicks(
                              scale,
                              visibleRange,
                              tickCount,
                              maxTickCount,
                              tickParams,
                              timeInterval,
                              reverse,
                              minimumTimeGranularity
                          );
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
                    intervalIgnored = tickGeneration?.intervalIgnored;
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
        intervalIgnored,
    };
}

function createTimeLabelData<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickData: TickData,
    labelRotation: number,
    autoRotation: number
) {
    const { niceDomain, ticks, timeInterval } = tickData;
    if (timeInterval == null) return [];

    const spacing = ticksSpacing(ticks);
    const { label, labelOffset, primaryLabel, domain } = options;
    // Secondary labels are fitted on a continuous scale, which has no band to limit them, and at the
    // rotation they are drawn at, as the ticks they stand for are.
    const fitOptions = isLabelFitEnabled(label)
        ? axisLabelFit(
              label,
              options.isVertical,
              options.labelRoom ?? options.sizeLimit ?? Infinity,
              Infinity,
              axisLabelRotations(label.rotation)[0] + toDegrees(autoRotation),
              label.wrapping ?? 'never'
          )
        : undefined;
    const { width, height } = timeIntervalMaxLabelSize(
        label,
        primaryLabel,
        niceDomain ?? domain,
        timeInterval,
        fitOptions
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
    anchorOffset: number,
    labelRotation: number,
    labelPadding: Required<PaddingOptions>,
    textBaseline: VerticalAlign,
    textAlign: ResolvedTextAlign,
    bandOffsets?: number[]
) {
    const labelData: BoxBounds[] = [];
    const xPadding = labelPadding.left + labelPadding.right;
    const yPadding = labelPadding.top + labelPadding.bottom;

    for (let i = 0; i < tickData.length; i += 1) {
        const { tickLabel, textMetrics, translation, labelShift = 0 } = tickData[i];
        if (tickLabel == null || tickLabel === '') continue;

        const crossOffset = labelOffset + (bandOffsets?.[i] ?? 0);
        const { x, y } = rotatePoint(crossOffset, translation + anchorOffset + labelShift, labelRotation);
        const width = textMetrics.width + xPadding;
        const height = textMetrics.height + yPadding;
        // The boxes are compared in the label's own frame, where the anchor sits on the baseline:
        // a taller label hangs further above a bottom baseline than a shorter one does.
        const top = y + getVerticalAlignShift(textMetrics.height, 'top', textBaseline) - labelPadding.top;
        const left = x - textAlignShift(textMetrics.width, textAlign) - labelPadding.left;

        labelData.push({ x: left, y: top, width, height });
    }

    return labelData;
}

/** How far along the axis a label's padded box reaches, as drawn turned by `rotation` from the horizontal. */
function labelAlongExtent(
    { textMetrics, translation }: TickDatum,
    anchorOffset: number,
    rotation: number,
    isVertical: boolean,
    labelPadding: Required<PaddingOptions>,
    textBaseline: VerticalAlign,
    textAlign: ResolvedTextAlign
): [number, number] {
    const left = -textAlignShift(textMetrics.width, textAlign) - labelPadding.left;
    const top = getVerticalAlignShift(textMetrics.height, 'top', textBaseline) - labelPadding.top;
    const right = left + textMetrics.width + labelPadding.left + labelPadding.right;
    const bottom = top + textMetrics.height + labelPadding.top + labelPadding.bottom;
    const alongX = isVertical ? Math.sin(rotation) : Math.cos(rotation);
    const alongY = isVertical ? Math.cos(rotation) : -Math.sin(rotation);
    const min = Math.min(alongX * left, alongX * right) + Math.min(alongY * top, alongY * bottom);
    const max = Math.max(alongX * left, alongX * right) + Math.max(alongY * top, alongY * bottom);
    const anchor = translation + anchorOffset;
    return [anchor + min, anchor + max];
}

/** The along-axis size to refit a label to so it stays within `bounds`, or `undefined` when it already does. */
function alongWithin([min, max]: [number, number], anchor: number, [start, end]: [number, number]) {
    if (min >= start && max <= end) return undefined;
    let scale = 1;
    if (min < start && anchor > min) scale = Math.min(scale, (anchor - start) / (anchor - min));
    if (max > end && max > anchor) scale = Math.min(scale, (end - anchor) / (max - anchor));
    return Math.max(0, (max - min) * scale);
}

function isStridedLabel({ isPrimary, tickLabel }: TickDatum) {
    return !isPrimary && tickLabel != null && tickLabel !== '';
}

/** Keeps every tick, labelling only every `stride`th labelled one from the first. */
function showEveryNthLabel(ticks: TickDatum[], stride: number) {
    let labelIndex = 0;
    return ticks.map((tick) => {
        if (!isStridedLabel(tick)) return tick;
        return labelIndex++ % stride === 0 ? tick : { ...tick, tickLabel: undefined };
    });
}

function minTickGap(ticks: TickDatum[]) {
    let gap = Infinity;
    for (let i = 1; i < ticks.length; i++) {
        gap = Math.min(gap, Math.abs(ticks[i].translation - ticks[i - 1].translation));
    }
    return gap;
}

function textAlignShift(width: number, textAlign: ResolvedTextAlign) {
    if (textAlign === 'center') return width / 2;
    if (textAlign === 'right') return width;
    return 0;
}
