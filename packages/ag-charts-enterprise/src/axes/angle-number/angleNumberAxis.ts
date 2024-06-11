import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';
import { AngleAxisInterval } from './angleAxisInterval';
import { LinearAngleScale } from './linearAngleScale';

const { AND, Default, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, OBJECT, Validate } = _ModuleSupport;
const { angleBetween, isNumberEqual, normalisedExtentWithMetadata } = _Util;

export class AngleNumberAxis extends AngleAxis<number, LinearAngleScale> {
    static readonly className = 'AngleNumberAxis';
    static readonly type = 'angle-number' as const;

    override shape = 'circle' as const;

    @Validate(AND(NUMBER_OR_NAN, LESS_THAN('max')))
    @Default(NaN)
    min: number = NaN;

    @Validate(AND(NUMBER_OR_NAN, GREATER_THAN('min')))
    @Default(NaN)
    max: number = NaN;

    @Validate(OBJECT)
    override interval = new AngleAxisInterval();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new LinearAngleScale());
    }

    override normaliseDataDomain(d: number[]) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        return { domain: extent, clipped };
    }

    protected getRangeArcLength(): number {
        const { range: requestedRange } = this;

        const min = Math.min(...requestedRange);
        const max = Math.max(...requestedRange);
        const rotation = angleBetween(min, max) || 2 * Math.PI;
        const radius = this.gridLength;
        return rotation * radius;
    }

    protected generateAngleTicks() {
        const arcLength = this.getRangeArcLength();
        const { scale, range: requestedRange } = this;
        const { values, minSpacing, maxSpacing } = this.interval;

        const minTicksCount = maxSpacing ? Math.floor(arcLength / maxSpacing) : 1;
        const maxTicksCount = minSpacing ? Math.floor(arcLength / minSpacing) : Infinity;
        const preferredTicksCount = Math.floor((4 / Math.PI) * Math.abs(requestedRange[0] - requestedRange[1]));

        scale.tickCount = Math.max(minTicksCount, Math.min(maxTicksCount, preferredTicksCount));
        scale.minTickCount = minTicksCount;
        scale.maxTickCount = maxTicksCount;
        scale.arcLength = arcLength;

        const ticks = values ?? scale.ticks();
        return ticks.map((value) => {
            return { value, visible: true };
        });
    }

    protected avoidLabelCollisions(labelData: AngleAxisLabelDatum[]) {
        let { minSpacing } = this.label;
        if (!Number.isFinite(minSpacing)) {
            minSpacing = 0;
        }

        const labelsCollide = (prev: AngleAxisLabelDatum, next: AngleAxisLabelDatum) => {
            if (prev.hidden || next.hidden) {
                return false;
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
                labelData.forEach((datum, i) => {
                    if (i % step > 0) {
                        datum.hidden = true;
                        datum.box = undefined;
                    }
                });
                return;
            }
        }

        labelData.forEach((datum, i) => {
            if (i > 0) {
                datum.hidden = true;
                datum.box = undefined;
            }
        });
    }
}
