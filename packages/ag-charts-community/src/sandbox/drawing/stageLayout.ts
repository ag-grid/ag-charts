import type { BBox, DirectionMetrics } from '../types/commonTypes';
import { Direction } from '../types/enums';
import { LayoutHierarchy } from './drawingEnums';
import type { IStage, IStageLayout, StageBlock } from './drawingTypes';
import type { SpatialNode } from './nodes/spatialNode';
import { TextNode } from './nodes/textNode';

export class StageLayout implements IStageLayout {
    private readonly childMap = new Map<SpatialNode, StageBlock>();

    readonly title = this.registerBlock(new TextNode(), Direction.Top, LayoutHierarchy.Title);
    readonly subtitle = this.registerBlock(new TextNode(), Direction.Top, LayoutHierarchy.Subtitle);
    readonly footnote = this.registerBlock(new TextNode(), Direction.Bottom, LayoutHierarchy.Footnote);

    padding?: DirectionMetrics;

    setTitle({ margin, ...options }: any) {
        this.childMap.get(this.title)!.margin = margin;
        Object.assign(this.title, options);
    }

    setSubtitle({ margin, ...options }: any) {
        this.childMap.get(this.subtitle)!.margin = margin;
        Object.assign(this.subtitle, options);
    }

    setFootnote({ margin, ...options }: any) {
        this.childMap.get(this.footnote)!.margin = margin;
        Object.assign(this.footnote, options);
    }

    drawLayout(stage: IStage) {
        const availableBBox = this.calculateBBox(stage);
        const children = Array.from(this.childMap).sort((a, b) => a[1].order - b[1].order);
        for (const [child, block] of children) {
            if (block.enabled === false) continue;
            this.divideBlock(child, block, availableBBox);
            this.renderBlock(child);
        }
        return availableBBox;
    }

    registerBlock(node: SpatialNode, position: Direction, order: LayoutHierarchy, margin: number = 0) {
        this.childMap.set(node, { position, order, margin });
        return node;
    }

    private calculateBBox(stage: IStage): BBox {
        return {
            x: Math.max(0, this.padding?.left ?? 0),
            y: Math.max(0, this.padding?.top ?? 0),
            width: Math.max(0, stage.width - (this.padding?.left ?? 0) - (this.padding?.right ?? 0)),
            height: Math.max(0, stage.height - (this.padding?.top ?? 0) - (this.padding?.bottom ?? 0)),
        };
    }

    private divideBlock(node: SpatialNode, block: StageBlock, availableBBox: BBox) {
        const { width, height } = node.getSize();

        switch (block.position) {
            case Direction.Top:
                availableBBox.y += height + block.margin;
                availableBBox.height -= height + block.margin;
                break;

            case Direction.Left:
                availableBBox.x += width + block.margin;
                availableBBox.width -= width + block.margin;
                break;

            case Direction.Bottom:
                availableBBox.height -= height + block.margin;
                break;

            case Direction.Right:
                availableBBox.width -= width + block.margin;
                break;
        }
    }

    private renderBlock(_node: SpatialNode) {
        // render node and reduce available size
    }
}
