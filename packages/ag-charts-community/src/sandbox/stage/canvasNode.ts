import { StageNode } from './stageNode';

export abstract class CanvasNode extends StageNode {
    public x: number = 0;
    public y: number = 0;
}

export abstract class GraphicsNode extends CanvasNode {}

export abstract class GroupNode extends CanvasNode {}
