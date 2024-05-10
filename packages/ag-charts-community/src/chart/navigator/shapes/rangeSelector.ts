import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import { Layers } from '../../layers';

export class RangeSelector extends Group {
    private readonly background: Group;

    private x = 0;
    private y = 0;
    private width = 200;
    private height = 30;
    private lOffset = 0;
    private rOffset = 0;

    constructor(children: Node[]) {
        super({ name: 'rangeSelectorGroup', layer: true, zIndex: Layers.NAVIGATOR_ZINDEX });
        this.isContainerNode = true;

        this.background = new Group({ name: 'navigator-background' });
        this.background.zIndex = 1;

        this.appendChild(this.background);
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
    }

    updateBackground(oldGroup?: Group, newGroup?: Group) {
        if (oldGroup != null) {
            this.background.removeChild(oldGroup);
        }

        if (newGroup != null) {
            this.background.appendChild(newGroup);
        }
    }

    override computeBBox() {
        const { x, y, width, height, lOffset, rOffset } = this;
        return new BBox(x - lOffset, y, width + (lOffset + rOffset), height);
    }
}
