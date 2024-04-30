import type { Marker } from './marker';
export type MarkerConstructor = typeof Marker;
type MarkerSupportedShapes = 'circle' | 'cross' | 'diamond' | 'heart' | 'plus' | 'pin' | 'square' | 'star' | 'triangle';
export type MarkerShape = MarkerConstructor | MarkerSupportedShapes;
export declare function isMarkerShape(shape: unknown): shape is MarkerSupportedShapes;
export declare function getMarker(shape?: MarkerShape | string): MarkerConstructor;
export {};
