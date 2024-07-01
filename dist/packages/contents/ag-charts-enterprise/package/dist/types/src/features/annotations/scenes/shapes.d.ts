import { _Scene } from 'ag-charts-community';
export declare class CollidableLine extends _Scene.Line {
    collisionBBox?: _Scene.BBox;
    private readonly growCollisionBox;
    updateCollisionBBox(): void;
    isPointInPath(pointX: number, pointY: number): boolean;
}
