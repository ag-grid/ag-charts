import { _Scene, _Util } from 'ag-charts-community';

import type { RadialColumnShape } from './radialColumnShape';

const { motion } = _Scene;

export type AnimatableRadialColumnDatum = {
    innerRadius: number;
    outerRadius: number;
    columnWidth: number;
    axisInnerRadius: number;
    axisOuterRadius: number;
    startAngle: number;
    endAngle: number;
};

export function prepareRadialColumnAnimationFunctions(axisZeroRadius: number) {
    const isRemoved = (datum: AnimatableRadialColumnDatum) => !datum;

    const fromFn = (node: RadialColumnShape, datum: AnimatableRadialColumnDatum, status: _Scene.NodeUpdateState) => {
        if (status === 'updated' && isRemoved(node.previousDatum)) {
            status = 'added';
        }

        if (status === 'added' && !isRemoved(node.previousDatum)) {
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
            innerRadius = node.innerRadius;
            outerRadius = node.outerRadius;
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
            startAngle = node.startAngle;
            endAngle = node.endAngle;
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
        return {
            innerRadius,
            outerRadius,
            columnWidth,
            axisInnerRadius,
            axisOuterRadius,
            startAngle,
            endAngle,
            ...mixin,
        };
    };

    const toFn = (node: RadialColumnShape, datum: AnimatableRadialColumnDatum, status: _Scene.NodeUpdateState) => {
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
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
            startAngle = node.startAngle;
            endAngle = node.endAngle;
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
    _node: RadialColumnShape,
    {
        innerRadius,
        outerRadius,
        columnWidth,
        axisInnerRadius,
        axisOuterRadius,
        startAngle,
        endAngle,
    }: AnimatableRadialColumnDatum
) {
    return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle };
}
