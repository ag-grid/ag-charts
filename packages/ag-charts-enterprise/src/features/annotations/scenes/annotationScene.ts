import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Handle } from './handle';

const { zIndexLayers, isObject } = _ModuleSupport;

export abstract class AnnotationScene extends _Scene.Group {
    static isCheck(value: unknown, type: string) {
        return isObject(value) && Object.hasOwn(value, 'type') && value.type === type;
    }

    override name = 'AnnotationScene';
    override zIndex = zIndexLayers.CHART_ANNOTATION;

    public abstract type: string;
    public abstract activeHandle?: string;

    abstract override containsPoint(x: number, y: number): boolean;

    public abstract toggleHandles(show: boolean | Record<string, boolean>): void;
    public abstract toggleActive(active: boolean): void;
    public abstract stopDragging(): void;
    public abstract getAnchor(): _ModuleSupport.ToolbarAnchor;
    public abstract getCursor(): string | undefined;

    public toggleHovered(hovered: boolean) {
        this.toggleHandles(hovered);
    }

    private *nonHandleChildren() {
        for (const child of this.children()) {
            if (!(child instanceof Handle)) {
                yield child;
            }
        }
    }

    protected computeBBoxWithoutHandles() {
        return _Scene.Transformable.toCanvas(this, _Scene.Group.computeChildrenBBox(this.nonHandleChildren()));
    }
}
