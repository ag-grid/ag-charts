import { _Scene } from 'ag-charts-community';

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
            let to = (status === 'removed' ? node : datum)[key];
            if (isNaN(to)) {
                to = node.previousDatum?.[key] ?? NaN;
            }
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

export function fixRadialColumnAnimationStatus(
    node: _Scene.Path,
    datum: { startAngle: number; endAngle: number },
    status: _Scene.NodeUpdateState
) {
    if (status === 'updated') {
        if (node.previousDatum == null || isNaN(node.previousDatum.startAngle) || isNaN(node.previousDatum.endAngle)) {
            return 'added';
        }
        if (isNaN(datum.startAngle) || isNaN(datum.endAngle)) {
            return 'removed';
        }
    }
    if (status === 'added' && node.previousDatum != null) {
        return 'updated';
    }
    return status;
}

export function prepareRadialColumnAnimationFunctions(axisZeroRadius: number) {
    const angles = createAngleMotionCalculator();

    const fromFn = (
        node: _Scene.RadialColumnShape,
        datum: AnimatableRadialColumnDatum,
        status: _Scene.NodeUpdateState
    ) => {
        status = fixRadialColumnAnimationStatus(node, datum, status);

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

        const phase = motion.FROM_TO_MIXINS[status];
        return {
            innerRadius,
            outerRadius,
            columnWidth,
            axisInnerRadius,
            axisOuterRadius,
            startAngle,
            endAngle,
            phase,
        };
    };

    const toFn = (
        node: _Scene.RadialColumnShape,
        datum: AnimatableRadialColumnDatum,
        status: _Scene.NodeUpdateState
    ) => {
        const { startAngle, endAngle } = angles.to(datum);

        let innerRadius: number;
        let outerRadius: number;
        let columnWidth: number;
        let axisInnerRadius: number;
        let axisOuterRadius: number;
        if (status === 'removed') {
            innerRadius = node.innerRadius;
            outerRadius = node.innerRadius;
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
        } else {
            innerRadius = isNaN(datum.innerRadius) ? axisZeroRadius : datum.innerRadius;
            outerRadius = isNaN(datum.outerRadius) ? axisZeroRadius : datum.outerRadius;
            columnWidth = isNaN(datum.columnWidth) ? node.columnWidth : datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
        }

        return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle };
    };

    return { toFn, fromFn };
}

export function resetRadialColumnSelectionFn(
    _node: _Scene.RadialColumnShape,
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
