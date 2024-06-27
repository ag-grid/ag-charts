import { _Scene } from 'ag-charts-community';

import type { Coords } from '../annotationTypes';

type UnivariantHandleStyles = { x: number; y: number } & { [K in keyof _Scene.Rect]?: _Scene.Rect[K] };
type DivariantHandleStyles = { x: number; y: number } & { [K in keyof _Scene.Circle]?: _Scene.Circle[K] };

export abstract class Handle extends _Scene.Group {
    public static readonly HANDLE_SIZE: number;
    public static readonly GLOW_SIZE: number;
    public static readonly INACTIVE_STROKE_WIDTH = 1;

    protected abstract handle: _Scene.Rect | _Scene.Circle;
    protected abstract glow: _Scene.Rect | _Scene.Circle;
    protected active = false;
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
        this.active = active;
        if (!active) {
            this.handle.strokeWidth = Handle.INACTIVE_STROKE_WIDTH;
        }
    }

    public toggleHovered(hovered: boolean) {
        this.glow.visible = !this.locked && hovered;
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
    static override readonly HANDLE_SIZE = 7;
    static override readonly GLOW_SIZE = 9;

    override handle = new _Scene.Circle();
    override glow = new _Scene.Circle();

    constructor() {
        super();
        this.append([this.handle]);

        this.handle.size = InvariantHandle.HANDLE_SIZE;
        this.handle.strokeWidth = Handle.INACTIVE_STROKE_WIDTH;
        this.handle.zIndex = 2;
    }

    override update(styles: { [K in keyof _Scene.Circle]?: _Scene.Circle[K] }) {
        this.handle.setProperties({ ...styles, strokeWidth: Handle.INACTIVE_STROKE_WIDTH });
    }

    override drag(target: Coords): { point: Coords; offset: Coords } {
        return { point: target, offset: { x: 0, y: 0 } };
    }
}

export class UnivariantHandle extends Handle {
    static override readonly HANDLE_SIZE = 12;
    static override readonly GLOW_SIZE = 16;
    static readonly CORNER_RADIUS = 4;

    override handle = new _Scene.Rect();
    override glow = new _Scene.Rect();

    public gradient: 'horizontal' | 'vertical' = 'horizontal';

    private cachedStyles?: { [K in keyof _Scene.Rect]?: _Scene.Rect[K] };

    constructor() {
        super();
        this.append([this.glow, this.handle]);

        this.handle.cornerRadius = UnivariantHandle.CORNER_RADIUS;
        this.handle.width = UnivariantHandle.HANDLE_SIZE;
        this.handle.height = UnivariantHandle.HANDLE_SIZE;
        this.handle.strokeWidth = Handle.INACTIVE_STROKE_WIDTH;
        this.handle.zIndex = 2;

        this.glow.cornerRadius = UnivariantHandle.CORNER_RADIUS;
        this.glow.width = UnivariantHandle.GLOW_SIZE;
        this.glow.height = UnivariantHandle.GLOW_SIZE;
        this.glow.strokeWidth = 0;
        this.glow.fillOpacity = 0.2;
        this.glow.zIndex = 1;
        this.glow.visible = false;
    }

    override toggleLocked(locked: boolean): void {
        super.toggleLocked(locked);

        if (locked) {
            const offset = (UnivariantHandle.HANDLE_SIZE - InvariantHandle.HANDLE_SIZE) / 2;
            this.handle.cornerRadius = 1;
            this.handle.fill = this.handle.stroke;
            this.handle.strokeWidth = 0;
            this.handle.x += offset;
            this.handle.y += offset;
            this.handle.width = InvariantHandle.HANDLE_SIZE;
            this.handle.height = InvariantHandle.HANDLE_SIZE;
            this.glow.width = InvariantHandle.GLOW_SIZE;
            this.glow.height = InvariantHandle.GLOW_SIZE;
        } else {
            this.handle.cornerRadius = UnivariantHandle.CORNER_RADIUS;
            this.handle.width = UnivariantHandle.HANDLE_SIZE;
            this.handle.height = UnivariantHandle.HANDLE_SIZE;
            this.glow.width = UnivariantHandle.GLOW_SIZE;
            this.glow.height = UnivariantHandle.GLOW_SIZE;
            if (this.cachedStyles) {
                this.handle.setProperties(this.cachedStyles);
            }
        }
    }

    override update(styles: UnivariantHandleStyles) {
        if (!this.active) {
            delete styles.strokeWidth;
        }

        if (this.locked) {
            delete styles.fill;
            delete styles.strokeWidth;

            const offset = (UnivariantHandle.HANDLE_SIZE - InvariantHandle.HANDLE_SIZE) / 2;
            styles.x -= offset;
            styles.y -= offset;
        } else {
            this.cachedStyles = styles;
        }

        this.handle.setProperties(styles);
        this.glow.setProperties({
            ...styles,
            x: (styles.x ?? this.glow.x) - 2,
            y: (styles.y ?? this.glow.y) - 2,
            strokeWidth: 0,
            fill: styles.stroke,
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
        if (this.locked) return 'default';
        return this.gradient === 'vertical' ? 'col-resize' : 'row-resize';
    }
}

export class DivariantHandle extends Handle {
    static override readonly HANDLE_SIZE = 11;
    static override readonly GLOW_SIZE = 17;

    override handle = new _Scene.Circle();
    override glow = new _Scene.Circle();

    private cachedStyles?: DivariantHandleStyles;

    constructor() {
        super();
        this.append([this.glow, this.handle]);

        this.handle.size = DivariantHandle.HANDLE_SIZE;
        this.handle.strokeWidth = Handle.INACTIVE_STROKE_WIDTH;
        this.handle.zIndex = 2;

        this.glow.size = DivariantHandle.GLOW_SIZE;
        this.glow.strokeWidth = 0;
        this.glow.fillOpacity = 0.2;
        this.glow.zIndex = 1;
        this.glow.visible = false;
    }

    override toggleLocked(locked: boolean): void {
        super.toggleLocked(locked);

        if (locked) {
            this.handle.fill = this.handle.stroke;
            this.handle.strokeWidth = 0;
            this.handle.size = InvariantHandle.HANDLE_SIZE;
            this.glow.size = InvariantHandle.GLOW_SIZE;
        } else {
            this.handle.size = DivariantHandle.HANDLE_SIZE;
            this.glow.size = DivariantHandle.GLOW_SIZE;
            if (this.cachedStyles) {
                this.handle.setProperties(this.cachedStyles);
            }
        }
    }

    override update(styles: DivariantHandleStyles) {
        if (!this.active) {
            delete styles.strokeWidth;
        }

        if (this.locked) {
            delete styles.fill;
            delete styles.strokeWidth;
        } else {
            this.cachedStyles = styles;
        }

        this.handle.setProperties(styles);
        this.glow.setProperties({ ...styles, strokeWidth: 0, fill: styles.stroke });
    }
}
