import { _Scene } from 'ag-charts-community';

import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { createAngleMotionCalculator, fixRadialColumnAnimationStatus } from '../radial-column/radialColumnUtil';

const { SectorBox, motion } = _Scene;

export type AnimatableNightingaleDatum = {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipSector: _Scene.SectorBox;
};

export function prepareNightingaleAnimationFunctions(axisZeroRadius: number) {
    const angles = createAngleMotionCalculator();

    const fromFn = (sect: _Scene.Sector, datum: RadialColumnNodeDatum, status: _Scene.NodeUpdateState) => {
        status = fixRadialColumnAnimationStatus(sect, datum, status);

        angles.calculate(sect, datum, status);
        const { startAngle, endAngle } = angles.from(datum);

        let innerRadius: number;
        let outerRadius: number;
        let clipSector: _Scene.SectorBox | undefined;
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

    const toFn = (_sect: _Scene.Sector, datum: RadialColumnNodeDatum, status: _Scene.NodeUpdateState) => {
        const { startAngle, endAngle } = angles.to(datum);
        let innerRadius: number;
        let outerRadius: number;
        let clipSector: _Scene.SectorBox;
        if (status === 'removed') {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            clipSector = new SectorBox(startAngle, endAngle, innerRadius, outerRadius);
        } else {
            const clipInnerRadius = isNaN(datum.innerRadius) ? axisZeroRadius : datum.innerRadius;
            const clipOuterRadius = isNaN(datum.outerRadius) ? axisZeroRadius : datum.outerRadius;
            innerRadius = axisZeroRadius;
            outerRadius = isNaN(datum.stackOuterRadius) ? axisZeroRadius : datum.stackOuterRadius;
            clipSector = new SectorBox(startAngle, endAngle, clipInnerRadius, clipOuterRadius);
        }
        return { innerRadius, outerRadius, startAngle, endAngle, clipSector };
    };

    return { toFn, fromFn };
}

export function resetNightingaleSelectionFn(
    _sect: _Scene.Sector,
    {
        innerRadius: clipInnerRadius,
        outerRadius: clipOuterRadius,
        stackOuterRadius: outerRadius,
        startAngle,
        endAngle,
    }: RadialColumnNodeDatum
) {
    const clipSector = new SectorBox(startAngle, endAngle, clipInnerRadius, clipOuterRadius);
    return { innerRadius: 0, outerRadius, startAngle, endAngle, clipSector };
}
