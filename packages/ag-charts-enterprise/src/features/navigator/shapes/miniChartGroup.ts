import { _ModuleSupport } from 'ag-charts-community';
import { SceneChangeDetection, getPath2D } from 'ag-charts-core';

const { TranslatableGroup } = _ModuleSupport;

export class MiniChartGroup extends TranslatableGroup {
    @SceneChangeDetection()
    inset = 0;

    @SceneChangeDetection()
    cornerRadius = 0;

    protected override applyClip(ctx: _ModuleSupport.CanvasContext, clipRect: _ModuleSupport.BBox) {
        const { cornerRadius, inset } = this;
        const { x, y, width, height } = clipRect;

        const Path2DCtor = getPath2D();
        const path = new Path2DCtor();
        path.roundRect(x + inset, y + inset, width - 2 * inset, height - 2 * inset, cornerRadius);
        ctx.clip(path);
    }
}
