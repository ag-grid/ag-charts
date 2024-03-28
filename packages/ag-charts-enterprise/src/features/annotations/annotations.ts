import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import {
    AnnotationLinePointsProperties,
    AnnotationPointProperties,
    AnnotationProperties,
} from './annotationProperties';
import type { Coords } from './annotationTypes';
import { Channel } from './scenes/channel';
import { Line } from './scenes/line';

const { OBJECT_ARRAY, PropertiesArray, Validate } = _ModuleSupport;

export class Annotations extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    public enableInteractions?: boolean = true;

    @_ModuleSupport.ObserveChanges<Annotations>((target, newValue) => {
        target.annotationData ??= newValue;
    })
    @Validate(OBJECT_ARRAY, { optional: true })
    public initial = new PropertiesArray(AnnotationProperties);

    private annotationData?: AnnotationProperties[];

    private container = new _Scene.Group({ name: 'static-annotations' });
    private annotations = new _Scene.Selection<Line | Channel, AnnotationProperties>(
        this.container,
        this.createAnnotation.bind(this)
    );

    private scaleX?: _Scene.Scale<any, any>;
    private scaleY?: _Scene.Scale<any, any>;
    private domainX?: any[];
    private domainY?: any[];

    private hovered?: number;
    private active?: number;

    private seriesRect?: _Scene.BBox;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.destroyFns.push(
            ctx.annotationManager.attachNode(this.container),
            ctx.interactionManager.addListener('hover', this.onHover.bind(this)),
            ctx.interactionManager.addListener('click', this.onClick.bind(this)),
            ctx.interactionManager.addListener('drag-start', this.onClick.bind(this)),
            // TODO: InteractionState.Annotations?
            ctx.interactionManager.addListener('drag', this.onDrag.bind(this), _ModuleSupport.InteractionState.All),
            ctx.interactionManager.addListener('drag-end', this.onDragEnd.bind(this)),
            ctx.layoutService.addListener('layout-complete', this.onLayoutComplete.bind(this))
        );
    }

    private createAnnotation(note: AnnotationProperties) {
        switch (note.type) {
            case 'line':
            case 'crossline':
                return new Line();

            case 'disjoint-channel':
            case 'parallel-channel':
                return new Channel();
        }
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const { annotationData, annotations } = this;

        this.seriesRect = event.series.rect;

        for (const axis of event.axes ?? []) {
            if (axis.direction === _ModuleSupport.ChartAxisDirection.X) {
                this.scaleX ??= axis.scale;
                this.domainX ??= axis.domain;
            } else {
                this.scaleY ??= axis.scale;
                this.domainY ??= axis.domain;
            }
        }

        annotations.update(annotationData ?? []).each((node, datum) => {
            switch (datum.type) {
                case 'line':
                case 'crossline':
                    (node as Line).update(datum, event.series.rect, this.convertLine(datum));
                    break;

                case 'disjoint-channel':
                case 'parallel-channel':
                    (node as Channel).update(
                        datum,
                        event.series.rect,
                        this.convertLine(datum.top),
                        this.convertLine(datum.bottom)
                    );
                    break;
            }
        });
    }

    private onHover(event: _ModuleSupport.InteractionEvent<'hover'>) {
        const {
            active,
            annotations,
            ctx: { cursorManager },
            enableInteractions,
        } = this;

        if (!enableInteractions) return;

        this.hovered = undefined;

        annotations.each((annotation, _, index) => {
            const contains = annotation.containsPoint(event.offsetX, event.offsetY);
            if (contains) this.hovered ??= index;
            annotation.toggleHandles(contains || active === index);
        });

        cursorManager.updateCursor(
            'annotations',
            this.hovered == null ? undefined : annotations.nodes()[this.hovered].getCursor()
        );
    }

    private onClick(_event: _ModuleSupport.InteractionEvent<'click' | 'drag-start'>) {
        if (!this.enableInteractions) return;

        if (this.active != null) {
            this.annotations.nodes()[this.active].toggleActive(false);
        }

        this.active = this.hovered;

        if (this.active != null) {
            this.annotations.nodes()[this.active].toggleActive(true);
        }
    }

    private onDrag(event: _ModuleSupport.InteractionEvent<'drag'>) {
        const {
            active,
            annotationData,
            annotations,
            seriesRect,
            ctx: { updateService },
            enableInteractions,
        } = this;

        if (!enableInteractions || active == null || annotationData == null) return;

        const { offsetX, offsetY } = event;
        const datum = annotationData[active];
        const node = annotations.nodes()[active];
        const offset = {
            x: offsetX - (seriesRect?.x ?? 0),
            y: offsetY - (seriesRect?.y ?? 0),
        };

        node.dragHandle(datum, offset, this.invertPoint.bind(this));

        updateService.update(_ModuleSupport.ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onDragEnd(_event: _ModuleSupport.InteractionEvent<'drag-end'>) {
        const { active, annotations, enableInteractions } = this;
        if (enableInteractions && active != null) {
            annotations.nodes()[active].stopDragging();
        }
    }

    private convertLine(datum: AnnotationProperties | AnnotationLinePointsProperties) {
        const start = this.convertPoint(datum.start);
        const end = this.convertPoint(datum.end);

        if (start == null || end == null) return;

        return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    }

    private convertPoint(point: AnnotationPointProperties) {
        const { domainX, domainY, scaleX, scaleY } = this;

        let x = 0;
        let y = 0;

        if (!domainX || !domainY || !scaleX || !scaleY) return { x, y };

        let validX = true;
        let validY = true;
        if (_Scene.ContinuousScale.is(scaleX)) {
            validX = point.x >= domainX[0] && point.x <= domainX[1];
        } else {
            validX = true; // domainX.includes(point.x); // TODO: does not work with dates
        }

        if (_Scene.ContinuousScale.is(scaleY)) {
            validY = point.y >= domainY[0] && point.y <= domainY[1];
        } else {
            validY = true; // domainY.includes(point.y); // TODO: does not work with dates
        }

        if (!validX || !validY) {
            let text = 'x & y domains';
            if (validX) text = 'y domain';
            if (validY) text = 'x domain';
            _Util.Logger.warnOnce(`Annotation point is outside the ${text} - x: [${point.x}], y: ${point.y}]`);
            return;
        }

        x = scaleX.convert(point.x);
        y = scaleY.convert(point.y);

        return { x, y };
    }

    private invertPoint(point: Coords) {
        const { scaleX, scaleY } = this;
        let x = 0;
        let y = 0;

        if (_Scene.ContinuousScale.is(scaleX)) {
            x = scaleX.invert(point.x ?? 0);
        } else if (_Scene.BandScale.is(scaleX)) {
            x = scaleX.invertNearest(point.x ?? 0);
        }

        if (_Scene.ContinuousScale.is(scaleY)) {
            y = scaleY.invert(point.y ?? 0);
        } else if (_Scene.BandScale.is(scaleY)) {
            y = scaleY.invertNearest(point.y ?? 0);
        }

        return { x, y };
    }
}
