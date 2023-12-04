import type { FromToMotionPropFnContext, NodeUpdateState } from '../../../motion/fromToMotion';
import type { Sector } from '../../../scene/shape/sector';
import { toRadians } from '../../../util/angle';
import type { Circle } from '../../marker/circle';

type AnimatableSectorDatum = {
    radius: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    sectorFormat: {
        fill?: string;
        stroke?: string;
    };
};

type ScaleFn = { convert(x: number): number };
export function preparePieSeriesAnimationFunctions(
    initialLoad: boolean,
    rotationDegrees: number,
    scaleFn: ScaleFn,
    oldScaleFn: ScaleFn
) {
    const scale: [number, number] = [scaleFn.convert(0), scaleFn.convert(1)];
    const oldScale: [number, number] = [oldScaleFn.convert(0), oldScaleFn.convert(1)];
    const rotation = Math.PI / -2 + toRadians(rotationDegrees);

    const scaleToNewRadius = ({ radius }: AnimatableSectorDatum) => {
        return { innerRadius: scale[0], outerRadius: scale[0] + (scale[1] - scale[0]) * radius };
    };

    const scaleToOldRadius = ({ radius }: AnimatableSectorDatum) => {
        return { innerRadius: oldScale[0], outerRadius: oldScale[0] + (oldScale[1] - oldScale[0]) * radius };
    };

    const fromFn = (
        sect: Sector,
        datum: AnimatableSectorDatum,
        status: NodeUpdateState,
        { prevFromProps }: FromToMotionPropFnContext<Sector>
    ) => {
        // Default to starting from current state.
        let { startAngle, endAngle, innerRadius, outerRadius } = sect;
        let { fill, stroke } = datum.sectorFormat;

        if (status === 'unknown' || (status === 'added' && !prevFromProps)) {
            // Start of animation (full new data) - sweep in.
            startAngle = rotation;
            endAngle = rotation;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        } else if (status === 'added' && prevFromProps) {
            startAngle = prevFromProps.endAngle ?? rotation;
            endAngle = prevFromProps.endAngle ?? rotation;
            innerRadius = prevFromProps.innerRadius ?? datum.innerRadius;
            outerRadius = prevFromProps.outerRadius ?? datum.outerRadius;
        }

        if (status === 'added' && !initialLoad) {
            const radii = scaleToOldRadius(datum);
            innerRadius = radii.innerRadius;
            outerRadius = radii.outerRadius;
        }

        if (status === 'updated') {
            fill = sect.fill ?? fill;
            stroke = sect.stroke ?? stroke;
        }

        return { startAngle, endAngle, innerRadius, outerRadius, fill, stroke };
    };
    const toFn = (
        _sect: Sector,
        datum: AnimatableSectorDatum,
        status: NodeUpdateState,
        { prevLive }: FromToMotionPropFnContext<Sector>
    ) => {
        // Default to moving to target state.
        let { startAngle, endAngle, innerRadius, outerRadius } = datum;
        const { stroke, fill } = datum.sectorFormat;

        if (status === 'removed' && prevLive) {
            startAngle = prevLive.datum?.endAngle;
            endAngle = prevLive.datum?.endAngle;
        } else if (status === 'removed' && !prevLive) {
            startAngle = rotation;
            endAngle = rotation;
        }

        if (status === 'removed') {
            const radii = scaleToNewRadius(datum);
            innerRadius = radii.innerRadius;
            outerRadius = radii.outerRadius;
        }

        return { startAngle, endAngle, outerRadius, innerRadius, stroke, fill };
    };

    const innerCircle = {
        fromFn: (node: Circle, _datum: { radius: number }) => {
            return { size: node.previousDatum?.radius ?? node.size ?? 0 };
        },
        toFn: (_node: Circle, datum: { radius: number }) => {
            return { size: datum.radius ?? 0 };
        },
    };

    return { nodes: { toFn, fromFn }, innerCircle };
}

export function resetPieSelectionsFn(_node: Sector, datum: AnimatableSectorDatum) {
    return {
        startAngle: datum.startAngle,
        endAngle: datum.endAngle,
        innerRadius: datum.innerRadius,
        outerRadius: datum.outerRadius,
        fill: datum.sectorFormat.fill,
        stroke: datum.sectorFormat.stroke,
    };
}
