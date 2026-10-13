import {
    type AxisPrimaryTickCount,
    BandScale,
    DiscreteTimeScale,
    EllipsisChar,
    type ITextMeasurer,
    type NormalisedTextOrSegments,
    OrdinalTimeScale,
    type ResolvedTextAlign,
    type Scale,
    ScaleAlignment,
    type ScaleTickParams,
    TimeScale,
    UnitTimeScale,
    type WrapOptions,
    buildDateFormatter,
    cachedTextMeasurer,
    clipLines,
    compareDates,
    createIdsGenerator,
    dropFirstWhile,
    dropLastWhile,
    getInnerRectSize,
    getMaxInnerRectSize,
    hasRealChars,
    intervalCeil,
    intervalExtent,
    intervalFloor,
    intervalHierarchy,
    intervalMilliseconds,
    intervalNext,
    intervalPrevious,
    intervalRange,
    intervalUnit,
    isArray,
    isPlainObject,
    isSegmentTruncated,
    isTextTruncated,
    measureTextSegments,
    normalizeAngle360FromDegrees,
    toPlainText,
    toRadians,
    toTextString,
    toTimeInterval,
    wrapTextOrSegments,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle, VerticalAlign } from 'ag-charts-types';

import type { ChartAxisLabel, ChartAxisLabelFlipFlag } from '../chartAxis';
import { expandLabelPadding } from '../label';
import type { TickInterval } from './axisTick';
import { NiceMode, type TickDatum } from './axisUtil';

export type AnyTimeInterval = AgTimeInterval | AgTimeIntervalUnit;

export interface AxisIntervalOptions<S> {
    step?: TickInterval<S>;
    values?: any[];
    minSpacing?: number;
    maxSpacing?: number;
}

export interface GenerateTicksOptions<TScale extends Scale<TDatum, number, TickInterval<TScale>>, TDatum> {
    label: ChartAxisLabel;
    /** Whether labels render parallel to the axis line. Internal axis state — see I2. */
    parallel?: boolean;
    scale: TScale;
    domain: TDatum[];
    range: [number, number];
    visibleRange: [number, number];
    niceMode: NiceMode[];
    reverse: boolean;
    primaryTickCount: AxisPrimaryTickCount | undefined;
    defaultTickMinSpacing: number;
    axisRotation: number;
    labelOffset: number;
    sideFlag: ChartAxisLabelFlipFlag;
    primaryLabel?: ChartAxisLabel;
    interval: AxisIntervalOptions<TScale> | undefined;
    minimumTimeGranularity?: AgTimeIntervalUnit;
    sizeLimit?: number;
    /** Room across the axis for labels, net of ticks and scrollbars; set only when fitting. */
    labelRoom?: number;
    isVertical?: boolean;
    inRange?: (value: number) => boolean;
    /**
     * A configured `label.verticalAlign`, replacing the computed baseline the labels would otherwise
     * hang from. Collision avoidance measures each label's box from that baseline, so on a vertical
     * axis - where the baseline acts along the axis - neighbours of differing height are checked
     * where they will actually render.
     */
    labelBaseline?: VerticalAlign;
    /**
     * Per-label displacement, outward along the label offset, that `CartesianAxis.alignLabelBands` will apply once
     * the ticks are laid out (a configured `label.verticalAlign` flush, or a rotated label's box
     * pinned to its anchor). Collision avoidance runs before that move, so without this the labels it
     * approved can still be moved into each other. Returns `undefined` when nothing will move.
     */
    labelBandOffsets?: (
        this: void,
        ticks: TickDatum[],
        rotation: number,
        textAlign: ResolvedTextAlign,
        textBaseline: VerticalAlign
    ) => number[] | undefined;

    tickFormatter(
        this: void,
        domain: TDatum[],
        ticks: TDatum[],
        primary: boolean,
        fractionDigits: number | undefined,
        timeInterval: AnyTimeInterval | undefined,
        dateStyle: DateFormatterStyle
    ): (value: any, index: number) => NormalisedTextOrSegments | undefined;
}

export interface TickData<D = any> {
    niceDomain: D[];
    tickDomain: D[];
    rawTicks: D[];
    rawTickCount: number | undefined;
    fractionDigits: number;
    ticks: TickDatum[];
    timeInterval: AnyTimeInterval | undefined;
    // Absolute index of the first generated tick. TickDatum.index is offset by this (non-zero on
    // reversed/zoomed axes), so subtract it to recover the 0-based index the label formatter reports.
    rawFirstTickIndex: number;
}

enum ParentLevelMode {
    ContinuousTimeScaleTicks,
    UnitTimeScaleTicks,
    OrdinalTimeStepTicks,
    OrdinalTimeScaleTicks,
}

const DENSE_TICK_COUNT = 18;
const TICK_STEP_VALUES = [1, 2, 3, 4, 6, 8, 9, 10, 12]; // Multiples of 2 & 3

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
        const alignedInterval: AgTimeInterval = { ...toTimeInterval(interval), epoch: domain[0] };
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
        const bandwidth = BandScale.is(scale) ? scale.bandwidth : 0;
        const maxBandwidth = bandwidth === 0 ? Infinity : bandwidth;
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

        let maxWidth = isVertical ? sizeLimit : maxBandwidth;
        let maxHeight = isVertical ? maxBandwidth : sizeLimit;

        if (label.rotation != null && label.rotation !== 0) {
            const innerRect = getMaxInnerRectSize(label.rotation, maxWidth, maxHeight);
            maxWidth = innerRect.width;
            maxHeight = innerRect.height;
        }

        const wrapOptions = labelWrapOptions(label, maxWidth, maxHeight, label.truncate ? 'ellipsis' : 'hide');

        let fitOptions: { banded: WrapOptions; unbanded: WrapOptions } | undefined;
        if (isLabelFitEnabled(label)) {
            const room = options.labelRoom ?? sizeLimit;
            fitOptions = {
                banded: labelFitWrapOptions(label, isVertical, room, maxBandwidth),
                unbanded: labelFitWrapOptions(label, isVertical, room, Infinity),
            };
        }

        for (let i = 0; i < rawTicks.length; i++) {
            const tick = rawTicks[i];
            const translation = scale.convert(tick, { alignment }) + halfBandwidth;

            if (inRange && !inRange(translation)) continue;

            const isPrimary = primaryTicksIndices?.has(i) ?? false;
            const inputText = axisFormatter(isPrimary, tick, i);

            let wrappedLabel: NormalisedTextOrSegments | null = null;
            if (fitOptions != null && !isPrimary) {
                // Labels overflowing their band stay full width so they still drive rotation and thinning.
                const fitsBand =
                    maxBandwidth === Infinity ||
                    (label.avoidCollisions && hasRealChars(wrapTextOrSegments(inputText, wrapOptions)));
                wrappedLabel = wrapLabelToFit(inputText, fitsBand ? fitOptions.banded : fitOptions.unbanded, measurer);
            } else if (label.avoidCollisions) {
                const wrapped = wrapTextOrSegments(inputText, wrapOptions);
                wrappedLabel = wrapped === '' ? null : wrapped;
                if (wrappedLabel === EllipsisChar) {
                    wrappedLabel = null;
                }
            }

            const tickLabel = wrappedLabel ?? inputText;
            const isSegmented = isArray(tickLabel);
            const isTruncated =
                tickLabel !== inputText &&
                (isSegmented ? isSegmentTruncated(tickLabel.at(-1)) : isTextTruncated(toTextString(tickLabel)));

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
                fitSource: fitOptions != null && tickLabel !== inputText ? inputText : undefined,
                textMetrics: isSegmented
                    ? measureTextSegments(tickLabel, label)
                    : measurer.measureLines(toTextString(tickLabel)),
                translation: BandScale.is(scale) ? translation : Math.floor(translation),
            });
        }
    });

    return ticks;
}

export function isLabelFitEnabled(label: { maxWidth?: number; maxHeight?: number }) {
    return label.maxWidth != null || label.maxHeight != null;
}

function labelWrapOptions(
    label: ChartAxisLabel,
    maxWidth: number,
    maxHeight: number,
    overflow: WrapOptions['overflow'],
    textWrap: WrapOptions['textWrap'] = label.wrapping ?? 'never'
): WrapOptions {
    return { font: label, maxWidth, maxHeight, overflow, textWrap };
}

function wrapLabelToFit(text: NormalisedTextOrSegments, wrapOptions: WrapOptions, measurer: ITextMeasurer) {
    let fitted = wrapTextOrSegments(text, wrapOptions);
    if (!isArray(fitted) && wrapOptions.textWrap === 'never') {
        // `textWrap: 'never'` does not apply maxHeight, to a single line or to explicit line breaks.
        fitted = clipLines(fitted.split('\n'), measurer, wrapOptions).join('\n');
    }
    // A width narrower than the ellipsis still gets one, so a label that needs it is hidden.
    const { maxWidth } = wrapOptions;
    const ellipsisOverflows = isArray(fitted)
        ? fitted.some((s) => s.type !== 'image' && s.text.includes(EllipsisChar) && s.textMetrics.width > maxWidth)
        : fitted.includes(EllipsisChar) && measurer.textWidth(EllipsisChar) > maxWidth;
    return ellipsisOverflows ? '' : fitted;
}

function labelFitOverflow(label: ChartAxisLabel): WrapOptions['overflow'] {
    return label.truncate === false ? 'hide' : 'ellipsis';
}

/** Room left for the text once the padding around it, rotated with the label, is taken out. */
function labelTextRoom(label: ChartAxisLabel, isVertical: boolean | undefined, room: number, rotation: number) {
    const { left, right, top, bottom } = expandLabelPadding(label);
    const sin = Math.abs(Math.sin(rotation));
    const cos = Math.abs(Math.cos(rotation));
    const padding = isVertical
        ? (left + right) * cos + (top + bottom) * sin
        : (left + right) * sin + (top + bottom) * cos;
    return Math.max(0, room - padding);
}

function labelFitWrapOptions(
    label: ChartAxisLabel,
    isVertical: boolean | undefined,
    room: number,
    along: number
): WrapOptions {
    const textRoom = labelTextRoom(label, isVertical, room, toRadians(label.rotation ?? 0));
    let width = isVertical ? textRoom : along;
    let height = isVertical ? along : textRoom;
    if (label.rotation != null && label.rotation !== 0) {
        ({ width, height } = getInnerRectSize(label.rotation, width, height));
    }
    return labelWrapOptions(
        label,
        Math.max(0, Math.min(width, label.maxWidth ?? Infinity)),
        Math.max(0, Math.min(height, label.maxHeight ?? Infinity)),
        labelFitOverflow(label)
    );
}

/**
 * Re-fits auto-rotated labels onto one line so their rotated extent stays within the label room.
 * A re-fitted label is never taller than before; with `keepWidth` it is never wider either, so it
 * stays inside the box that cleared collision checking.
 */
export function refitAutoRotatedLabels<S extends Scale<D, number, TickInterval<S>>, D>(
    options: GenerateTicksOptions<S, D>,
    ticks: TickDatum[],
    autoRotation: number,
    keepWidth = false
): TickDatum[] {
    const { label, isVertical } = options;
    const labelRoom = labelTextRoom(
        label,
        isVertical,
        options.labelRoom ?? options.sizeLimit ?? Infinity,
        autoRotation
    );
    const sin = Math.abs(Math.sin(autoRotation));
    const cos = Math.abs(Math.cos(autoRotation));
    const widthFactor = isVertical ? cos : sin;
    const heightFactor = isVertical ? sin : cos;
    const maxHeight = Math.min(label.maxHeight ?? Infinity, heightFactor === 0 ? Infinity : labelRoom / heightFactor);
    const measurer = cachedTextMeasurer(label);
    const widthBudget = (height: number) =>
        Math.max(
            0,
            Math.min(
                widthFactor === 0 ? Infinity : (labelRoom - height * heightFactor) / widthFactor,
                label.maxWidth ?? Infinity
            )
        );
    const measure = (text: NormalisedTextOrSegments) =>
        isArray(text) ? measureTextSegments(text, label) : measurer.measureLines(toTextString(text));

    return ticks.map((tick) => {
        const { tickLabel, textMetrics } = tick;
        if (tick.isPrimary || tickLabel == null) return tick;
        if (textMetrics.width <= widthBudget(textMetrics.height) && textMetrics.height <= maxHeight) return tick;

        const source = tick.fitSource ?? tickLabel;
        const heightLimit = Math.min(maxHeight, textMetrics.height);
        const widthLimit = Math.min(label.maxWidth ?? Infinity, keepWidth ? textMetrics.width : Infinity);
        const fit = (maxWidth: number) =>
            wrapLabelToFit(
                source,
                labelWrapOptions(label, maxWidth, heightLimit, labelFitOverflow(label), 'never'),
                measurer
            );

        // Narrowing never adds lines, so the height measured here bounds the final label.
        let fitted = fit(widthLimit);
        let metrics = measure(fitted);
        const maxWidth = Math.min(widthBudget(metrics.height), widthLimit);
        if (metrics.width > maxWidth) {
            fitted = fit(maxWidth);
            metrics = measure(fitted);
        }

        const isTruncated = isArray(fitted) ? isSegmentTruncated(fitted.at(-1)) : isTextTruncated(fitted);
        return {
            ...tick,
            tickLabel: fitted,
            textUntruncated: isTruncated ? toPlainText(source) : undefined,
            textMetrics: metrics,
        };
    });
}

export function withTemporaryDomain<S extends Scale<D, number, TickInterval<S>>, D>(
    scale: S,
    temporaryDomain: D[],
    callback: () => void
): void {
    const originalDomain = scale.snapshotDomain();
    try {
        scale.domain = temporaryDomain;
        callback();
    } finally {
        scale.restoreDomain(originalDomain);
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
    const parentInterval = generatePrimaryTicks && timeInterval != null ? intervalHierarchy(timeInterval) : undefined;

    const primaryFormatter = generatePrimaryTicks
        ? tickFormatter(niceDomain, rawTicks, true, fractionDigits, parentInterval, dateStyle)
        : null;

    const defaultFormatter = labelEnabled
        ? tickFormatter(niceDomain, rawTicks, false, fractionDigits, timeInterval, dateStyle)
        : null;

    return (isPrimary: boolean, tick: D, index: number) => {
        if (isPrimary) {
            return primaryFormatter?.(tick, index) ?? String(tick);
        }
        // A disabled base tier yields a null defaultFormatter; emit empty text so the base labels stay
        // hidden while an enabled parent (primary) tier still renders.
        return defaultFormatter == null ? '' : (defaultFormatter(tick, index) ?? String(tick));
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
            case ParentLevelMode.UnitTimeScaleTicks: {
                const scaleTicks = scale.ticks(intervalTickParams, [p0, p1], pVisibleRange);
                intervalTicks = scaleTicks?.ticks ?? [];
                break;
            }
            case ParentLevelMode.OrdinalTimeScaleTicks: {
                const ordinalTicks = (scale as unknown as OrdinalTimeScale).ticks(
                    intervalTickParams,
                    [p0, p1],
                    pVisibleRange,
                    { extend: true, dropInitial: true }
                );
                intervalTicks = ordinalTicks?.ticks ?? [];
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

    const labelFormatter = buildDateFormatter(specifier);
    const hierarchy = timeInterval == null ? undefined : intervalHierarchy(timeInterval);
    const primarySpecifier = labelSpecifier(primaryLabel?.format, hierarchy);
    const primaryLabelFormatter = primarySpecifier == null ? labelFormatter : buildDateFormatter(primarySpecifier);

    const d0 = new Date(domain[0]);
    const d1 = new Date(domain.at(-1)!);

    const hierarchyRange =
        hierarchy == null
            ? undefined
            : intervalRange(hierarchy, new Date(domain[0]), new Date(domain.at(-1)!), { extend: true });

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
): VerticalAlign {
    if (parallel && labelRotation === 0) {
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
): ResolvedTextAlign {
    const labelRotated = labelRotation > 0 && labelRotation <= Math.PI;
    const labelAutoRotated = labelAutoRotation > 0 && labelAutoRotation <= Math.PI;
    const alignFlag = labelRotated || labelAutoRotated ? -1 : 1;

    if (parallel) {
        if (labelRotation !== 0 || labelAutoRotation !== 0) {
            if (sideFlag * alignFlag === -1) {
                return 'right';
            }
        } else {
            return 'center';
        }
    } else if (sideFlag * regularFlipFlag === -1) {
        return 'right';
    }

    return 'left';
}

function labelSpecifier(
    format: ChartAxisLabel['format'] | undefined,
    timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined
): string | undefined {
    if (format == null) return;
    if (typeof format === 'string') {
        return format;
    } else if (isPlainObject(format) && timeInterval != null) {
        return (format as Record<string, string>)[intervalUnit(timeInterval)];
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
    const parallelFlipFlag = configuredRotation === 0 && axisRotation >= 0 && axisRotation <= Math.PI ? -1 : 1;
    const regularFlipFlag =
        configuredRotation === 0 && axisRotation - Math.PI / 2 >= 0 && axisRotation - Math.PI / 2 <= Math.PI ? -1 : 1;
    const defaultRotation = parallel ? parallelFlipFlag * (Math.PI / 2) : 0;

    return { configuredRotation, defaultRotation, parallelFlipFlag, regularFlipFlag };
}
