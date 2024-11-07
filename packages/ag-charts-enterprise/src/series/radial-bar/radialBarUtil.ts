import { _ModuleSupport } from 'ag-charts-community';

const { SectorBox, motion } = _ModuleSupport;

type AnimatableSectorDatum = {
    angleValue: any;
    radiusValue: any;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipSector: _ModuleSupport.SectorBox;
};

function fixRadialBarAnimationStatus(
    node: _ModuleSupport.Path,
    datum: { innerRadius: number; outerRadius: number },
    status: _ModuleSupport.NodeUpdateState
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
    const fromFn = (
        sect: _ModuleSupport.Sector,
        datum: AnimatableSectorDatum,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        status = fixRadialBarAnimationStatus(sect, datum, status);

        let startAngle: number;
        let endAngle: number;
        let innerRadius: number;
        let outerRadius: number;
        let clipSector: _ModuleSupport.SectorBox | undefined;
        if (status === 'removed' || status === 'updated') {
            startAngle = sect.startAngle;
            endAngle = sect.endAngle;
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
            clipSector = sect.clipSector;
        } else {
            startAngle = axisZeroAngle;
            endAngle = axisZeroAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        }
        clipSector ??= new SectorBox(startAngle, endAngle, innerRadius, outerRadius);
        const phase = motion.NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
        return { startAngle, endAngle, innerRadius, outerRadius, clipSector, phase };
    };
    const toFn = (
        sect: _ModuleSupport.Sector,
        datum: AnimatableSectorDatum,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        let startAngle: number;
        let endAngle: number;
        let innerRadius: number;
        let outerRadius: number;
        let clipSector: _ModuleSupport.SectorBox | undefined;
        if (status === 'removed') {
            startAngle = axisZeroAngle;
            endAngle = axisZeroAngle;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
            clipSector = new SectorBox(startAngle, endAngle, innerRadius, outerRadius);
        } else {
            startAngle = datum.startAngle;
            endAngle = datum.endAngle;
            innerRadius = isNaN(datum.innerRadius) ? sect.innerRadius : datum.innerRadius;
            outerRadius = isNaN(datum.outerRadius) ? sect.outerRadius : datum.outerRadius;
            clipSector = datum.clipSector;
        }
        return { startAngle, endAngle, innerRadius, outerRadius, clipSector };
    };

    return { toFn, fromFn };
}

export function resetRadialBarSelectionsFn(_node: _ModuleSupport.Sector, datum: AnimatableSectorDatum) {
    return {
        centerX: 0,
        centerY: 0,
        innerRadius: datum.innerRadius,
        outerRadius: datum.outerRadius,
        startAngle: datum.startAngle,
        endAngle: datum.endAngle,
        clipSector: datum.clipSector,
    };
}
