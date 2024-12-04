import { _ModuleSupport } from 'ag-charts-community';

const { TranslatableGroup, ScenePathChangeDetection } = _ModuleSupport;

export class MiniChartGroup extends TranslatableGroup {
    @ScenePathChangeDetection()
    inset = 0;

    @ScenePathChangeDetection()
    cornerRadius = 0;

    protected override applyClip(ctx: _ModuleSupport.CanvasContext, clipRect: _ModuleSupport.BBox) {
        const { cornerRadius, inset } = this;
        const { x, y, width, height } = clipRect;

        ctx.beginPath();
        ctx.roundRect(x + inset, y + inset, width - 2 * inset, height - 2 * inset, cornerRadius);
        ctx.clip();
    }
}
