import { _Scene } from 'ag-charts-community';
import type { Coords } from '../annotationTypes';
type InvariantHandleStyles = {
    x: number;
    y: number;
} & {
    [K in keyof _Scene.Circle]?: _Scene.Circle[K];
};
type UnivariantHandleStyles = {
    x: number;
    y: number;
} & {
    [K in keyof _Scene.Rect]?: _Scene.Rect[K];
};
type DivariantHandleStyles = {
    x: number;
    y: number;
} & {
    [K in keyof _Scene.Circle]?: _Scene.Circle[K];
};
export declare abstract class Handle extends _Scene.Group {
    static readonly HANDLE_SIZE: number;
    static readonly GLOW_SIZE: number;
    static readonly INACTIVE_STROKE_WIDTH = 1;
    protected abstract handle: _Scene.Rect | _Scene.Circle;
    protected abstract glow: _Scene.Rect | _Scene.Circle;
    protected active: boolean;
    protected locked: boolean;
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
    toggleLocked(locked: boolean): void;
    getCursor(): string;
    containsPoint(x: number, y: number): boolean;
}
export declare class InvariantHandle extends Handle {
    static readonly HANDLE_SIZE = 7;
    static readonly GLOW_SIZE = 9;
    handle: _Scene.Circle;
    glow: _Scene.Circle;
    constructor();
    update(styles: InvariantHandleStyles): void;
    drag(target: Coords): {
        point: Coords;
        offset: Coords;
    };
}
export declare class UnivariantHandle extends Handle {
    static readonly HANDLE_SIZE = 12;
    static readonly GLOW_SIZE = 16;
    static readonly CORNER_RADIUS = 4;
    handle: _Scene.Rect;
    glow: _Scene.Rect;
    gradient: 'horizontal' | 'vertical';
    private cachedStyles?;
    constructor();
    toggleLocked(locked: boolean): void;
    update(styles: UnivariantHandleStyles): void;
    drag(target: Coords): {
        point: Coords;
        offset: {
            x: number;
            y: number;
        };
    };
    getCursor(): "default" | "col-resize" | "row-resize";
}
export declare class DivariantHandle extends Handle {
    static readonly HANDLE_SIZE = 11;
    static readonly GLOW_SIZE = 17;
    handle: _Scene.Circle;
    glow: _Scene.Circle;
    private cachedStyles?;
    constructor();
    toggleLocked(locked: boolean): void;
    update(styles: DivariantHandleStyles): void;
}
export {};
