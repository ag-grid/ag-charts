import type { FromToMotionPropFn, FromToMotionPropFnContext, NodeUpdateState } from '../../../motion/fromToMotion';
import type { Point } from '../../../scene/point';
import type { Sector } from '../../../scene/shape/sector';
import { isBetweenAngles, toRadians } from '../../../util/angle';
import type { Circle } from '../../marker/circle';
import type { SeriesNodePickMatch } from '../series';

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
    const phase = initialLoad ? 'initial' : 'update';

    const scaleToNewRadius = ({ radius }: AnimatableSectorDatum) => {
        return { innerRadius: scale[0], outerRadius: scale[0] + (scale[1] - scale[0]) * radius };
    };

    const scaleToOldRadius = ({ radius }: AnimatableSectorDatum) => {
        return { innerRadius: oldScale[0], outerRadius: oldScale[0] + (oldScale[1] - oldScale[0]) * radius };
    };

    const fromFn: FromToMotionPropFn<Sector, any, AnimatableSectorDatum> = (
        sect,
        datum,
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
            fill = (sect.fill as any) ?? fill;
            stroke = sect.stroke ?? stroke;
        }

        return { startAngle, endAngle, innerRadius, outerRadius, fill, stroke, phase };
    };
    const toFn: FromToMotionPropFn<Sector, any, AnimatableSectorDatum> = (
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

    const innerCircleFromFn: FromToMotionPropFn<Circle, any, { radius: number }> = (node, _) => {
        return { size: node.previousDatum?.radius ?? node.size ?? 0, phase };
    };
    const innerCircleToFn: FromToMotionPropFn<Circle, any, { radius: number }> = (_, datum) => {
        return { size: datum.radius ?? 0 };
    };

    return { nodes: { toFn, fromFn }, innerCircle: { fromFn: innerCircleFromFn, toFn: innerCircleToFn } };
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

type SectorVariables = {
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
};
type SectorSceneNode = SectorVariables & { readonly datum: any };
type SectorSeries = {
    centerX: number;
    centerY: number;
    getItemNodes(): SectorSceneNode[];
};

export function pickByMatchingAngle(series: SectorSeries, point: Point): SeriesNodePickMatch | undefined {
    const dy = point.y - series.centerY;
    const dx = point.x - series.centerX;
    const angle = Math.atan2(dy, dx);
    const sectors: SectorSceneNode[] = series.getItemNodes();
    for (const sector of sectors) {
        if (sector.datum.missing === true) continue;

        if (isBetweenAngles(angle, sector.startAngle, sector.endAngle)) {
            const radius = Math.sqrt(dx * dx + dy * dy);
            let distance = 0;
            if (radius < sector.innerRadius) {
                distance = sector.innerRadius - radius;
            } else if (radius > sector.outerRadius) {
                distance = radius - sector.outerRadius;
            }
            return { datum: sector.datum, distance };
        }
    }
    return undefined;
}
