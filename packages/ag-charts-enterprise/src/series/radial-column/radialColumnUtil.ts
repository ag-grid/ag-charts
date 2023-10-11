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

type AngleKey = 'startAngle' | 'endAngle';
type AngleObject = Record<AngleKey, number>;
type FromToKey = 'from' | 'to';
type FromToObject = Record<FromToKey, number>;

export function createAngleMotionCalculator() {
    const angles: Record<AngleKey, Map<AngleObject, FromToObject>> = {
        startAngle: new Map(),
        endAngle: new Map(),
    };
    const angleKeys: AngleKey[] = ['startAngle', 'endAngle'];
    const calculate = (node: _Scene.Path & AngleObject, datum: AngleObject, status: _Scene.NodeUpdateState) => {
        angleKeys.forEach((key) => {
            const map = angles[key];
            let from = (status === 'removed' || status === 'updated' ? node : datum)[key];
            const to = (status === 'removed' ? node : datum)[key];
            const diff = from - to;
            if (Math.abs(diff) > Math.PI) {
                from -= Math.sign(diff) * 2 * Math.PI;
            }
            map.set(datum, { from, to });
        });
    };
    const getAngles = (datum: AngleObject, fromToKey: FromToKey) => {
        return {
            startAngle: angles.startAngle.get(datum)![fromToKey],
            endAngle: angles.endAngle.get(datum)![fromToKey],
        };
    };
    const from = (datum: AngleObject) => getAngles(datum, 'from');
    const to = (datum: AngleObject) => getAngles(datum, 'to');
    return { calculate, from, to };
}

export function prepareRadialColumnAnimationFunctions(axisZeroRadius: number) {
    const isRemoved = (datum: AnimatableRadialColumnDatum) => !datum;
    const angles = createAngleMotionCalculator();

    const fromFn = (node: RadialColumnShape, datum: AnimatableRadialColumnDatum, status: _Scene.NodeUpdateState) => {
        if (status === 'updated' && isRemoved(node.previousDatum)) {
            status = 'added';
        }

        if (status === 'added' && !isRemoved(node.previousDatum)) {
            status = 'updated';
        }

        angles.calculate(node, datum, status);
        const { startAngle, endAngle } = angles.from(datum);

        let innerRadius: number;
        let outerRadius: number;
        let columnWidth: number;
        let axisInnerRadius: number;
        let axisOuterRadius: number;
        if (status === 'removed' || status === 'updated') {
            innerRadius = node.innerRadius;
            outerRadius = node.outerRadius;
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
        } else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            columnWidth = datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
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
        const { startAngle, endAngle } = angles.to(datum);

        let innerRadius: number;
        let outerRadius: number;
        let columnWidth: number;
        let axisInnerRadius: number;
        let axisOuterRadius: number;
        if (status === 'removed') {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
        } else {
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
            columnWidth = datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
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
