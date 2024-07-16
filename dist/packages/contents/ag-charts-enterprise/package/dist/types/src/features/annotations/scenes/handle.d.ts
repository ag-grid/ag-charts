import { _Scene } from 'ag-charts-community';
import type { Coords } from '../annotationTypes';
declare abstract class Handle extends _Scene.Group {
    protected abstract handle: _Scene.Rect | _Scene.Circle;
    protected abstract glow: _Scene.Rect | _Scene.Circle;
    visible: boolean;
    abstract update(styles: {
        [K in keyof (_Scene.Rect | _Scene.Circle)]?: (_Scene.Rect | _Scene.Circle)[K];
    }): void;
    drag(target: Coords): {
        point: Coords;
        offset: Coords;
    };
    toggleActive(active: boolean): void;
    toggleHovered(hovered: boolean): void;
    toggleDragging(dragging: boolean): void;
    getCursor(): string;
    containsPoint(x: number, y: number): boolean;
}
export declare class UnivariantHandle extends Handle {
    handle: _Scene.Rect;
    glow: _Scene.Rect;
    private gradient;
    constructor();
    update(styles: {
        [K in keyof _Scene.Rect]?: _Scene.Rect[K];
    }): void;
    drag(target: Coords): {
        point: {
            x: number;
            y: number;
        };
        offset: {
            x: number;
            y: number;
        };
    };
    getCursor(): "col-resize" | "row-resize";
}
export declare class DivariantHandle extends Handle {
    handle: _Scene.Circle;
    glow: _Scene.Circle;
    constructor();
    update(styles: {
        [K in keyof _Scene.Circle]?: _Scene.Circle[K];
    }): void;
}
export {};
