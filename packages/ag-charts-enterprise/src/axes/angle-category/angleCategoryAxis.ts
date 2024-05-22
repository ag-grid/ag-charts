import { _ModuleSupport, _Scale, _Util } from 'ag-charts-community';

import { loopSymmetrically } from '../../utils/polar';
import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';

const { RATIO, OR, POSITIVE_NUMBER, NAN, Validate } = _ModuleSupport;
const { BandScale } = _Scale;
const { isNumberEqual } = _Util;

class AngleCategoryAxisTick extends _ModuleSupport.AxisTick<_Scale.BandScale<string>> {
    @Validate(OR(POSITIVE_NUMBER, NAN))
    override minSpacing: number = NaN;
}

export class AngleCategoryAxis extends AngleAxis<string, _Scale.BandScale<string>> {
    static readonly className = 'AngleCategoryAxis';
    static readonly type = 'angle-category' as const;

    @Validate(RATIO)
    groupPaddingInner: number = 0;

    @Validate(RATIO)
    paddingInner: number = 0;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new BandScale());
    }

    protected override createTick(): _ModuleSupport.AxisTick<_Scale.BandScale<string, number>, any, any> {
        return new AngleCategoryAxisTick();
    }

    protected generateAngleTicks() {
        const { scale, tick, gridLength: radius } = this;
        const ticks = tick.values ?? scale.ticks() ?? [];
        if (ticks.length < 2 || isNaN(tick.minSpacing)) {
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
            const spacing = Math.sqrt((nextX - startX) ** 2 + (nextY - startY) ** 2);
            if (spacing > tick.minSpacing) {
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
        let { minSpacing } = this.label;
        if (!Number.isFinite(minSpacing)) {
            minSpacing = 0;
        }

        if (labelData.length < 3) {
            return;
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
        labelData.forEach((datum) => {
            if (!visibleLabels.has(datum)) {
                datum.hidden = true;
                datum.box = undefined;
            }
        });
    }
}
