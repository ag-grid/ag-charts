import type { FromToFns } from '../../../motion/fromToMotion';
import { SectorBox } from '../../../scene/sectorBox';
import type { Sector } from '../../../scene/shape/sector';

type AnimatableSectorDatum = {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipStartAngle: number | undefined;
    clipEndAngle: number | undefined;
};

export function prepareRadialGaugeSeriesAnimationFunctions(initialLoad: boolean) {
    const phase = initialLoad ? 'initial' : 'update';

    const fns: FromToFns<Sector, any, AnimatableSectorDatum> = {
        fromFn(sect, datum) {
            let { startAngle, endAngle, innerRadius, outerRadius } = sect;
            let clipStartAngle = sect.clipSector?.startAngle;
            let clipEndAngle = sect.clipSector?.endAngle;

            if (initialLoad) {
                startAngle = datum.startAngle;
                endAngle = datum.endAngle;
                innerRadius = datum.innerRadius;
                outerRadius = datum.innerRadius;
                clipStartAngle = datum.clipStartAngle;
                clipEndAngle = datum.clipEndAngle;
            }

            const clipSector =
                clipStartAngle != null && clipEndAngle != null
                    ? new SectorBox(clipStartAngle, clipEndAngle, innerRadius, outerRadius)
                    : undefined;

            return { startAngle, endAngle, innerRadius, outerRadius, clipSector, phase };
        },
        toFn(_sect, datum, status) {
            let { startAngle, endAngle, innerRadius, outerRadius, clipStartAngle, clipEndAngle } = datum;

            if (status === 'removed') {
                innerRadius = datum.innerRadius;
                outerRadius = datum.innerRadius;
            }

            const clipSector =
                clipStartAngle != null && clipEndAngle != null
                    ? new SectorBox(clipStartAngle, clipEndAngle, innerRadius, outerRadius)
                    : undefined;

            return { startAngle, endAngle, outerRadius, innerRadius, clipSector };
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
