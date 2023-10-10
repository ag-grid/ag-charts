import { _Scene, _Util } from 'ag-charts-community';
import type { RadialColumnShape } from './radialColumnShape';

const { motion } = _Scene;

type SectorLike = _Scene.Sector | RadialColumnShape;
export type AnimatableRadialColumnDatum = {
    innerRadius: number;
    outerRadius: number;
    columnWidth: number;
    axisInnerRadius: number;
    axisOuterRadius: number;
    startAngle: number;
    endAngle: number;
}
export function prepareRadialColumnAnimationFunctions(axisZeroRadius: number) {
    const isRemoved = (datum: AnimatableRadialColumnDatum) => !datum;

    const fromFn = (sect: RadialColumnShape, datum: AnimatableRadialColumnDatum, status: _Scene.NodeUpdateState) => {
        if (status === 'updated' && isRemoved(sect.previousDatum)) {
            status = 'added';
        }

        if (status === 'added' && !isRemoved(sect.previousDatum)) {
            status = 'updated';
        }

        let innerRadius: number;
        let outerRadius: number;
        let columnWidth: number;
        let axisInnerRadius: number;
        let axisOuterRadius: number;
        let startAngle: number;
        let endAngle: number;
        if (status === 'removed' || status === 'updated') {
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
            columnWidth = sect.columnWidth;
            axisInnerRadius = sect.axisInnerRadius;
            axisOuterRadius = sect.axisOuterRadius;
            startAngle = sect.startAngle;
            endAngle = sect.endAngle;
        } else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            columnWidth = datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
            startAngle = datum.startAngle;
            endAngle = datum.endAngle;
        }
        const mixin = motion.FROM_TO_MIXINS[status];
        return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle, ...mixin };
    };

    const toFn = (sect: RadialColumnShape, datum: AnimatableRadialColumnDatum, status: _Scene.NodeUpdateState) => {
        let innerRadius: number;
        let outerRadius: number;
        let columnWidth: number;
        let axisInnerRadius: number;
        let axisOuterRadius: number;
        let startAngle: number;
        let endAngle: number;
        if (status === 'removed') {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            columnWidth = sect.columnWidth;
            axisInnerRadius = sect.axisInnerRadius;
            axisOuterRadius = sect.axisOuterRadius;
            startAngle = sect.startAngle;
            endAngle = sect.endAngle;
        } else {
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
            columnWidth = datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
            startAngle = datum.startAngle;
            endAngle = datum.endAngle;
        }
        return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle };
    };

    return { toFn, fromFn };
}

export function resetRadialColumnSelectionFn(
    _sect: SectorLike,
    { innerRadius, outerRadius }: AnimatableRadialColumnDatum
) {
    return { innerRadius, outerRadius };
}
