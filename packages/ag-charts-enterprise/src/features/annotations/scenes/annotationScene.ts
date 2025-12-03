import { _ModuleSupport } from 'ag-charts-community';
import { ZIndexMap, isObject } from 'ag-charts-core';

import { Handle } from './handle';

const {} = _ModuleSupport;

export abstract class AnnotationScene extends _ModuleSupport.Group {
    static isCheck(value: unknown, type: string) {
        return isObject(value) && Object.hasOwn(value, 'type') && value.type === type;
    }

    override name = 'AnnotationScene';
    override zIndex = ZIndexMap.CHART_ANNOTATION;

    public abstract type: string;
    public abstract activeHandle?: string;

    abstract override containsPoint(x: number, y: number): boolean;

    public abstract toggleHandles(show: boolean | Record<string, boolean>): void;
    public abstract toggleActive(active: boolean): void;
    public abstract stopDragging(): void;
    public abstract getAnchor(): _ModuleSupport.FloatingToolbarAnchor;
    public abstract getCursor(): string | undefined;
    public abstract getNodeAtCoords(x: number, y: number): string | undefined;

    public toggleHovered(hovered: boolean, active: boolean, readOnly: boolean | undefined) {
        if (readOnly === true) return;
        this.toggleHandles(hovered || active);
    }

    protected computeBBoxWithoutHandles() {
        return _ModuleSupport.Transformable.toCanvas(
            this,
            _ModuleSupport.Group.computeChildrenBBox(this.excludeChildren({ instance: Handle }))
        );
    }

    protected updateNode<TNode extends _ModuleSupport.Node>(
        constructor: new () => TNode,
        node?: TNode,
        isConfigured?: boolean
    ) {
        if (!isConfigured && node) {
            node.remove();
            return;
        }

        if (isConfigured && node == null) {
            node = new constructor();
            this.appendChild(node);
        }

        return node;
    }
}
