import type { ExtendedPath2D } from '../../../scene/extendedPath2D';
import type { Point } from '../../../scene/point';
export declare function plotLinearPoints(path: ExtendedPath2D, points: Iterable<Point>, continuePath: boolean): void;
export declare function plotSmoothPoints(path: ExtendedPath2D, iPoints: Iterable<Point>, tension: number, continuePath: boolean): void;
export declare function plotStepPoints(path: ExtendedPath2D, points: Iterable<Point>, align: number, continuePath: boolean): void;
