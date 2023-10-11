import { _Scene, _Util } from 'ag-charts-community';

const { motion } = _Scene;

export type AnimatableNightingaleDatum = {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};

export function prepareNightingaleAnimationFunctions(axisZeroRadius: number) {
    const isRemoved = (datum: AnimatableNightingaleDatum) => !datum;

    const fromFn = (sect: _Scene.Sector, datum: AnimatableNightingaleDatum, status: _Scene.NodeUpdateState) => {
        if (status === 'updated' && isRemoved(sect.previousDatum)) {
            status = 'added';
        }

        if (status === 'added' && !isRemoved(sect.previousDatum)) {
            status = 'updated';
        }

        let innerRadius: number;
        let outerRadius: number;
        let startAngle: number;
        let endAngle: number;
        if (status === 'removed' || status === 'updated') {
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
            startAngle = sect.startAngle;
            endAngle = sect.endAngle;
        } else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            startAngle = datum.startAngle;
            endAngle = datum.endAngle;
        }
        const mixin = motion.FROM_TO_MIXINS[status];
        return { innerRadius, outerRadius, startAngle, endAngle, ...mixin };
    };

    const toFn = (sect: _Scene.Sector, datum: AnimatableNightingaleDatum, status: _Scene.NodeUpdateState) => {
        let innerRadius: number;
        let outerRadius: number;
        let startAngle: number;
        let endAngle: number;
        if (status === 'removed') {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            startAngle = sect.startAngle;
            endAngle = sect.endAngle;
        } else {
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
            startAngle = datum.startAngle;
            endAngle = datum.endAngle;
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
