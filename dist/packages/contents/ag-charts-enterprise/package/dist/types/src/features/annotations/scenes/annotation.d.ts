import { _Scene } from 'ag-charts-community';
export declare abstract class Annotation extends _Scene.Group {
    static isCheck(value: unknown, type: string): boolean;
    locked: boolean;
    abstract type: string;
    abstract activeHandle?: string;
    private cachedBBoxWithoutHandles?;
    abstract containsPoint(x: number, y: number): boolean;
    abstract toggleHandles(show: boolean | Record<string, boolean>): void;
    abstract toggleActive(active: boolean): void;
    abstract stopDragging(): void;
    abstract getAnchor(): {
        x: number;
        y: number;
        position?: string;
    };
    abstract getCursor(): string;
    protected getCachedBBoxWithoutHandles(): Readonly<_Scene.BBox>;
    protected computeBBoxWithoutHandles(): _Scene.BBox;
    render(renderCtx: _Scene.RenderContext): void;
}
