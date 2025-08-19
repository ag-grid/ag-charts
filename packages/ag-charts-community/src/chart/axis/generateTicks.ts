import { type BoxBounds, type WrapOptions, boxCollides, cachedTextMeasurer, countFractionDigits } from 'ag-charts-core';
import type { AgTimeIntervalUnit, DateFormatterStyle, PaddingOptions } from 'ag-charts-types';

import { CategoryScale } from '../../scale/categoryScale';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { type Scale, ScaleAlignment, type ScaleTickParams } from '../../scale/scale';
import { TimeScale } from '../../scale/timeScale';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { BBox } from '../../scene/bbox';
import { normalizeAngle360FromDegrees } from '../../util/angle';
import { findMinMax, findRangeExtent } from '../../util/number';
import { type AxisPrimaryTickCount, calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { estimateTickCount, getTickTimeInterval } from '../../util/ticks';
import { intervalMilliseconds } from '../../util/time';
import { lowestGranularityForInterval } from '../../util/timeFormatDefaults';
import type { ChartAxisLabel, ChartAxisLabelFlipFlag } from '../chartAxis';
import { expandLabelPadding } from '../label';
import type { AxisInterval } from './axisInterval';
import type { TickInterval } from './axisTick';
import { NiceMode } from './axisUtil';
import {
    type AnyTimeInterval,
    type TickData,
    calculateLabelRotation,
    formatTicks,
    getTextAlign,
    getTextBaseline,
    getTimeIntervalTicks,
    ticksEqual,
    ticksSpacing,
    timeIntervalMaxLabelSize,
} from './tickGenerationUtils';

enum TickGenerationType {
    CREATE,
    CREATE_SECONDARY,
    VALUES,
}

const sunday = new Date(1970, 0, 4);

export interface GenerateTicksOptions<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum> {
    domain: TDatum[];
    reverse: boolean;
    niceMode: NiceMode;
    range: [number, number];
    visibleRange: [number, number];

    defaultTickMinSpacing: number;
    primaryTickCount: AxisPrimaryTickCount | undefined;

    rotation: number;

    labelX: number;
    sideFlag: ChartAxisLabelFlipFlag;

    scale: TScale;
    label: ChartAxisLabel;
    primaryLabel?: ChartAxisLabel;
    interval: AxisInterval<TScale>;
    wrapOptions?: WrapOptions;
    minimumTimeGranularity?: AgTimeIntervalUnit;

    tickFormatter(
        this: void,
        domain: TDatum[],
        ticks: TDatum[],
        primary: boolean,
        fractionDigits: number | undefined,
        timeInterval: AnyTimeInterval | undefined,
        dateStyle: DateFormatterStyle
    ): (value: any, index: number) => string | undefined;
}

export function generateTicks<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>
) {
    const { domain, label, rotation, sideFlag } = options;
    const { maxTickCount } = estimateScaleTickCount(options);
    const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation(
        label.rotation,
        label.parallel,
        rotation
    );

    const maxIterations = Number.isFinite(maxTickCount) ? maxTickCount : 10;
    const textBaseline = getTextBaseline(label.parallel, configuredRotation, sideFlag, parallelFlipFlag);
    const checkLabelOverlap = label.enabled && label.avoidCollisions;
    const initialRotation = configuredRotation + defaultRotation;

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
    const tickGenerationType = getTickGenerationType(options);

    while (labelOverlap && index <= maxIterations) {
        ({ tickData, index } = createTickData(options, tickGenerationType, tickData, index));

        autoRotation =
            tryAutoRotate && getLabelOverlap(options, tickData, initialRotation)
                ? normalizeAngle360FromDegrees(label.autoRotateAngle)
                : 0;

        labelOverlap = checkLabelOverlap && getLabelOverlap(options, tickData, initialRotation + autoRotation);
    }

    const textAlign = getTextAlign(label.parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);

    return { tickData, rotation: configuredRotation + autoRotation, textBaseline, textAlign };
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
}: GenerateTicksOptions<TScale, TDatum>) {
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

    return estimateTickCount(rangeExtent, zoomExtent, minSpacing, maxSpacing, defaultTickCount, defaultTickMinSpacing);
}

function createTickData<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
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

    let nextTicks = getTicks(options, tickGenerationType, countParams);
    if (regenerateTicks && ticksEqual(nextTicks.rawTicks, previousTicks)) {
        // Ticks didn't change
        // Use binary search to find the index, as there could be a lot of ticks in some cases
        let lowerBound = index;
        let upperBound = maxIterations;
        while (lowerBound <= upperBound) {
            index = ((lowerBound + upperBound) / 2) | 0;
            countParams.tickCount = countTicks(index);
            const nextTicksCandidate = getTicks(options, tickGenerationType, countParams);

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

function getTicks<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickGenerationType: TickGenerationType,
    countParams: { minTickCount: number; maxTickCount: number; tickCount: number }
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
        nice: niceMode === NiceMode.TickAndDomain,
        interval: interval.step,
        ...countParams,
    };

    const tickParams = {
        ...domainParams,
        nice: niceMode === NiceMode.TickAndDomain || niceMode === NiceMode.TicksOnly,
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

    const niceDomain =
        niceMode === NiceMode.TickAndDomain
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
            const { tickCount, minTickCount, maxTickCount } = countParams;

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

function getLabelOverlap<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickData: TickData,
    rotation = 0
): boolean {
    const { label, labelX } = options;
    const padding = expandLabelPadding(label);
    const spacing = label.minSpacing ?? (rotation ? 0 : 10);

    return (
        axisLabelsOverlap(getTimeLabelData(options, tickData, rotation), spacing) ||
        axisLabelsOverlap(getLabelData(tickData, labelX, rotation, padding), spacing)
    );
}

function getLabelData({ ticks }: TickData, labelX: number, labelRotation: number, labelPadding: PaddingOptions) {
    const labelData: BoxBounds[] = [];
    for (const { tickLabel, textMetrics, translation } of ticks) {
        if (!tickLabel) continue;
        const [x, y] = rotatePoint(labelX, translation, labelRotation);
        labelData.push(new BBox(x, y, textMetrics.width, textMetrics.height).grow(labelPadding));
    }
    return labelData;
}

function getTimeLabelData<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum>(
    options: GenerateTicksOptions<TScale, TDatum>,
    tickData: TickData,
    labelRotation: number
) {
    const { niceDomain, ticks, timeInterval } = tickData;
    if (timeInterval == null) return [];

    const spacing = ticksSpacing(ticks);
    const { label, labelX, primaryLabel, domain } = options;
    const { width, height } = timeIntervalMaxLabelSize(
        label,
        primaryLabel,
        niceDomain ?? domain,
        timeInterval,
        cachedTextMeasurer(label)
    );

    const labelData: BoxBounds[] = [];
    for (const translation of [0, spacing]) {
        const [x, y] = rotatePoint(labelX, translation, labelRotation);
        labelData.push({ x, y, width, height });
    }
    return labelData;
}

function rotatePoint(x: number, y: number, rotation: number): [number, number] {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const xRotated = x * cos - y * sin;
    const yRotated = x * sin + y * cos;
    return [xRotated, yRotated];
}

function axisLabelsOverlap(data: readonly BoxBounds[], padding: number = 0): boolean {
    const result: BoxBounds[] = [];

    for (const datum of data) {
        const { x, y } = datum;
        let { width, height } = datum;

        width += padding;
        height += padding;

        if (result.some((l) => boxCollides(l, x, y, width, height))) {
            return true;
        }

        result.push({ x, y, width, height });
    }

    return false;
}
