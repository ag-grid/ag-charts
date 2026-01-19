import { type FormatterParams, _ModuleSupport } from 'ag-charts-community';
import type { DomainWithMetadata } from 'ag-charts-core';
import {
    Property,
    type ScaleTickParams,
    angleBetween,
    findMinMax,
    isNumberEqual,
    normalisedExtentWithMetadata,
} from 'ag-charts-core';

import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';
import { AngleAxisInterval } from './angleAxisInterval';
import { LinearAngleScale } from './linearAngleScale';

export class AngleNumberAxis extends AngleAxis<number, LinearAngleScale> {
    static readonly className = 'AngleNumberAxis';
    static readonly type = 'angle-number' as const;

    override shape = 'circle' as const;

    @Property
    min?: number;

    @Property
    max?: number;

    @Property
    preferredMin?: number;

    @Property
    preferredMax?: number;

    @Property
    override interval = new AngleAxisInterval();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new LinearAngleScale());
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this;
        return min != null && max != null && min < max;
    }

    override normaliseDataDomain(d: DomainWithMetadata<number>) {
        const { min, max, preferredMin, preferredMax } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(
            d.domain,
            min,
            max,
            preferredMin,
            preferredMax,
            undefined,
            d.sortMetadata?.sortOrder
        );

        return { domain: extent, clipped };
    }

    override getDomainExtentsNice(): [boolean, boolean] {
        return [this.min == null && this.nice, this.max == null && this.nice];
    }

    override updateScale(): void {
        super.updateScale();

        this.scale.arcLength = this.getRangeArcLength();
    }

    protected getRangeArcLength(): number {
        const { range: requestedRange } = this;

        const min = Math.min(...requestedRange);
        const max = Math.max(...requestedRange);
        const rotation = angleBetween(min, max) || 2 * Math.PI;
        const radius = this.gridLength;
        return rotation * radius;
    }

    protected generateAngleTicks(domain: number[]) {
        const { scale, range: requestedRange, nice } = this;
        const { values, step, minSpacing, maxSpacing } = this.interval;

        let rawTicks: number[];
        if (values == null) {
            const { arcLength } = scale;
            const minTickCount = maxSpacing ? Math.floor(arcLength / maxSpacing) : 1;
            const maxTickCount = minSpacing ? Math.floor(arcLength / minSpacing) : Infinity;
            const preferredTickCount = Math.floor((4 / Math.PI) * Math.abs(requestedRange[0] - requestedRange[1]));
            const tickCount = Math.max(minTickCount, Math.min(maxTickCount, preferredTickCount));
            const tickParams: ScaleTickParams<number> = {
                nice: [nice, nice],
                interval: step,
                tickCount,
                minTickCount,
                maxTickCount,
            };

            rawTicks = scale.ticks(tickParams, domain)?.ticks ?? [];
        } else {
            const [d0, d1] = findMinMax(domain.map(Number));
            rawTicks = values.filter((value) => value >= d0 && value <= d1).sort((a, b) => a - b);
        }

        return rawTicks.map((value) => ({ value, visible: true }));
    }

    protected avoidLabelCollisions(labelData: AngleAxisLabelDatum[]) {
        const { minSpacing } = this.label;

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
        if (
            firstLabel !== lastLabel &&
            isNumberEqual(firstLabel.x, lastLabel.x) &&
            isNumberEqual(firstLabel.y, lastLabel.y)
        ) {
            lastLabel.hidden = true;
        }

        for (let step = 1; step < labelData.length; step *= 2) {
            let collisionDetected = false;
            for (let i = step; i < labelData.length; i += step) {
                const next = labelData[i];
                const prev = labelData[i - step];
                if (labelsCollide(prev, next)) {
                    collisionDetected = true;
                    break;
                }
            }
            if (!collisionDetected) {
                for (const [i, datum] of labelData.entries()) {
                    if (i % step > 0) {
                        datum.hidden = true;
                        datum.box = undefined;
                    }
                }
                return;
            }
        }

        for (const [i, datum] of labelData.entries()) {
            if (i > 0) {
                datum.hidden = true;
                datum.box = undefined;
            }
        }
    }

    override tickFormatParams(
        _domain: number[],
        _ticks: number[],
        fractionDigits?: number
    ): _ModuleSupport.AxisTickFormatParams {
        return { type: 'number', visibleDomain: undefined, fractionDigits };
    }

    override datumFormatParams(
        value: any,
        params: _ModuleSupport.FormatDatumParams,
        fractionDigits?: number
    ): FormatterParams<any> {
        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        return {
            type: 'number',
            value,
            datum,
            seriesId,
            legendItemName,
            key,
            source,
            property,
            domain,
            boundSeries,
            fractionDigits,
            visibleDomain: undefined,
        };
    }
}
