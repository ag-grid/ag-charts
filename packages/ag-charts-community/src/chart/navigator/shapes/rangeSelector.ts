import { BBox } from '../../../scene/bbox';
import { RedrawType } from '../../../scene/changeDetectable';
import { Group, TranslatableGroup } from '../../../scene/group';
import { Layer } from '../../../scene/layer';
import type { Node } from '../../../scene/node';
import { ZIndexMap } from '../../zIndexMap';

export class RangeSelector extends Layer {
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
        this.markDirty(RedrawType.MAJOR);
    }

    updateBackground(oldGroup?: Group, newGroup?: Group) {
        if (oldGroup != null) {
            this.background.removeChild(oldGroup);
        }

        if (newGroup != null) {
            this.background.appendChild(newGroup);
        }
        this.markDirty(RedrawType.MAJOR);
    }

    protected override computeBBox() {
        const { x, y, width, height, lOffset, rOffset } = this;
        return new BBox(x - lOffset, y, width + (lOffset + rOffset), height);
    }
}
