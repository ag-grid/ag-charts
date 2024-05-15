import type { FontWeight } from '../../../options/chart/types';
import { applyContextOptions } from '../../../util/canvas.util';
import type {
    CssColor,
    FillOptions,
    FontOptions,
    LineOptions,
    PixelSize,
    Ratio,
    StrokeOptions,
    TextOptions,
} from '../../types/commonTypes';
import { TreeNode } from './treeNode';

export interface CanvasContextProperties extends FillOptions, StrokeOptions, LineOptions, FontOptions, TextOptions {
    cursor?: string;
    clipPath?: Path2D;
    opacity?: Ratio;
    pointerEvents?: boolean;
}

export type WithCallback = (ctx: CanvasRenderingContext2D, sceneGroup: SceneGroup) => void;

export class SceneGroup extends TreeNode implements CanvasContextProperties {
    cursor?: string;
    clipPath?: Path2D;
    opacity?: Ratio;
    pointerEvents?: boolean;

    fill?: CssColor | CanvasGradient | CanvasPattern;
    fillOpacity?: Ratio;

    stroke?: CssColor | CanvasGradient | CanvasPattern;
    strokeOpacity?: Ratio;
    strokeWidth?: number;

    lineDash?: number[];
    lineDashOffset?: number;
    lineCap: CanvasLineCap = 'butt';
    lineJoin: CanvasLineJoin = 'miter';
    miterLimit: number = 10;

    fontFamily?: string;
    fontSize?: PixelSize;
    fontStyle?: string;
    fontWeight?: FontWeight;

    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;

    withContextScope(ctx: CanvasRenderingContext2D, callback: WithCallback) {
        ctx.save();

        if (this.clipPath) {
            ctx.clip(this.clipPath);
        }

        applyContextOptions(ctx, this);
        callback(ctx, this);
        ctx.restore();
    }
}
