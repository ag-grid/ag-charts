import { _ModuleSupport } from 'ag-charts-community';
import type { Path, RadialColumnShape } from 'ag-charts-core';

const { motion } = _ModuleSupport;

type AnimatableRadialColumnDatum = {
    innerRadius: number;
    outerRadius: number;
    columnWidth: number;
    axisInnerRadius: number;
    axisOuterRadius: number;
    startAngle: number;
    endAngle: number;
};

type RadiiDatum = { innerRadius: number; outerRadius: number };

// A datum without finite radii is a missing value: hide its node rather than draw a zero-height column.
export function hasRadii(datum: RadiiDatum) {
    return Number.isFinite(datum.innerRadius) && Number.isFinite(datum.outerRadius);
}

const SHOWN = { start: { visible: true }, finish: { visible: true } };
const HIDDEN_ON_FINISH = { start: { visible: true }, finish: { visible: false } };
const HIDDEN = { start: { visible: false }, finish: { visible: false } };

// A column that was drawn before its value went missing stays visible until its exit transition lands; one that was never drawn stays hidden throughout.
export function gapVisibility(datum: RadiiDatum, previousDatum: RadiiDatum | undefined) {
    if (hasRadii(datum)) return SHOWN;
    return previousDatum != null && hasRadii(previousDatum) ? HIDDEN_ON_FINISH : HIDDEN;
}

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
    const calculate = (node: Path & AngleObject, datum: AngleObject, status: _ModuleSupport.NodeUpdateState) => {
        for (const key of angleKeys) {
            const map = angles[key];
            let from = (status === 'removed' || status === 'updated' ? node : datum)[key];
            let to = (status === 'removed' ? node : datum)[key];
            if (Number.isNaN(to)) {
                // eslint-disable-next-line sonarjs/deprecation
                to = node.unsafePreviousDatum?.[key] ?? Number.NaN;
            }
            const diff = from - to;
            if (Math.abs(diff) > Math.PI) {
                from -= Math.sign(diff) * 2 * Math.PI;
            }
            map.set(datum, { from, to });
        }
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
    node: Path,
    datum: { startAngle: number; endAngle: number },
    status: _ModuleSupport.NodeUpdateState
) {
    if (status === 'updated') {
        if (
            node.previousDatum == null ||
            // eslint-disable-next-line sonarjs/deprecation
            Number.isNaN(node.unsafePreviousDatum.startAngle) ||
            // eslint-disable-next-line sonarjs/deprecation
            Number.isNaN(node.unsafePreviousDatum.endAngle)
        ) {
            return 'added';
        }
        if (Number.isNaN(datum.startAngle) || Number.isNaN(datum.endAngle)) {
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
        node: RadialColumnShape,
        datum: AnimatableRadialColumnDatum,
        status: _ModuleSupport.NodeUpdateState
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

        const phase = motion.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
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
        node: RadialColumnShape,
        datum: AnimatableRadialColumnDatum,
        status: _ModuleSupport.NodeUpdateState
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
            innerRadius = Number.isNaN(datum.innerRadius) ? axisZeroRadius : datum.innerRadius;
            outerRadius = Number.isNaN(datum.outerRadius) ? axisZeroRadius : datum.outerRadius;
            columnWidth = Number.isNaN(datum.columnWidth) ? node.columnWidth : datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
        }

        const visibility = status === 'removed' ? undefined : gapVisibility(datum, node.previousDatum);
        return {
            innerRadius,
            outerRadius,
            columnWidth,
            axisInnerRadius,
            axisOuterRadius,
            startAngle,
            endAngle,
            ...visibility,
        };
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
    return {
        innerRadius,
        outerRadius,
        columnWidth,
        axisInnerRadius,
        axisOuterRadius,
        startAngle,
        endAngle,
        visible: Number.isFinite(innerRadius) && Number.isFinite(outerRadius),
    };
}
