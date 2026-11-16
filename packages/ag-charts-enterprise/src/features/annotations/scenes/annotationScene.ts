import { _ModuleSupport } from 'ag-charts-community';
import { Group, Transformable, ZIndexMap, isObject } from 'ag-charts-core';
import type { Node, Point } from 'ag-charts-core';

import type { SelectionAxesFields, SelectionColours } from '../annotationDatum';
import type { AnnotationContext } from '../annotationTypes';
import { Handle } from './handle';
import { SelectionAxesScene } from './selectionAxesScene';

export abstract class AnnotationScene<D = unknown> extends Group<D> {
    static isCheck(value: unknown, type: string) {
        return isObject(value) && Object.hasOwn(value, 'type') && value.type === type;
    }

    override name = 'AnnotationScene';
    override zIndex = ZIndexMap.CHART_ANNOTATION;

    public abstract type: string;
    public abstract activeHandle?: string;

    private selectionAxes?: SelectionAxesScene;
    private selected = false;
    private axesVisible = true;
    private axesOpacity = 1;

    abstract override containsPoint(x: number, y: number): boolean;

    public abstract toggleHandles(show: boolean | Record<string, boolean>): void;
    public abstract toggleActive(active: boolean): void;
    public abstract stopDragging(): void;
    public abstract getAnchor(): _ModuleSupport.FloatingToolbarAnchor;
    public abstract getCursor(): string | undefined;
    public abstract getNodeAtCoords(x: number, y: number): string | undefined;

    /** A selected annotation shows an axis label per handle, and shading between them, on both axes. */
    public toggleSelected(selected: boolean) {
        this.selected = selected;
        if (!selected) {
            this.selectionAxes?.hide();
        }
    }

    /** The datum is `undefined` for an annotation that has no selection axes, such as a text annotation. */
    public updateSelectionAxes(datum: SelectionAxesFields | undefined, context: AnnotationContext) {
        // Runs for every annotation on every pre-render, so the common unselected case returns first.
        if (!this.selected || !this.visible || !this.axesVisible || datum == null) {
            this.selectionAxes?.hide();
            return;
        }

        if (this.selectionAxes == null) {
            this.selectionAxes = new SelectionAxesScene();
            this.selectionAxes.setOpacity(this.axesOpacity);
        }
        this.selectionAxes.update({
            points: this.getSelectionPoints(datum, context),
            colours: this.getSelectionColours(datum),
            styles: datum,
            seriesRect: context.seriesRect,
            xAxis: context.xAxis,
            yAxis: context.yAxis,
        });
    }

    public setAxisLabelOpacity(opacity: number) {
        this.axesOpacity = opacity;
        this.selectionAxes?.setOpacity(opacity);
    }

    public setAxisLabelVisible(visible: boolean) {
        this.axesVisible = visible;
        if (!visible) {
            this.selectionAxes?.hide();
        }
    }

    public override destroy() {
        super.destroy();
        this.selectionAxes?.destroy();
    }

    /**
     * Where the annotation's points are, relative to the series area, for its axis labels and shading. Defaults to
     * its handles. A scene that snaps its coordinates to whole pixels must override this with the exact points, or
     * its axis labels read the value of the snapped position.
     */
    protected getSelectionPoints(_datum: unknown, _context: AnnotationContext): Point[] {
        const centres: Point[] = [];
        for (const child of this.children()) {
            if (child instanceof Handle) {
                centres.push(child.getCenter());
            }
        }
        return centres;
    }

    /** The annotation's colours, which its axis labels and shading take unless the datum sets their own. */
    protected getSelectionColours(_datum: unknown): SelectionColours {
        return {};
    }

    public toggleHovered(hovered: boolean, active: boolean, readOnly: boolean | undefined) {
        if (readOnly === true) return;
        this.toggleHandles(hovered || active);
    }

    protected computeBBoxWithoutHandles() {
        return Transformable.toCanvas(this, Group.computeChildrenBBox(this.excludeChildren({ instance: Handle })));
    }

    protected updateNode<TNode extends Node>(constructor: new () => TNode, node?: TNode, isConfigured?: boolean) {
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
