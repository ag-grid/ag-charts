import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import { Layers } from '../../layers';

type WidthProvider = { get width(): number };
type NodeWithWidth = Node & WidthProvider;

export class RangeSelector extends Group {
    private background: Group;

    private x = 0;
    private y = 0;
    private width = 200;
    private height = 30;
    private minHandle: WidthProvider;
    private maxHandle: WidthProvider;

    constructor(mask: Node, minHandle: NodeWithWidth, maxHandle: NodeWithWidth) {
        super({ name: 'rangeSelectorGroup', layer: true, zIndex: Layers.NAVIGATOR_ZINDEX });
        this.isContainerNode = true;

        this.minHandle = minHandle;
        this.maxHandle = maxHandle;
        this.background = new Group({ name: 'navigator-background' });
        this.background.zIndex = 1;

        this.append([this.background, mask, minHandle, maxHandle]);
    }

    layout(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

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
        const { x, y, width, height } = this;
        const minOff = this.minHandle.width / 2;
        const maxOff = this.maxHandle.width / 2;
        return new BBox(x - minOff, y, width + (minOff + maxOff), height);
    }
}
