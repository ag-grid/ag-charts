import { _ModuleSupport } from 'ag-charts-community';

import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { createAngleMotionCalculator, fixRadialColumnAnimationStatus } from '../radial-column/radialColumnUtil';

const { SectorBox, motion } = _ModuleSupport;

export function getRadii(datum: RadialColumnNodeDatum) {
    const { negative, innerRadius, outerRadius, stackInnerRadius, stackOuterRadius } = datum;
    return {
        innerRadius: negative ? stackOuterRadius : stackInnerRadius,
        outerRadius: negative ? stackInnerRadius : stackOuterRadius,
        clipInnerRadius: negative ? outerRadius : innerRadius,
        clipOuterRadius: negative ? innerRadius : outerRadius,
    };
}

export function prepareNightingaleAnimationFunctions(axisZeroRadius: number) {
    const angles = createAngleMotionCalculator();

    const fromFn = (
        sect: _ModuleSupport.Sector,
        datum: RadialColumnNodeDatum,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        status = fixRadialColumnAnimationStatus(sect, datum, status);

        angles.calculate(sect, datum, status);
        const { startAngle, endAngle } = angles.from(datum);

        let innerRadius: number;
        let outerRadius: number;
        let clipSector: _ModuleSupport.SectorBox | undefined;
        if (status === 'removed' || status === 'updated') {
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
            clipSector = sect.clipSector;
        } else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
        }
        clipSector ??= new SectorBox(startAngle, endAngle, innerRadius, outerRadius);
        const phase = motion.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
        return { innerRadius, outerRadius, startAngle, endAngle, clipSector, phase };
    };

    const toFn = (
        _sect: _ModuleSupport.Sector,
        datum: RadialColumnNodeDatum,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        const { startAngle, endAngle } = angles.to(datum);
        let innerRadius: number;
        let outerRadius: number;
        let clipSector: _ModuleSupport.SectorBox;
        if (status === 'removed') {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            clipSector = new SectorBox(startAngle, endAngle, innerRadius, outerRadius);
        } else {
            let clipInnerRadius: number, clipOuterRadius: number;
            ({ innerRadius, outerRadius, clipInnerRadius, clipOuterRadius } = getRadii(datum));
            if (isNaN(innerRadius)) innerRadius = axisZeroRadius;
            if (isNaN(outerRadius)) outerRadius = axisZeroRadius;
            if (isNaN(clipInnerRadius)) clipInnerRadius = axisZeroRadius;
            if (isNaN(clipOuterRadius)) clipOuterRadius = axisZeroRadius;
            clipSector = new SectorBox(startAngle, endAngle, clipInnerRadius, clipOuterRadius);
        }
        return { innerRadius, outerRadius, startAngle, endAngle, clipSector };
    };

    return { toFn, fromFn };
}

export function resetNightingaleSelectionFn(_sect: _ModuleSupport.Sector, datum: RadialColumnNodeDatum) {
    const { startAngle, endAngle } = datum;
    const { innerRadius, outerRadius, clipInnerRadius, clipOuterRadius } = getRadii(datum);
    const clipSector = new SectorBox(startAngle, endAngle, clipInnerRadius, clipOuterRadius);
    return { innerRadius, outerRadius, startAngle, endAngle, clipSector };
}
