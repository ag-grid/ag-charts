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

export function prepareRadialBarSeriesAnimationFunctions(
    axes: Record<_ModuleSupport.ChartAxisDirection, _ModuleSupport.ChartAxis | undefined>
) {
    const angleScale = axes[ChartAxisDirection.X]?.scale;
    let axisStartAngle = 0;
    if (angleScale && angleScale.domain[0] <= 0 && angleScale.domain[1] >= 0) {
        axisStartAngle = angleScale.convert(0);
    }

    const isRemoved = (datum: AnimatableSectorDatum) => !datum;

    const fromFn = (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        if (status === 'updated' && isRemoved(sect.previousDatum)) {
            status = 'added';
        }

        if (status === 'added' && !isRemoved(sect.previousDatum)) {
            status = 'updated';
        }

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
            startAngle = axisStartAngle;
            endAngle = axisStartAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        }
        const mixin = motion.FROM_TO_MIXINS[status];
        return { startAngle, endAngle, innerRadius, outerRadius, ...mixin };
    };
    const toFn = (_sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        let startAngle: number;
        let endAngle: number;
        let innerRadius: number;
        let outerRadius: number;
        if (status === 'removed') {
            startAngle = axisStartAngle;
            endAngle = axisStartAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        } else {
            startAngle = datum.startAngle;
            endAngle = datum.endAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
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
