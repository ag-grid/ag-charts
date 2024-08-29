import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Handle } from './handle';

const { Layers, isObject } = _ModuleSupport;

export abstract class AnnotationScene extends _Scene.Group {
    static isCheck(value: unknown, type: string) {
        return isObject(value) && Object.hasOwn(value, 'type') && value.type === type;
    }

    override name = 'AnnotationScene';
    override zIndex = Layers.CHART_ANNOTATION_ZINDEX;

    public abstract type: string;
    public abstract activeHandle?: string;

    abstract override containsPoint(x: number, y: number): boolean;

    public abstract toggleHandles(show: boolean | Record<string, boolean>): void;
    public abstract toggleActive(active: boolean): void;
    public abstract stopDragging(): void;
    public abstract getAnchor(): _ModuleSupport.Anchor;
    public abstract getCursor(): string | undefined;

    public toggleHovered(hovered: boolean) {
        this.toggleHandles(hovered);
    }

    protected computeBBoxWithoutHandles() {
        return _Scene.Transformable.toCanvas(
            this,
            _Scene.Group.computeChildrenBBox(this.children.filter((node) => !(node instanceof Handle)))
        );
    }
}
