import type { FromToFns } from '../../../motion/fromToMotion';
import type { Sector } from '../../../scene/shape/sector';

type AnimatableSectorDatum = {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};

export function prepareRadialGaugeSeriesAnimationFunctions(initialLoad: boolean) {
    const phase = initialLoad ? 'initial' : 'update';

    const fns: FromToFns<Sector, any, AnimatableSectorDatum> = {
        fromFn(sect, datum) {
            let { startAngle, endAngle, innerRadius, outerRadius } = sect;

            if (initialLoad) {
                startAngle = datum.startAngle;
                endAngle = datum.endAngle;
                innerRadius = datum.innerRadius;
                outerRadius = datum.innerRadius;
            }

            return { startAngle, endAngle, innerRadius, outerRadius, phase };
        },
        toFn(_sect, datum, status) {
            let { startAngle, endAngle, innerRadius, outerRadius } = datum;

            if (status === 'removed') {
                innerRadius = datum.innerRadius;
                outerRadius = datum.innerRadius;
            }

            return { startAngle, endAngle, outerRadius, innerRadius };
        },
    };

    return fns;
}

export function resetRadialGaugeSeriesAnimationFunctions(_node: Sector, datum: AnimatableSectorDatum) {
    return {
        startAngle: datum.startAngle,
        endAngle: datum.endAngle,
        innerRadius: datum.innerRadius,
        outerRadius: datum.outerRadius,
    };
}
