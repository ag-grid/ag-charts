import { _Scene } from 'ag-charts-community';

import { createAngleMotionCalculator, fixRadialColumnAnimationStatus } from '../radial-column/radialColumnUtil';

const { motion } = _Scene;

export type AnimatableNightingaleDatum = {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};

export function prepareNightingaleAnimationFunctions(axisZeroRadius: number) {
    const angles = createAngleMotionCalculator();

    const fromFn = (sect: _Scene.Sector, datum: AnimatableNightingaleDatum, status: _Scene.NodeUpdateState) => {
        status = fixRadialColumnAnimationStatus(sect, datum, status);

        angles.calculate(sect, datum, status);
        const { startAngle, endAngle } = angles.from(datum);

        let innerRadius: number;
        let outerRadius: number;
        if (status === 'removed' || status === 'updated') {
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
        } else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
        }
        const phase = motion.FROM_TO_MIXINS[status];
        return { innerRadius, outerRadius, startAngle, endAngle, phase };
    };

    const toFn = (_sect: _Scene.Sector, datum: AnimatableNightingaleDatum, status: _Scene.NodeUpdateState) => {
        const { startAngle, endAngle } = angles.to(datum);
        let innerRadius: number;
        let outerRadius: number;
        if (status === 'removed') {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
        } else {
            innerRadius = isNaN(datum.innerRadius) ? axisZeroRadius : datum.innerRadius;
            outerRadius = isNaN(datum.outerRadius) ? axisZeroRadius : datum.outerRadius;
        }
        return { innerRadius, outerRadius, startAngle, endAngle };
    };

    return { toFn, fromFn };
}

export function resetNightingaleSelectionFn(
    _sect: _Scene.Sector,
    { innerRadius, outerRadius, startAngle, endAngle }: AnimatableNightingaleDatum
) {
    return { innerRadius, outerRadius, startAngle, endAngle };
}
