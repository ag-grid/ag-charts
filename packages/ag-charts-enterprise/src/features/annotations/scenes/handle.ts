import { _Scene } from 'ag-charts-community';

import type { Coords } from '../annotationTypes';

export abstract class Handle extends _Scene.Group {
    protected abstract handle: _Scene.Rect | _Scene.Circle;
    protected abstract glow: _Scene.Rect | _Scene.Circle;
    protected locked = false;

    override visible = false;

    public abstract update(styles: {
        [K in keyof (_Scene.Rect | _Scene.Circle)]?: (_Scene.Rect | _Scene.Circle)[K];
    }): void;

    public drag(target: Coords): { point: Coords; offset: Coords } {
        const { handle, locked } = this;

        if (locked) {
            return { point: { x: handle.x, y: handle.y }, offset: { x: 0, y: 0 } };
        }
        return {
            point: target,
            offset: { x: target.x - handle.x, y: target.y - handle.y },
        };
    }

    public toggleActive(active: boolean) {
        this.handle.strokeWidth = active ? 1.5 : 1;
        this.handle.dirtyPath = true;
    }

    public toggleHovered(hovered: boolean) {
        this.glow.visible = hovered;
        this.glow.dirtyPath = true;
    }

    public toggleDragging(dragging: boolean): void {
        if (this.locked) return;

        this.handle.visible = !dragging;
        this.glow.visible = this.glow.visible && !dragging;
        this.handle.dirtyPath = true;
        this.glow.dirtyPath = true;
    }

    public toggleLocked(locked: boolean) {
        this.locked = locked;
    }

    public getCursor() {
        return 'default';
    }

    override containsPoint(x: number, y: number) {
        return this.handle.containsPoint(x, y);
    }
}

export class InvariantHandle extends Handle {
    static readonly HANDLE_SIZE = 7;
    static readonly GLOW_SIZE = 9;

    override handle = new _Scene.Circle();
    override glow = new _Scene.Circle();

    constructor() {
        super();
        this.append([this.handle]);

        this.handle.size = InvariantHandle.HANDLE_SIZE;
        this.handle.strokeWidth = 1;
        this.handle.zIndex = 2;
    }

    override update(styles: { [K in keyof _Scene.Circle]?: _Scene.Circle[K] }) {
        this.handle.setProperties(styles);
    }

    override drag(target: Coords): { point: Coords; offset: Coords } {
        return { point: target, offset: { x: 0, y: 0 } };
    }
}

export class UnivariantHandle extends Handle {
    override handle = new _Scene.Rect();
    override glow = new _Scene.Rect();

    public gradient: 'horizontal' | 'vertical' = 'horizontal';

    constructor() {
        super();
        this.append([this.glow, this.handle]);

        this.handle.cornerRadius = 4;
        this.handle.width = 12;
        this.handle.height = 12;
        this.handle.strokeWidth = 1;
        this.handle.zIndex = 2;

        this.glow.cornerRadius = 4;
        this.glow.width = 16;
        this.glow.height = 16;
        this.glow.strokeWidth = 0;
        this.glow.fillOpacity = 0.2;
        this.glow.zIndex = 1;
        this.glow.visible = false;
    }

    override toggleLocked(locked: boolean): void {
        super.toggleLocked(locked);
        this.handle.visible = !locked;
        this.glow.visible = !locked;
    }

    override update(styles: { [K in keyof _Scene.Rect]?: _Scene.Rect[K] }) {
        this.handle.setProperties(styles);
        this.glow.setProperties({
            ...styles,
            x: (styles.x ?? this.glow.x) - 2,
            y: (styles.y ?? this.glow.y) - 2,
            fill: styles.stroke ?? styles.fill,
        });
    }

    override drag(target: Coords) {
        if (this.locked) {
            return { point: target, offset: { x: 0, y: 0 } };
        }

        if (this.gradient === 'vertical') {
            return {
                point: { x: target.x, y: this.handle.y },
                offset: { x: target.x - this.handle.x, y: 0 },
            };
        }
        return {
            point: { x: this.handle.x, y: target.y },
            offset: { x: 0, y: target.y - this.handle.y },
        };
    }

    override getCursor() {
        return this.gradient === 'vertical' ? 'col-resize' : 'row-resize';
    }
}

export class DivariantHandle extends Handle {
    private static readonly HANDLE_SIZE = 11;
    private static readonly GLOW_SIZE = 17;

    override handle = new _Scene.Circle();
    override glow = new _Scene.Circle();

    constructor() {
        super();
        this.append([this.glow, this.handle]);

        this.handle.size = DivariantHandle.HANDLE_SIZE;
        this.handle.strokeWidth = 1;
        this.handle.zIndex = 2;

        this.glow.size = DivariantHandle.GLOW_SIZE;
        this.glow.strokeWidth = 0;
        this.glow.fillOpacity = 0.2;
        this.glow.zIndex = 1;
        this.glow.visible = false;
    }

    override toggleLocked(locked: boolean): void {
        super.toggleLocked(locked);
        this.handle.size = locked ? InvariantHandle.HANDLE_SIZE : DivariantHandle.HANDLE_SIZE;
        this.glow.size = locked ? InvariantHandle.GLOW_SIZE : DivariantHandle.GLOW_SIZE;
    }

    override update(styles: { [K in keyof _Scene.Circle]?: _Scene.Circle[K] }) {
        this.handle.setProperties(styles);
        this.glow.setProperties({ ...styles, fill: styles.stroke });
    }
}
