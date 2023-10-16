import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { motion } = _Scene;

const { ChartAxisDirection } = _ModuleSupport;

type AnimatableSectorDatum = {
    angleValue: any;
    radiusValue: any;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};

function fixRadialBarAnimationStatus(
    node: _Scene.Path,
    datum: { innerRadius: number; outerRadius: number },
    status: _Scene.NodeUpdateState
) {
    if (status === 'updated') {
        if (node.previousDatum == null || isNaN(node.previousDatum.innerRadius) || isNaN(node.previousDatum.outerRadius)) {
            return 'added';
        }
        if (isNaN(datum.innerRadius) || isNaN(datum.outerRadius)) {
            return 'removed';
        }
    }
    if (status === 'added' && node.previousDatum != null) {
        return 'updated';
    }
    return status;
}

export function prepareRadialBarSeriesAnimationFunctions(
    axes: Record<_ModuleSupport.ChartAxisDirection, _ModuleSupport.ChartAxis | undefined>
) {
    const angleScale = axes[ChartAxisDirection.X]?.scale;
    let axisZeroAngle = 0;
    if (angleScale && angleScale.domain[0] <= 0 && angleScale.domain[1] >= 0) {
        axisZeroAngle = angleScale.convert(0);
    }

    const fromFn = (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        status = fixRadialBarAnimationStatus(sect, datum, status);

        let startAngle: number;
        let endAngle: number;
        let innerRadius: number;
        let outerRadius: number;
        if (status === 'removed' || status === 'updated') {
            startAngle = sect.startAngle;
            endAngle = sect.endAngle;
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
        } else {
            startAngle = axisZeroAngle;
            endAngle = axisZeroAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        }
        const mixin = motion.FROM_TO_MIXINS[status];
        return { startAngle, endAngle, innerRadius, outerRadius, ...mixin };
    };
    const toFn = (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        let startAngle: number;
        let endAngle: number;
        let innerRadius: number;
        let outerRadius: number;
        if (status === 'removed') {
            startAngle = axisZeroAngle;
            endAngle = axisZeroAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        } else {
            startAngle = datum.startAngle;
            endAngle = datum.endAngle;
            innerRadius = isNaN(datum.innerRadius) ? sect.innerRadius : datum.innerRadius;
            outerRadius = isNaN(datum.outerRadius) ? sect.outerRadius : datum.outerRadius;
        }
        return { startAngle, endAngle, innerRadius, outerRadius };
    };

    return { toFn, fromFn };
}

export function resetRadialBarSelectionsFn(_node: _Scene.Sector, datum: AnimatableSectorDatum) {
    return {
        centerX: 0,
        centerY: 0,
        innerRadius: datum.innerRadius,
        outerRadius: datum.outerRadius,
        startAngle: datum.startAngle,
        endAngle: datum.endAngle,
    };
}
