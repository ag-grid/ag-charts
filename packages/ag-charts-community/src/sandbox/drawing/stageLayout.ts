import type { BBox, DirectionMetrics } from '../types/commonTypes';
import { Direction } from '../types/enums';
import { LayoutHierarchy } from './drawingEnums';
import type { IStage, IStageLayout, StageBlock } from './drawingTypes';
import { TextNode } from './nodes/textNode';
import type { TreeNode } from './nodes/treeNode';

export class StageLayout implements IStageLayout {
    readonly childMap = new Map<TreeNode, StageBlock>();

    readonly title = this.registerBlock(new TextNode(), Direction.Top, LayoutHierarchy.Title);
    readonly subtitle = this.registerBlock(new TextNode(), Direction.Top, LayoutHierarchy.Subtitle);
    readonly footnote = this.registerBlock(new TextNode(), Direction.Bottom, LayoutHierarchy.Footnote);

    padding?: DirectionMetrics;

    drawLayout(stage: IStage) {
        const availableBox: BBox = {
            x: Math.max(0, this.padding?.left ?? 0),
            y: Math.max(0, this.padding?.top ?? 0),
            width: Math.max(0, stage.width - (this.padding?.right ?? 0)),
            height: Math.max(0, stage.height - (this.padding?.bottom ?? 0)),
        };
        const children = Array.from(this.childMap).sort((a, b) => a[1].order - b[1].order);
        for (const [child, block] of children) {
            if (block.enabled === false) continue;
            this.render(child, block.margin, availableBox);
        }
        return availableBox;
    }

    registerBlock(node: TreeNode, position: Direction, order: LayoutHierarchy, margin: number = 0) {
        this.childMap.set(node, { position, order, margin });
        return node;
    }

    private render(_node: TreeNode, _margin: number, _availableBox: BBox) {
        // render node and reduce available size
    }
}
