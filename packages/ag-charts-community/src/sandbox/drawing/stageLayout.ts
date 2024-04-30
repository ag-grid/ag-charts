import type { BBox, DirectionMetrics } from '../types/commonTypes';
import { Direction } from '../types/enums';
import { LayoutHierarchy } from './drawingEnums';
import type { IStage, IStageLayout, StageBlock } from './drawingTypes';
import type { SpatialNode } from './nodes/spatialNode';
import { TextNode } from './nodes/textNode';

export class StageLayout implements IStageLayout {
    readonly childMap = new Map<SpatialNode, StageBlock>();

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
            this.divideBlock(child, block, availableBox);
            this.renderBlock(child);
        }
        return availableBox;
    }

    registerBlock(node: SpatialNode, position: Direction, order: LayoutHierarchy, margin: number = 0) {
        this.childMap.set(node, { position, order, margin });
        return node;
    }

    private divideBlock(node: SpatialNode, block: StageBlock, availableBox: BBox) {
        const { width, height } = node.getSize();

        switch (block.position) {
            case Direction.Top:
                availableBox.y += height + block.margin;
                availableBox.height -= height + block.margin;
                break;

            case Direction.Left:
                availableBox.x += width + block.margin;
                availableBox.width -= width + block.margin;
                break;

            case Direction.Bottom:
                availableBox.height -= height + block.margin;
                break;

            case Direction.Right:
                availableBox.width -= width + block.margin;
                break;
        }
    }

    private renderBlock(_node: SpatialNode) {
        // render node and reduce available size
    }
}
