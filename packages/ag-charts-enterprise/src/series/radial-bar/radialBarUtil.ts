import { _Scene } from 'ag-charts-community';

const { motion } = _Scene;

type AnimatableSectorDatum = {
    angleValue: any;
    radiusValue: any;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipStartAngle: number;
    clipEndAngle: number;
};

function fixRadialBarAnimationStatus(
    node: _Scene.Path,
    datum: { innerRadius: number; outerRadius: number },
    status: _Scene.NodeUpdateState
) {
    if (status === 'updated') {
        if (
            node.previousDatum == null ||
            isNaN(node.previousDatum.innerRadius) ||
            isNaN(node.previousDatum.outerRadius)
        ) {
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

export function prepareRadialBarSeriesAnimationFunctions(axisZeroAngle: number) {
    const fromFn = (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        status = fixRadialBarAnimationStatus(sect, datum, status);

        let startAngle: number;
        let endAngle: number;
        let clipStartAngle: number;
        let clipEndAngle: number;
        let innerRadius: number;
        let outerRadius: number;
        if (status === 'removed' || status === 'updated') {
            startAngle = sect.startAngle;
            endAngle = sect.endAngle;
            clipStartAngle = sect.clipStartAngle ?? axisZeroAngle;
            clipEndAngle = sect.clipEndAngle ?? axisZeroAngle;
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
        } else {
            startAngle = axisZeroAngle;
            endAngle = axisZeroAngle;
            clipStartAngle = axisZeroAngle;
            clipEndAngle = axisZeroAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        }
        const phase = motion.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
        return { startAngle, endAngle, clipStartAngle, clipEndAngle, innerRadius, outerRadius, phase };
    };
    const toFn = (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        let startAngle: number;
        let endAngle: number;
        let clipStartAngle: number;
        let clipEndAngle: number;
        let innerRadius: number;
        let outerRadius: number;
        if (status === 'removed') {
            startAngle = axisZeroAngle;
            endAngle = axisZeroAngle;
            clipStartAngle = axisZeroAngle;
            clipEndAngle = axisZeroAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        } else {
            startAngle = datum.startAngle;
            endAngle = datum.endAngle;
            clipStartAngle = datum.clipStartAngle;
            clipEndAngle = datum.clipEndAngle;
            innerRadius = isNaN(datum.innerRadius) ? sect.innerRadius : datum.innerRadius;
            outerRadius = isNaN(datum.outerRadius) ? sect.outerRadius : datum.outerRadius;
        }
        return { startAngle, endAngle, clipStartAngle, clipEndAngle, innerRadius, outerRadius };
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
        clipStartAngle: datum.clipStartAngle,
        clipEndAngle: datum.clipEndAngle,
    };
}
