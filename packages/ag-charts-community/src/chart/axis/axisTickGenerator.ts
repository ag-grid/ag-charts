import { arraysEqual, countFractionDigits, isPlainObject } from 'ag-charts-core';

import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale, ScaleFormatParams, ScaleTickParams } from '../../scale/scale';
import { TimeScale } from '../../scale/timeScale';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { Matrix } from '../../scene/matrix';
import type { TextSizeProperties } from '../../scene/shape/text';
import { axisLabelsOverlap } from '../../scene/util/labelPlacement';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { compareDates } from '../../util/date';
import { findMinMax, findRangeExtent } from '../../util/number';
import { calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { createIdsGenerator } from '../../util/tempUtils';
import { CachedTextMeasurerPool, TextUtils } from '../../util/textMeasurer';
import { estimateTickCount, getTickTimeInterval } from '../../util/ticks';
import { TimeInterval } from '../../util/time';
import type { ChartAxis, ChartAxisLabel, ChartAxisLabelFlipFlag } from '../chartAxis';
import { calculateLabelRotation, createLabelData, getLabelSpacing, getTextAlign, getTextBaseline } from '../label';
import type { AxisInterval } from './axisInterval';
import type { TickInterval } from './axisTick';
import { NiceMode, type TickDatum } from './axisUtil';

export interface TickData<D = any> {
    tickDomain: D[];
    rawTicks: D[];
    fractionDigits: number;
    ticks: TickDatum[];
    primaryTicks: TickDatum[] | undefined;
    interpolate: boolean;
    timeInterval: TimeInterval | undefined;
    niceDomain?: D[];
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
    removeOverflowLabels: boolean;
    removeOverflowThreshold?: number;
}

export interface TickGenerationResult<D = any> {
    tickData: TickData<D>;
    primaryTickCount?: number;
    rotation: number;
    textBaseline: CanvasTextBaseline;
    textAlign: CanvasTextAlign;
}

interface TickStrategyParams<D = any> {
    readonly index: number;
    readonly tickData: TickData<D>;
    readonly textProps: TextSizeProperties;
    readonly terminate: boolean;
    readonly primaryTickCount: number | undefined;
    readonly visibleRange: [number, number];
    readonly labelOverlap: boolean;
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
    DROP_FIRST,
    VALUES,
}

const TICK_REGENERATION_THRESHOLD = 5;
const MAX_PRIMARY_TICK_RATIO = 0.66;

export interface TickGenerationAxis<S extends Scale<D, number, TickInterval<S>>, D> {
    readonly range: [number, number];
    readonly reverse: boolean;
    readonly scale: S;
    readonly label: ChartAxis['label'];
    readonly primaryLabel?: ChartAxis['label'];
    readonly interval: AxisInterval<S>;
    readonly defaultTickMinSpacing: number;
    readonly inRange: ChartAxis['inRange'];
    formatTick(
        value: any,
        index: number,
        domain: D[],
        fractionDigits?: number,
        formatter?: (datum: any) => string
    ): string;
}

function dateDomainExtent(domain: (Date | number)[]): [Date, Date] {
    return [new Date(domain[0]), new Date(domain[domain.length - 1])];
}

export class AxisTickGenerator<S extends Scale<D, number, TickInterval<S>>, D> {
    constructor(private readonly axis: TickGenerationAxis<S, D>) {}

    private estimateTickCount(visibleRange: [number, number], minSpacing?: number, maxSpacing?: number) {
        const { axis } = this;
        // @todo(AG-14471) - this probably wants to be BandScale.is
        const defaultTickCount = UnitTimeScale.is(axis.scale)
            ? axis.scale.bands.length
            : ContinuousScale.defaultTickCount;
        return estimateTickCount(
            findRangeExtent(axis.range),
            findRangeExtent(visibleRange),
            minSpacing,
            maxSpacing,
            defaultTickCount,
            axis.defaultTickMinSpacing
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
        domain,
        primaryTickCount,
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

        const { maxTickCount } = this.estimateTickCount(visibleRange, minSpacing, maxSpacing);

        const continuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
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

        const checkLabelOverlap = label.enabled && label.avoidCollisions;

        const initialRotation = configuredRotation + defaultRotation;
        const labelMatrix = new Matrix();
        const getLabelData = ({ ticks }: TickData, iterationRotation: number) => {
            const labelRotation = initialRotation + iterationRotation;
            Matrix.updateTransformMatrix(labelMatrix, 1, 1, labelRotation, 0, 0);
            return createLabelData(ticks, labelX, labelMatrix, textMeasurer);
        };

        const getLabelOverlap = (tickData: TickData, iterationRotation: number) => {
            if (!checkLabelOverlap) return false;

            const labelData = getLabelData(tickData, iterationRotation);

            const rotated = configuredRotation !== 0 || iterationRotation !== 0;
            const labelSpacing = getLabelSpacing(label.minSpacing, rotated);

            return axisLabelsOverlap(labelData, labelSpacing);
        };

        let tickData: TickData = {
            tickDomain: [],
            ticks: [],
            rawTicks: [],
            primaryTicks: undefined,
            interpolate: false,
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

            for (const strategy of this.getTickStrategies({ domain, niceMode, secondaryAxis, index })) {
                ({ tickData, index, autoRotation, terminate } = strategy({
                    index,
                    tickData,
                    textProps,
                    terminate,
                    primaryTickCount,
                    visibleRange,
                    // Lazily generate as only one strategy actually uses this, and it's expensive to compute
                    get labelOverlap() {
                        return getLabelOverlap(tickData, autoRotation);
                    },
                }));
            }

            labelOverlap = getLabelOverlap(tickData, autoRotation);
        }

        textAlign = getTextAlign(parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
        const rotation = configuredRotation + autoRotation;

        if (!secondaryAxis && tickData.rawTicks.length > 0) {
            primaryTickCount = tickData.rawTicks.length;
        }

        if (removeOverflowLabels && tickData.ticks.length > 2) {
            const labelData = getLabelData(tickData, autoRotation);
            const lastTick = tickData.ticks.at(-1);
            const lastLabel = labelData.at(-1);
            if (
                lastTick != null &&
                lastLabel != null &&
                lastTick.translationY + lastLabel.label.width / 2 > this.axis.range[1] + removeOverflowThreshold
            ) {
                lastTick.tickLabel = undefined;

                const firstTick = tickData.ticks[0];
                if (firstTick.translationY === 0 && visibleRange[0] === 0 && visibleRange[1] === 1) {
                    firstTick.tickLabel = undefined;
                }
            }
        }

        return { tickData, primaryTickCount, rotation, textBaseline, textAlign };
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

        if (!continuous && minSpacing != null) {
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

        if (UnitTimeScale.is(scale)) {
            const dropFirstIfNeededStrategy = ({
                index,
                tickData,
                labelOverlap,
                primaryTickCount,
                visibleRange,
                terminate,
            }: TickStrategyParams) => {
                if (!labelOverlap) return { index, tickData, autoRotation: 0, terminate };

                return this.createTickData(
                    domain,
                    niceMode,
                    visibleRange,
                    primaryTickCount,
                    TickGenerationType.DROP_FIRST,
                    index,
                    tickData,
                    terminate
                );
            };
            strategies.push(dropFirstIfNeededStrategy);
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

        const continuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        const countTicks = (i: number) => (continuous ? Math.max(tickCount - i, minTickCount) : maxTickCount);

        const regenerateTicks =
            step == null &&
            values == null &&
            countTicks(index) > minTickCount &&
            (continuous || tickGenerationType === TickGenerationType.FILTER);

        while (index <= maxIterations) {
            const previousTicks = tickData.rawTicks;
            const previousPrimaryTicks = tickData.primaryTicks;
            const previousInterpolate = tickData.interpolate;
            const previousTimeInterval = tickData.timeInterval;

            tickData = this.getTicks({
                domain,
                niceMode,
                visibleRange,
                tickGenerationType,
                previousTicks,
                previousPrimaryTicks,
                previousInterpolate,
                previousTimeInterval,
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

    private getIntervalTicks(
        niceDomain: Date[],
        visibleRange: [number, number],
        tickParams: ScaleTickParams<any>,
        timeInterval: TimeInterval
    ) {
        if (timeInterval.hierarchy == null) return;

        const { scale } = this.axis;
        const [d0, d1] = dateDomainExtent(niceDomain);
        const primaryTicks = timeInterval.hierarchy.range(d0, d1, { extend: true, visibleRange });

        const interpolate =
            UnitTimeScale.is(scale) && (scale.interval?.milliseconds ?? 0) < (timeInterval.milliseconds ?? Infinity);

        let ticks: Date[];
        if (TimeScale.is(scale) || UnitTimeScale.is(scale)) {
            ticks = [];
            const { milliseconds } = timeInterval;
            const intervalTickParams = {
                ...tickParams,
                interval: (milliseconds ?? timeInterval) as any,
            };
            for (let i = 0; i < primaryTicks.length - 1; i += 1) {
                const p0 = primaryTicks[i];
                const p1 = primaryTicks[i + 1];
                const intervalTicks = UnitTimeScale.is(scale)
                    ? scale.ticks(intervalTickParams, [p0, p1] as any, undefined, interpolate)
                    : (scale.ticks(intervalTickParams, [p0, p1] as any, undefined) as Date[]);
                if (intervalTicks == null || intervalTicks.length === 0) continue;

                const lastTick = ticks.at(-1);
                if (lastTick != null) {
                    let containsOverlap: boolean;
                    if (milliseconds) {
                        containsOverlap = intervalTicks[0].valueOf() - lastTick.valueOf() < milliseconds;
                    } else {
                        containsOverlap = lastTick.valueOf() === intervalTicks[0].valueOf();
                    }

                    if (containsOverlap) {
                        ticks.pop();
                    }
                }

                ticks.push(...intervalTicks);
            }

            ticks = ticks.filter((t) => compareDates(t, d0) >= 0 && compareDates(t, d1) <= 0);
        } else if (OrdinalTimeScale.is(scale)) {
            ticks = scale.ticks(tickParams, niceDomain, visibleRange) ?? [];
        } else {
            ticks = [];
        }

        // If the first primary tick has a better position than the first tick, remove it from the primary ticks.
        if (
            ticks.length > 0 &&
            primaryTicks.length > 0 &&
            compareDates(ticks[0], primaryTicks[0]) >= 0 &&
            DiscreteTimeScale.is(scale)
        ) {
            let previousTickValue: number | undefined;
            if (UnitTimeScale.is(scale) && scale.interval?.milliseconds != null) {
                previousTickValue = ticks[0].valueOf() - scale.interval.milliseconds;
                if (previousTickValue < niceDomain[0].valueOf()) previousTickValue = undefined;
            } else {
                let bands: readonly Date[];
                if (UnitTimeScale.is(scale)) {
                    // Note this is slow as it has to regenerate the bands
                    const scaleDomain = scale.domain;
                    (scale as UnitTimeScale).domain = niceDomain;
                    bands = scale.bands;
                    scale.domain = scaleDomain;
                } else {
                    bands = scale.bands;
                }
                const index = scale.findIndex(ticks[0]) ?? -1;
                const previousBand = index > 1 ? bands[index - 1] : undefined;
                previousTickValue = previousBand?.valueOf();
            }

            if (previousTickValue != null) {
                while (primaryTicks.length > 0 && previousTickValue > primaryTicks[0].valueOf()) {
                    primaryTicks.shift();
                }
            }
        }

        return { primaryTicks, ticks, interpolate };
    }

    private getTicks({
        domain,
        niceMode,
        visibleRange,
        tickGenerationType,
        previousTicks,
        previousPrimaryTicks,
        previousInterpolate,
        previousTimeInterval,
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
        previousPrimaryTicks: TickDatum[] | undefined;
        previousInterpolate: boolean;
        previousTimeInterval: TimeInterval | undefined;
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
        primaryTickCount?: number;
    }): TickData {
        const { axis } = this;
        const { label, primaryLabel, range, scale, interval } = axis;
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
        let tickDomain: D[] = niceDomain;
        let rawTicks: any[] | undefined;
        let timeInterval: TimeInterval | undefined;
        let primaryTicks: any[] | undefined;
        let interpolate = false;

        switch (tickGenerationType) {
            case TickGenerationType.VALUES:
                tickDomain = interval.values!;
                rawTicks = interval.values!;
                if (ContinuousScale.is(scale)) {
                    const [d0, d1] = findMinMax(niceDomain.map(Number));
                    rawTicks = rawTicks
                        .filter((value) => Number(value) >= d0 && Number(value) <= d1)
                        .sort((a, b) => Number(a) - Number(b));
                }
                break;

            case TickGenerationType.CREATE_SECONDARY:
                if (ContinuousScale.is(scale)) {
                    const secondaryAxisTicks = calculateNiceSecondaryAxis(
                        domain.map(Number),
                        primaryTickCount ?? 0,
                        axis.reverse
                    );

                    rawTicks = secondaryAxisTicks.ticks;
                    if (niceMode === NiceMode.TickAndDomain) {
                        niceDomain = secondaryAxisTicks.domain.map((d) => scale.toDomain(d)!);
                    }
                } else {
                    // AG-10654 Just use normal ticks for categorical axes.
                    rawTicks = scale.ticks(tickParams, niceDomain, visibleRange) ?? [];
                }
                break;

            case TickGenerationType.FILTER:
                rawTicks = this.filterTicks(previousTicks, tickCount);
                break;

            case TickGenerationType.DROP_FIRST:
                rawTicks = previousTicks.slice(1);
                if (
                    previousTicks.length > 2 &&
                    previousPrimaryTicks != null &&
                    previousTicks[0].valueOf() >= previousPrimaryTicks[0].valueOf() &&
                    previousTicks[0].valueOf() < previousPrimaryTicks[1].valueOf()
                ) {
                    // Drop first primary tick if the raw tick was a primary tick
                    primaryTicks = previousPrimaryTicks.slice(1);
                } else {
                    primaryTicks = previousPrimaryTicks;
                }
                interpolate = previousInterpolate;
                timeInterval = previousTimeInterval;
                break;

            default: {
                if (
                    niceDomain.length > 0 &&
                    (UnitTimeScale.is(scale) ||
                        (primaryLabel != null && (TimeScale.is(scale) || OrdinalTimeScale.is(scale))))
                ) {
                    const dates = niceDomain as (Date | number)[];
                    timeInterval = getTickTimeInterval(
                        dates[0].valueOf(),
                        dates[dates.length - 1].valueOf(),
                        tickCount,
                        minTickCount,
                        maxTickCount
                    );
                }

                if (primaryLabel != null) {
                    let firstLoop = true;
                    while (
                        timeInterval?.hierarchy &&
                        (rawTicks == null || rawTicks.length > TICK_REGENERATION_THRESHOLD) &&
                        (primaryTicks == null || primaryTicks.length > TICK_REGENERATION_THRESHOLD) &&
                        (rawTicks == null ||
                            primaryTicks == null ||
                            rawTicks.length < primaryTicks.length * (1 / MAX_PRIMARY_TICK_RATIO))
                    ) {
                        if (!firstLoop) {
                            timeInterval = timeInterval.hierarchy;
                        }

                        const intervalTicks = this.getIntervalTicks(
                            niceDomain as Date[],
                            visibleRange,
                            tickParams,
                            timeInterval
                        );
                        primaryTicks = intervalTicks?.primaryTicks;
                        rawTicks = intervalTicks?.ticks;
                        interpolate = intervalTicks?.interpolate ?? false;

                        firstLoop = false;
                    }
                }

                if (TimeScale.is(scale) || UnitTimeScale.is(scale)) {
                    tickParams.interval = domainParams.interval ?? (timeInterval as any);
                } else {
                    tickParams.interval = domainParams.interval;
                }
                rawTicks ??= scale.ticks(tickParams, niceDomain, visibleRange) ?? [];
            }
        }

        const fractionDigits = rawTicks.reduce(
            (max, tick) => Math.max(max, typeof tick === 'number' ? countFractionDigits(tick) : 0),
            0
        );

        const specifier =
            timeSpecifier(label, timeInterval) ?? (typeof label.format === 'string' ? label.format : undefined);

        const formatParams: ScaleFormatParams<D> = {
            domain: tickDomain,
            ticks: rawTicks,
            fractionDigits,
            specifier,
        };
        const labelFormatter = scale.tickFormatter(formatParams);

        const primarySpecifier = timeSpecifier(primaryLabel, timeInterval?.hierarchy);
        const primaryLabelFormatter = primarySpecifier
            ? scale.tickFormatter({
                  ...formatParams,
                  specifier: primarySpecifier,
              })
            : labelFormatter;

        // @todo(AG-13604) - the scale domain isn't updated yet. We need a better way to work out if something is in range.
        const scaleDomain = scale.domain;
        scale.domain = niceDomain;
        const halfBandwidth = (scale.bandwidth ?? 0) / 2;
        const ticks: TickDatum[] = [];
        const exactPrimaryTicks = interpolate;
        let primaryTickIndex = 0;
        for (let i = 0; i < rawTicks.length; i++) {
            const tick = rawTicks[i];
            const translationY = scale.convert(tick, { interpolate }) + halfBandwidth;

            let primary = false;
            while (primaryTicks != null && primaryTickIndex < primaryTicks.length) {
                const diff = compareDates(primaryTicks[primaryTickIndex], tick);
                if (exactPrimaryTicks ? diff === 0 : diff <= 0) {
                    primary = true;
                    primaryTickIndex++;
                } else {
                    break;
                }
            }

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !axis.inRange(translationY, 0.001)) continue;

            const tickLabelFormatter = primary ? primaryLabelFormatter : labelFormatter;
            const tickLabel = label.enabled
                ? axis.formatTick(tick, i, niceDomain, fractionDigits, tickLabelFormatter)
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
            fractionDigits,
            ticks,
            primaryTicks,
            interpolate,
            timeInterval,
            niceDomain,
        };
    }
}

function timeSpecifier(label: ChartAxisLabel | undefined, timeInterval: TimeInterval | undefined): string | undefined {
    if (label == null || timeInterval == null) return;

    const { format } = label;
    if (isPlainObject(format)) {
        return format[timeInterval.unit];
    } else {
        return format;
    }
}
