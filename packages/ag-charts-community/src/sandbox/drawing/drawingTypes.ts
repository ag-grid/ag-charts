import type { BBox } from '../types/commonTypes';
import type { Direction } from '../types/enums';
import type { EventEmitter } from '../util/eventEmitter';
import type { LayoutHierarchy } from './drawingEnums';
import type { TreeNode } from './nodes/treeNode';

export interface IStage {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly events: EventEmitter<StageEventMap>;
    readonly rootElement: HTMLDivElement;
    readonly layout: IStageLayout;

    readonly width: number;
    readonly height: number;

    resize(width: number, height: number): void;
    // update(): void; // TODO move responsibility elsewhere
}

export interface StageEventMap {
    resize: IStage;
    update: IStage;
}

export interface IStageLayout {
    drawLayout(stage: IStage): BBox;
    registerBlock(node: TreeNode, position: Direction, order: LayoutHierarchy, margin: number): TreeNode;
}

export interface StageBlock {
    enabled?: boolean;
    position: Direction;
    order: LayoutHierarchy;
    margin: number;
}
