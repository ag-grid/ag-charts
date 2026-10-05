import { type FormatterParams, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisID,
    type DynamicContext,
    type NormalisedAngleCategoryAxisOptions,
    type ScaleTickParams,
    hideCollidingRadialCategoryLabels,
    walkPairsOutward,
} from 'ag-charts-core';

import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';

const { CategoryScale } = _ModuleSupport;
export class AngleCategoryAxis extends AngleAxis<
    string,
    _ModuleSupport.BandScale<string>,
    NormalisedAngleCategoryAxisOptions
> {
    static readonly className = 'AngleCategoryAxis';
    static readonly type = 'angle-category' as const;

    constructor(
        moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>,
        id: AxisID,
        options: NormalisedAngleCategoryAxisOptions
    ) {
        super(moduleCtx, id, new CategoryScale(), options);
    }

    override hasDefinedDomain(): boolean {
        return false;
    }

    protected generateAngleTicks(domain: string[]) {
        const { scale, gridLength: radius } = this;
        const { values, minSpacing } = this.options.interval ?? {};
        const tickParams: ScaleTickParams<number> = {
            nice: [this.nice, this.nice],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: Infinity,
        };
        const ticks = values ?? scale.ticks(tickParams, domain)?.ticks ?? [];
        if (ticks.length < 2 || minSpacing == null) {
            return ticks.map((value) => {
                return { value, visible: true };
            });
        }

        const startTick = ticks[0];
        const startAngle = scale.convert(startTick);
        const startX = radius * Math.cos(startAngle);
        const startY = radius * Math.sin(startAngle);

        for (let step = 1; step < ticks.length - 1; step++) {
            const nextTick = ticks[step];
            const nextAngle = scale.convert(nextTick);
            if (nextAngle - startAngle > Math.PI) {
                // The tick spacing will not grow on the next step
                break;
            }
            const nextX = radius * Math.cos(nextAngle);
            const nextY = radius * Math.sin(nextAngle);
            const spacing = Math.hypot(nextX - startX, nextY - startY);
            if (spacing > minSpacing) {
                // Filter ticks by step
                const visibleTicks = new Set([startTick]);
                walkPairsOutward(ticks, step, (_, next) => {
                    visibleTicks.add(next);
                });
                return ticks.map((value) => {
                    const visible = visibleTicks.has(value);
                    return { value, visible };
                });
            }
        }

        // If there is no matching step, return a single tick
        return [{ value: startTick, visible: true }];
    }

    protected avoidLabelCollisions(labelData: AngleAxisLabelDatum[]) {
        hideCollidingRadialCategoryLabels(labelData, this.options.label.minSpacing);
    }

    override tickFormatParams(): _ModuleSupport.AxisTickFormatParams {
        return { type: 'category' };
    }

    override datumFormatParams(value: any, params: _ModuleSupport.FormatDatumParams): FormatterParams<any> {
        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        return { type: 'category', value, datum, seriesId, legendItemName, key, source, property, domain, boundSeries };
    }
}
