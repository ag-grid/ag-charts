import { type FormatterParams, _ModuleSupport } from 'ag-charts-community';
import { Property, type ScaleTickParams, isNumberEqual } from 'ag-charts-core';

import { loopSymmetrically } from '../../utils/polar';
import { AngleAxisInterval } from '../angle-number/angleAxisInterval';
import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';

const { CategoryScale } = _ModuleSupport;
export class AngleCategoryAxis extends AngleAxis<string, _ModuleSupport.BandScale<string>> {
    static readonly className = 'AngleCategoryAxis';
    static readonly type = 'angle-category' as const;

    @Property
    groupPaddingInner: number = 0;

    @Property
    paddingInner: number = 0;

    @Property
    override interval = new AngleAxisInterval();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new CategoryScale());
    }

    override hasDefinedDomain(): boolean {
        return false;
    }

    protected generateAngleTicks(domain: string[]) {
        const { scale, gridLength: radius } = this;
        const { values, minSpacing } = this.interval;
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
                loopSymmetrically(ticks, step, (_, next) => {
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
        const { minSpacing } = this.label;

        if (labelData.length < 3) return;

        const labelsCollide = (prev: AngleAxisLabelDatum, next: AngleAxisLabelDatum) => {
            if (prev.hidden || next.hidden) {
                return false;
            } else if (minSpacing == null) {
                return prev.box!.collidesBBox(next.box!);
            }
            const prevBox = prev.box!.clone().grow(minSpacing / 2);
            const nextBox = next.box!.clone().grow(minSpacing / 2);
            return prevBox.collidesBBox(nextBox);
        };

        const firstLabel = labelData[0];
        const lastLabel = labelData.at(-1)!;
        const visibleLabels = new Set<AngleAxisLabelDatum>([firstLabel]);
        const lastLabelIsOverFirst =
            isNumberEqual(firstLabel.x, lastLabel.x) && isNumberEqual(firstLabel.y, lastLabel.y);
        const maxStep = Math.floor(labelData.length / 2);
        for (let step = 1; step <= maxStep; step++) {
            const labels = lastLabelIsOverFirst ? labelData.slice(0, -1) : labelData;
            const collisionDetected = loopSymmetrically(labels, step, labelsCollide);
            if (!collisionDetected) {
                loopSymmetrically(labels, step, (_, next) => {
                    visibleLabels.add(next);
                });
                break;
            }
        }
        for (const datum of labelData) {
            if (!visibleLabels.has(datum)) {
                datum.hidden = true;
                datum.box = undefined;
            }
        }
    }

    override tickFormatParams(): _ModuleSupport.AxisTickFormatParams {
        return { type: 'category' };
    }

    override datumFormatParams(value: any, params: _ModuleSupport.FormatDatumParams): FormatterParams<any> {
        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        return { type: 'category', value, datum, seriesId, legendItemName, key, source, property, domain, boundSeries };
    }
}
