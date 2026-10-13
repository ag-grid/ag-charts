import { SceneChangeDetection, TranslatableGroup } from 'ag-charts-core';
import type { BBox, CanvasContext } from 'ag-charts-core';

export class MiniChartGroup extends TranslatableGroup {
    @SceneChangeDetection()
    inset = 0;

    @SceneChangeDetection()
    cornerRadius = 0;

    protected override applyClip(ctx: CanvasContext, clipRect: BBox) {
        const { cornerRadius, inset } = this;
        const { x, y, width, height } = clipRect;

        ctx.beginPath();
        ctx.roundRect(x + inset, y + inset, width - 2 * inset, height - 2 * inset, cornerRadius);
        ctx.clip();
    }
}
