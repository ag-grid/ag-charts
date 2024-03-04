import type { FromToMotionPropFn } from '../../../motion/fromToMotion';
import type { Marker } from '../../marker/marker';

type AnimatableMapMarkerDatum = {
    scalingX: number;
    scalingY: number;
};

export function prepareMapMarkerAnimationFunctions() {
    const fromFn: FromToMotionPropFn<Marker, AnimatableMapMarkerDatum, unknown> = (marker, _datum, status) => {
        if (status === 'removed') {
            return { scalingX: 1, scalingY: 1 };
        } else if (marker.previousDatum == null) {
            return { scalingX: 0, scalingY: 0 };
        }
        return { scalingX: marker.scalingX, scalingY: marker.scalingY };
    };
    const toFn: FromToMotionPropFn<Marker, AnimatableMapMarkerDatum, unknown> = (_marker, _datum, status) => {
        if (status === 'removed') {
            return { scalingX: 0, scalingY: 0 };
        }
        return { scalingX: 1, scalingY: 1 };
    };

    return { fromFn, toFn };
}
