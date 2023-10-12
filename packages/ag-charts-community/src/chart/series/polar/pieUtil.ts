import type { FromToMotionPropFnContext, NodeUpdateState } from '../../../motion/fromToMotion';
import type { Sector } from '../../../scene/shape/sector';
import { toRadians } from '../../../util/angle';

type AnimatableSectorDatum = {
    radius: number;
    startAngle: number;
    endAngle: number;
};

export function preparePieSeriesAnimationFunctions(rotationDegrees: number) {
    const rotation = Math.PI / -2 + toRadians(rotationDegrees);
    const fullRotation = Math.PI / -2 + toRadians(rotationDegrees + 360);

    const fromFn = (
        sect: Sector,
        _datum: AnimatableSectorDatum,
        status: NodeUpdateState,
        { prevFromProps, last }: FromToMotionPropFnContext<Sector>
    ) => {
        // Default to starting from current state.
        let startAngle = sect.startAngle;
        let endAngle = sect.endAngle;

        if (status === 'unknown' || (status === 'added' && !prevFromProps)) {
            // Start of animation (full new data) - sweep in.
            startAngle = rotation;
            endAngle = rotation;
        } else if (status === 'added' && prevFromProps) {
            startAngle = prevFromProps.endAngle ?? rotation;
            endAngle = prevFromProps.endAngle ?? rotation;
        } else if (last) {
            endAngle = fullRotation;
        }

        return { startAngle, endAngle };
    };
    const toFn = (
        _sect: Sector,
        datum: AnimatableSectorDatum,
        status: NodeUpdateState,
        { prevLive }: FromToMotionPropFnContext<Sector>
    ) => {
        // Default to moving to target state.
        let startAngle = datum.startAngle;
        let endAngle = datum.endAngle;

        if (status === 'removed' && prevLive) {
            startAngle = prevLive.datum?.endAngle;
            endAngle = prevLive.datum?.endAngle;
        } else if (status === 'removed' && !prevLive) {
            startAngle = rotation;
            endAngle = rotation;
        }

        return { startAngle, endAngle };
    };

    return { toFn, fromFn };
}

export function resetPieSelectionsFn(_node: Sector, datum: AnimatableSectorDatum) {
    return {
        startAngle: datum.startAngle,
        endAngle: datum.endAngle,
    };
}
