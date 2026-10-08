import { BBox, Group, TranslatableGroup, ZIndexMap } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';

export class RangeSelector extends Group {
    private readonly background: TranslatableGroup;

    private x = 0;
    private y = 0;
    private width = 200;
    private height = 30;
    private lOffset = 0;
    private rOffset = 0;

    constructor(children: Node[]) {
        super({ name: 'rangeSelectorGroup', zIndex: ZIndexMap.NAVIGATOR });
        this.background = this.appendChild(new TranslatableGroup({ name: 'navigator-background', zIndex: 1 }));
        this.append(children);
    }

    layout(x: number, y: number, width: number, height: number, lOffset: number, rOffset: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.lOffset = lOffset;
        this.rOffset = rOffset;

        this.background.translationX = x;
        this.background.translationY = y;
        this.markDirty('RangeSelector');
    }

    updateBackground(oldGroup?: Group, newGroup?: Group) {
        if (oldGroup != null) {
            oldGroup.remove();
        }

        if (newGroup != null) {
            this.background.appendChild(newGroup);
        }
        this.markDirty('RangeSelector');
    }

    protected override computeBBox() {
        const { x, y, width, height, lOffset, rOffset } = this;
        return new BBox(x - lOffset, y, width + (lOffset + rOffset), height);
    }
}
