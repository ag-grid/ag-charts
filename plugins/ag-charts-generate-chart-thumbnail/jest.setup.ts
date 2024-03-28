import { CanvasRenderingContext2D } from 'canvas';
import { Path2D, applyPath2DToCanvasRenderingContext } from 'path2d';

// @ts-ignore
global.Path2D = Path2D;

applyPath2DToCanvasRenderingContext(CanvasRenderingContext2D);
