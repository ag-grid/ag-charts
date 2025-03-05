import { arraysEqual, countFractionDigits } from 'ag-charts-core';

import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale, ScaleFormatParams, ScaleTickParams } from '../../scale/scale';
import { Matrix } from '../../scene/matrix';
import type { TextSizeProperties } from '../../scene/shape/text';
import { axisLabelsOverlap } from '../../scene/util/labelPlacement';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { findMinMax, findRangeExtent } from '../../util/number';
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
    tickDomain: D[];
    rawTicks: D[];
    fractionDigits: number;
    ticks: TickDatum[];
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
}

export interface TickGenerationResult<D = any> {
    tickData: TickData<D>;
    primaryTickCount?: number;
    combinedRotation: number;
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
    VALUES,
}

export interface TickGenerationAxis<S extends Scale<D, number, TickInterval<S>>, D> {
    readonly range: [number, number];
    readonly reverse: boolean;
    readonly scale: S;
    readonly label: ChartAxis['label'];
    readonly interval: AxisInterval<S>;
    readonly defaultTickMinSpacing: number;
    readonly inRange: ChartAxis['inRange'];
    formatTick(value: any, index: number, fractionDigits?: number, formatter?: (datum: any) => string): string;
}

export class AxisTickGenerator<S extends Scale<D, number, TickInterval<S>>, D> {
    constructor(private readonly axis: TickGenerationAxis<S, D>) {}

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
        const offset = ticks.length % keepEvery ? -1 : 0;
        return ticks.filter((_: any, i: number) => (i + offset) % keepEvery === 0);
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
            label,
            interval: { minSpacing, maxSpacing },
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

        const checkLabelOverlap = label.enabled && label.avoidCollisions;

        const getLabelOverlap = ({ ticks }: TickData, iterationRotation: number) => {
            if (!checkLabelOverlap) return false;

            const rotated = configuredRotation !== 0 || iterationRotation !== 0;
            const labelRotation = initialRotation + iterationRotation;
            const labelSpacing = getLabelSpacing(label.minSpacing, rotated);

            Matrix.updateTransformMatrix(labelMatrix, 1, 1, labelRotation, 0, 0);

            const labelData = createLabelData(ticks, labelX, labelMatrix, textMeasurer);
            return axisLabelsOverlap(labelData, labelSpacing);
        };

        let tickData: TickData = {
            tickDomain: [],
            ticks: [],
            rawTicks: [],
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
        const combinedRotation = defaultRotation + configuredRotation + autoRotation;

        if (!secondaryAxis && tickData.rawTicks.length > 0) {
            primaryTickCount = tickData.rawTicks.length;
        }

        return { tickData, primaryTickCount, combinedRotation, textBaseline, textAlign };
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
        const { label, range, scale, interval } = axis;
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
        let rawTicks: any[];

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
                    niceDomain = secondaryAxisTicks.domain.map((d) => scale.toDomain(d)!);
                } else {
                    // AG-10654 Just use normal ticks for categorical axes.
                    rawTicks = scale.ticks(tickParams, niceDomain, visibleRange) ?? [];
                }
                break;

            case TickGenerationType.FILTER:
                rawTicks = this.filterTicks(previousTicks, tickCount);
                break;

            default:
                rawTicks = scale.ticks(tickParams, niceDomain, visibleRange) ?? [];
        }

        const fractionDigits = rawTicks.reduce(
            (max, tick) => Math.max(max, typeof tick === 'number' ? countFractionDigits(tick) : 0),
            0
        );

        const formatParams: ScaleFormatParams<D> = {
            domain: tickDomain,
            ticks: rawTicks,
            fractionDigits,
            specifier: label.format,
        };
        const labelFormatter = scale.tickFormatter(formatParams);

        // @todo(AG-13604) - the scale domain isn't updated yet. We need a better way to work out if something is in range.
        const scaleDomain = scale.domain;
        scale.domain = niceDomain;
        const halfBandwidth = (scale.bandwidth ?? 0) / 2;
        const ticks: TickDatum[] = [];
        for (let i = 0; i < rawTicks.length; i++) {
            const tick = rawTicks[i];
            const translationY = scale.convert(tick) + halfBandwidth;

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !axis.inRange(translationY, 0.001)) continue;

            const tickLabel = label.enabled ? axis.formatTick(tick, i, fractionDigits, labelFormatter) : '';

            // Create a tick id from the label, or as an increment of the last label if this tick label is blank
            ticks.push({ tick, tickId: idGenerator(tickLabel), tickLabel, translationY: Math.floor(translationY) });
        }
        scale.domain = scaleDomain;

        return {
            tickDomain,
            rawTicks,
            fractionDigits,
            ticks,
            niceDomain,
        };
    }
}
