import { Circle } from './circle';
import { Cross } from './cross';
import { Diamond } from './diamond';
import { Heart } from './heart';
import type { Marker } from './marker';
import { Pin } from './pin';
import { Plus } from './plus';
import { Square } from './square';
import { Star } from './star';
import { Triangle } from './triangle';

export type MarkerConstructor = typeof Marker;
type MarkerSupportedShapes = 'circle' | 'cross' | 'diamond' | 'heart' | 'plus' | 'pin' | 'square' | 'star' | 'triangle';
export type MarkerShape = MarkerConstructor | MarkerSupportedShapes;

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

export function isMarkerShape(shape: unknown): shape is MarkerSupportedShapes {
    return typeof shape === 'string' && MARKER_SUPPORTED_SHAPES.includes(shape);
}

// This function is in its own file because putting it into SeriesMarker makes the Legend
// suddenly aware of the series (it's an agnostic component), and putting it into Marker
// introduces circular dependencies.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export function getMarker(shape: MarkerShape | string = Square): MarkerConstructor {
    if (isMarkerShape(shape)) {
        return MARKER_SHAPES[shape];
    }
    if (typeof shape === 'function') {
        return shape;
    }
    return Square;
}
