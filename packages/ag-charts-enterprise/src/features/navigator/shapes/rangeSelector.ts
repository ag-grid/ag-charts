import { _ModuleSupport } from 'ag-charts-community';
import { ZIndexMap } from 'ag-charts-core';

export class RangeSelector extends _ModuleSupport.Group {
    private readonly background: _ModuleSupport.TranslatableGroup;

    private x = 0;
    private y = 0;
    private width = 200;
    private height = 30;
    private lOffset = 0;
    private rOffset = 0;

    constructor(children: _ModuleSupport.Node[]) {
        super({ name: 'rangeSelectorGroup', zIndex: ZIndexMap.NAVIGATOR });
        this.background = this.appendChild(
            new _ModuleSupport.TranslatableGroup({ name: 'navigator-background', zIndex: 1 })
        );
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

    updateBackground(oldGroup?: _ModuleSupport.Group, newGroup?: _ModuleSupport.Group) {
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
        return new _ModuleSupport.BBox(x - lOffset, y, width + (lOffset + rOffset), height);
    }
}
