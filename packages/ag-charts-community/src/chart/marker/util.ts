import type { AgMarkerShape, AgMarkerShapeFn } from 'ag-charts-types';

import { Circle } from './circle';
import { Cross } from './cross';
import { Diamond } from './diamond';
import { Heart } from './heart';
import { Marker } from './marker';
import { Pin } from './pin';
import { Plus } from './plus';
import { Square } from './square';
import { Star } from './star';
import { Triangle } from './triangle';

type MarkerSupportedShapes = Exclude<AgMarkerShape, AgMarkerShapeFn>;
export type MarkerConstructor = typeof Marker;

const MARKER_SHAPES: { [K in MarkerSupportedShapes]: MarkerConstructor } = {
    circle: Circle,
    cross: Cross,
    diamond: Diamond,
    heart: Heart,
    pin: Pin,
    plus: Plus,
    square: Square,
    star: Star,
    triangle: Triangle,
};

const MARKER_SUPPORTED_SHAPES = Object.keys(MARKER_SHAPES);

export function isSupportedMarkerShape(shape: unknown): shape is MarkerSupportedShapes {
    return typeof shape === 'string' && MARKER_SUPPORTED_SHAPES.includes(shape);
}

function markerFactory(pathFn: AgMarkerShapeFn) {
    return class CustomMarker extends Marker {
        override updatePath() {
            const { path, x, y, size } = this;
            pathFn({ path, x, y, size });
        }
    };
}

// This function is in its own file because putting it into SeriesMarker makes the Legend
// suddenly aware of the series (it's an agnostic component), and putting it into Marker
// introduces circular dependencies.
export function getMarker(shape: AgMarkerShape = 'square'): MarkerConstructor {
    if (isSupportedMarkerShape(shape)) {
        return MARKER_SHAPES[shape];
    }
    if (typeof shape === 'function') {
        return markerFactory(shape);
    }
    return Square;
}
