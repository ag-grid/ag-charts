import {
    type BoxBounds,
    type ITextMeasurer,
    type LocaleString,
    type WrapOptions,
    boxCollides,
    buildDateFormatter,
    cachedTextMeasurer,
    dropFirstWhile,
    dropLastWhile,
    isArray,
    isPlainObject,
    isSegmentTruncated,
    measureTextSegments,
    toPlainText,
    wrapTextOrSegments,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle, TextOrSegments } from 'ag-charts-types';

import { BandScale } from '../../scale/bandScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { type Scale, ScaleAlignment, type ScaleTickParams } from '../../scale/scale';
import { TimeScale } from '../../scale/timeScale';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { normalizeAngle360FromDegrees } from '../../util/angle';
import { compareDates } from '../../util/date';
import type { AxisPrimaryTickCount } from '../../util/secondaryAxisTicks';
import { createIdsGenerator } from '../../util/tempUtils';
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
import type { ChartAxisLabel, ChartAxisLabelFlipFlag } from '../chartAxis';
import { expandLabelPadding } from '../label';
import type { AxisInterval } from './axisInterval';
import type { TickInterval } from './axisTick';
import { NiceMode, type TickDatum } from './axisUtil';

export type AnyTimeInterval = AgTimeInterval | AgTimeIntervalUnit;

export interface GenerateTicksOptions<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum> {
    locale: LocaleString;
    label: ChartAxisLabel;
    scale: TScale;
    domain: TDatum[];
    range: [number, number];
    visibleRange: [number, number];
    niceMode: NiceMode;
    reverse: boolean;
    primaryTickCount: AxisPrimaryTickCount | undefined;
    defaultTickMinSpacing: number;
    axisRotation: number;
    labelOffset: number;
    sideFlag: ChartAxisLabelFlipFlag;
    primaryLabel?: ChartAxisLabel;
    interval: AxisInterval<TScale>;
    minimumTimeGranularity?: AgTimeIntervalUnit;
    sizeLimit?: number;
    isVertical?: boolean;
    inRange?: (value: number) => boolean;

    tickFormatter(
        this: void,
        domain: TDatum[],
        ticks: TDatum[],
        primary: boolean,
        fractionDigits: number | undefined,
        timeInterval: AnyTimeInterval | undefined,
        dateStyle: DateFormatterStyle
    ): (value: any, index: number) => TextOrSegments | undefined;
}

export interface TickData<D = any> {
    niceDomain: D[];
    tickDomain: D[];
    rawTicks: D[];
    rawTickCount: number | undefined;
    fractionDigits: number;
    ticks: TickDatum[];
    timeInterval: AnyTimeInterval | undefined;
}

enum ParentLevelMode {
    ContinuousTimeScaleTicks,
    UnitTimeScaleTicks,
    OrdinalTimeStepTicks,
    OrdinalTimeScaleTicks,
}

const DENSE_TICK_COUNT = 18;
const TICK_STEP_VALUES = [1, 2, 3, 4, 6, 8, 9, 10, 12]; // Multiples of 2 & 3

export function axisLabelsOverlap(data: readonly BoxBounds[], padding: number = 0): boolean {
    const result: BoxBounds[] = [];

    for (const datum of data) {
        const { x, y, width, height } = datum;
        if (result.some((l) => boxCollides(l, x, y, width + padding, height + padding))) {
            return true;
        }
        result.push(datum);
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

export function ticksEqual(a: unknown[], b: unknown[]) {
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

export function ticksSpacing(ticks: TickDatum[]) {
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

export function formatTicks<S extends Scale<D, number, TickInterval<S>>, D>(
    options: GenerateTicksOptions<S, D>,
    {
        niceDomain,
        rawTicks,
        rawFirstTickIndex = 0,
        generatePrimaryTicks,
        primaryTicksIndices,
        alignment,
        fractionDigits,
        timeInterval,
    }: {
        niceDomain: D[];
        rawTicks: any[];
        rawFirstTickIndex: number | undefined;
        generatePrimaryTicks: boolean;
        primaryTicksIndices: Set<number> | undefined;
        alignment: ScaleAlignment | undefined;
        fractionDigits: number;
        timeInterval: AnyTimeInterval | undefined;
    }
): TickDatum[] {
    const { scale, label, tickFormatter, inRange, isVertical, sizeLimit = Infinity } = options;
    const isContinuous = TimeScale.is(scale) || DiscreteTimeScale.is(scale);
    const measurer = cachedTextMeasurer(label);
    const idGenerator = createIdsGenerator();
    const ticks: TickDatum[] = [];

    withTemporaryDomain(scale, niceDomain, () => {
        const maxBandwidth = BandScale.is(scale) ? scale.bandwidth ?? Infinity : Infinity;
        const halfBandwidth = (scale.bandwidth ?? 0) / 2;
        const axisFormatter = axisTickFormatter(
            label.enabled,
            generatePrimaryTicks,
            niceDomain,
            rawTicks,
            fractionDigits,
            timeInterval,
            tickFormatter
        );
        const wrapOptions: WrapOptions = {
            font: label,
            maxWidth: isVertical ? sizeLimit : maxBandwidth,
            maxHeight: isVertical ? maxBandwidth : sizeLimit,
            overflow: label.truncate ? 'ellipsis' : 'hide',
            textWrap: label.wrapping,
        };

        for (let i = 0; i < rawTicks.length; i++) {
            const tick = rawTicks[i];
            const translation = scale.convert(tick, { alignment }) + halfBandwidth;

            if (inRange && !inRange(translation)) continue;

            const isPrimary = primaryTicksIndices?.has(i) ?? false;
            const inputText = axisFormatter(isPrimary, tick, i);

            let wrappedLabel: TextOrSegments | null = null;
            if (label.avoidCollisions) {
                wrappedLabel = wrapTextOrSegments(inputText, wrapOptions) || null;
            }

            const tickLabel = wrappedLabel ?? inputText;
            const isSegmented = isArray(tickLabel);
            const isTruncated = tickLabel !== inputText && (!isSegmented || isSegmentTruncated(tickLabel.at(-1)));

            let tickId: string;
            if (isContinuous) {
                const tickValue = tick?.valueOf();
                if (Number.isFinite(tickValue)) {
                    tickId = idGenerator(`v:${tickValue}`);
                }
            }
            tickId ??= idGenerator(`l:${isSegmented ? toPlainText(tickLabel.flat()) : tickLabel}`);

            ticks.push({
                tick,
                tickId,
                tickLabel,
                isPrimary,
                index: i + rawFirstTickIndex,
                textUntruncated: isTruncated ? toPlainText(inputText) : undefined,
                textMetrics: isSegmented ? measureTextSegments(tickLabel, label) : measurer.measureLines(tickLabel),
                translation: Math.floor(translation),
            });
        }
    });

    return ticks;
}

export function withTemporaryDomain<S extends Scale<D, number, TickInterval<S>>, D>(
    scale: S,
    temporaryDomain: D[],
    callback: () => void
): void {
    const originalDomain = scale.domain;
    try {
        scale.domain = temporaryDomain;
        callback();
    } finally {
        scale.domain = originalDomain;
    }
}

function axisTickFormatter<S extends Scale<D, number, TickInterval<S>>, D>(
    labelEnabled: boolean,
    generatePrimaryTicks: boolean,
    niceDomain: D[],
    rawTicks: any[],
    fractionDigits: number,
    timeInterval: AnyTimeInterval | undefined,
    tickFormatter: GenerateTicksOptions<S, D>['tickFormatter']
) {
    const dateStyle: DateFormatterStyle = generatePrimaryTicks ? 'component' : 'long';
    const parentInterval = generatePrimaryTicks && timeInterval ? intervalHierarchy(timeInterval) : undefined;

    const primaryFormatter = generatePrimaryTicks
        ? tickFormatter(niceDomain, rawTicks, true, fractionDigits, parentInterval, dateStyle)
        : null;

    const defaultFormatter = labelEnabled
        ? tickFormatter(niceDomain, rawTicks, false, fractionDigits, timeInterval, dateStyle)
        : null;

    return (isPrimary: boolean, tick: D, index: number) => {
        const formatter = isPrimary ? primaryFormatter : defaultFormatter;
        return formatter?.(tick, index) ?? String(tick);
    };
}

export function getTimeIntervalTicks<S extends Scale<D, number, TickInterval<S>>, D>(
    scale: S,
    visibleRange: [number, number],
    tickCount: number,
    maxTickCount: number,
    tickParams: Readonly<ScaleTickParams<any>>,
    timeInterval: AnyTimeInterval,
    reverse: boolean,
    minimumTimeGranularity?: AgTimeIntervalUnit
) {
    if (!TimeScale.is(scale) && !DiscreteTimeScale.is(scale)) return;

    const parentInterval = intervalHierarchy(timeInterval);

    if (parentInterval == null) return;
    if (reverse) {
        visibleRange = [1 - visibleRange[1], 1 - visibleRange[0]];
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const dv0 = Math.min(scale.domain[0].valueOf() as number, scale.domain.at(-1)!.valueOf() as number);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const dv1 = Math.max(scale.domain[0].valueOf() as number, scale.domain.at(-1)!.valueOf() as number);

    // Generate at least one tick outside the range on each side
    let [dp0, dp1] = intervalExtent(new Date(dv0), new Date(dv1), visibleRange);
    dp0 = intervalFloor(parentInterval, dp0);
    if (dp0.valueOf() >= dv0) {
        dp0 = intervalPrevious(parentInterval, dp0);
    }
    dp1 = intervalCeil(parentInterval, dp1);
    if (dp1.valueOf() <= dv1) {
        dp1 = intervalNext(parentInterval, dp1);
    }

    const primaryTicks = intervalRange(parentInterval, dp0, dp1);
    const milliseconds = intervalMilliseconds(timeInterval);
    const skipFirstPrimaryTick = OrdinalTimeScale.is(scale);
    const intervalTickParams = { ...tickParams, interval: timeInterval };
    const ticks = [];

    let primaryTicksIndices: Set<number> | undefined;
    let parentLevelMode: ParentLevelMode;
    let alignment: ScaleAlignment | undefined;
    let ordinalTickStep = 0;

    if (OrdinalTimeScale.is(scale)) {
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
            case ParentLevelMode.OrdinalTimeScaleTicks: {
                const scaleTicks = scale.ticks(intervalTickParams, [p0, p1], pVisibleRange, {
                    extend: true,
                    dropInitial: true,
                });
                intervalTicks = scaleTicks?.ticks ?? [];
                break;
            }
            case ParentLevelMode.OrdinalTimeStepTicks:
                intervalTicks = (scale as unknown as OrdinalTimeScale).stepTicks(
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

export function timeIntervalMaxLabelSize(
    locale: LocaleString,
    label: ChartAxisLabel,
    primaryLabel: ChartAxisLabel | undefined,
    domain: Date[],
    timeInterval: AgTimeInterval | AgTimeIntervalUnit,
    textMeasurer: ITextMeasurer
) {
    const specifier = labelSpecifier(label.format, timeInterval);

    if (specifier == null) {
        return { width: 0, height: 0 };
    }

    const labelFormatter = buildDateFormatter(locale, specifier);
    const hierarchy = timeInterval ? intervalHierarchy(timeInterval) : undefined;
    const primarySpecifier = labelSpecifier(primaryLabel?.format, hierarchy);
    const primaryLabelFormatter = primarySpecifier ? buildDateFormatter(locale, primarySpecifier) : labelFormatter;

    const d0 = new Date(domain[0]);
    const d1 = new Date(domain.at(-1)!);

    const hierarchyRange = hierarchy
        ? intervalRange(hierarchy, new Date(domain[0]), new Date(domain.at(-1)!), { extend: true })
        : undefined;

    let maxWidth = 0;
    let maxHeight = 0;
    if (labelFormatter != null) {
        const padding = expandLabelPadding(label);
        const xPadding = padding.left + padding.right;
        const yPadding = padding.top + padding.bottom;
        let l0: Date;
        let l1: Date;
        if (hierarchyRange != null && hierarchyRange.length > 1) {
            l0 = hierarchyRange[0];
            l1 = hierarchyRange[1];
        } else {
            l0 = d0;
            l1 = d1;
        }
        const labelRange = intervalRange(timeInterval, l0, l1, { limit: 50 });
        for (const date of labelRange) {
            const text = labelFormatter(date);
            const { width, height } = textMeasurer.measureLines(text);
            maxWidth = Math.max(maxWidth, width + xPadding);
            maxHeight = Math.max(maxHeight, height + yPadding);
        }
    }

    if (primaryLabelFormatter != null && hierarchyRange != null) {
        const padding = expandLabelPadding(primaryLabel);
        const xPadding = padding.left + padding.right;
        const yPadding = padding.top + padding.bottom;
        for (const date of hierarchyRange) {
            const text = primaryLabelFormatter(date);
            const { width, height } = textMeasurer.measureLines(text);

            maxWidth = Math.max(maxWidth, width + xPadding);
            maxHeight = Math.max(maxHeight, height + yPadding);
        }
    }

    return {
        width: Math.ceil(maxWidth),
        height: Math.ceil(maxHeight),
    };
}

export function getTextBaseline(
    parallel: boolean,
    labelRotation: number,
    sideFlag: ChartAxisLabelFlipFlag,
    parallelFlipFlag: ChartAxisLabelFlipFlag
): CanvasTextBaseline {
    if (parallel && !labelRotation) {
        return sideFlag * parallelFlipFlag === -1 ? 'top' : 'bottom';
    }
    return 'middle';
}

export function getTextAlign(
    parallel: boolean,
    labelRotation: number,
    labelAutoRotation: number,
    sideFlag: ChartAxisLabelFlipFlag,
    regularFlipFlag: ChartAxisLabelFlipFlag
): CanvasTextAlign {
    const labelRotated = labelRotation > 0 && labelRotation <= Math.PI;
    const labelAutoRotated = labelAutoRotation > 0 && labelAutoRotation <= Math.PI;
    const alignFlag = labelRotated || labelAutoRotated ? -1 : 1;

    if (parallel) {
        if (labelRotation || labelAutoRotation) {
            if (sideFlag * alignFlag === -1) {
                return 'end';
            }
        } else {
            return 'center';
        }
    } else if (sideFlag * regularFlipFlag === -1) {
        return 'end';
    }

    return 'start';
}

function labelSpecifier(
    format: ChartAxisLabel['format'] | undefined,
    timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined
): string | undefined {
    if (format == null) return;
    if (typeof format === 'string') {
        return format;
    } else if (isPlainObject(format) && timeInterval != null) {
        return format[intervalUnit(timeInterval)];
    }
}

export function calculateLabelRotation(
    rotation?: number,
    parallel?: boolean,
    axisRotation: number = 0
): {
    configuredRotation: number;
    defaultRotation: number;
    parallelFlipFlag: ChartAxisLabelFlipFlag;
    regularFlipFlag: ChartAxisLabelFlipFlag;
} {
    const configuredRotation = normalizeAngle360FromDegrees(rotation);
    const parallelFlipFlag = !configuredRotation && axisRotation >= 0 && axisRotation <= Math.PI ? -1 : 1;
    const regularFlipFlag =
        !configuredRotation && axisRotation - Math.PI / 2 >= 0 && axisRotation - Math.PI / 2 <= Math.PI ? -1 : 1;

    let defaultRotation = 0;
    if (parallel) {
        defaultRotation = parallelFlipFlag * (Math.PI / 2);
    } else if (regularFlipFlag === -1) {
        defaultRotation = Math.PI;
    }

    return { configuredRotation, defaultRotation, parallelFlipFlag, regularFlipFlag };
}
