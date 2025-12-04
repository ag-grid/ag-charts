import { _ModuleSupport } from 'ag-charts-community';
import { SceneChangeDetection } from 'ag-charts-core';

const { TranslatableGroup } = _ModuleSupport;

export class MiniChartGroup extends TranslatableGroup {
    @SceneChangeDetection()
    inset = 0;

    @SceneChangeDetection()
    cornerRadius = 0;

    protected override applyClip(ctx: _ModuleSupport.CanvasContext, clipRect: _ModuleSupport.BBox) {
        const { cornerRadius, inset } = this;
        const { x, y, width, height } = clipRect;

        // Create a Path2D to avoid `skia-canvas` bug where `ctx.clip` is not taking transform into account when not using a path argument.
        // https://github.com/samizdatco/skia-canvas/issues/235
        const path = new Path2D();
        path.roundRect(x + inset, y + inset, width - 2 * inset, height - 2 * inset, cornerRadius);
        ctx.clip(path);
    }
}
