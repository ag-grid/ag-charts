import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import {
    AnnotationLinePointsProperties,
    AnnotationPointProperties,
    AnnotationProperties,
} from './annotationProperties';
import { AnnotationType, type Coords } from './annotationTypes';
import { Channel } from './scenes/channel';
import { Line } from './scenes/line';

const { OBJECT_ARRAY, PropertiesArray, Validate } = _ModuleSupport;

export class Annotations extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    public enabled?: boolean = false;

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
            case AnnotationType.ParallelChannel:
                return new Channel();

            case AnnotationType.Line:
            default:
                return new Line();
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
            if (!this.validateDatum(datum)) {
                return;
            }

            switch (datum.type) {
                case AnnotationType.Line:
                    (node as Line).update(datum, event.series.rect, this.convertLine(datum));
                    break;

                case AnnotationType.ParallelChannel:
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

    // Validation of the options beyond the scope of the @Validate decorator
    private validateDatum(datum: AnnotationProperties) {
        let valid = true;

        switch (datum.type) {
            case AnnotationType.Line:
                valid = this.validateDatumLine(datum, `Annotation [${datum.type}]`);
                break;

            case AnnotationType.ParallelChannel:
                valid = this.validateDatumLine(datum.top, `Annotation [${datum.type}] [top]`);
                valid &&= this.validateDatumLine(datum.bottom, `Annotation [${datum.type}] [bottom]`);
                break;
        }

        return valid;
    }

    private validateDatumLine(datum: AnnotationProperties | AnnotationLinePointsProperties, prefix: string) {
        let valid = true;

        if (datum.start == null || datum.end == null) {
            _Util.Logger.warnOnce(`${prefix} requires both a [start] and [end] property, ignoring.`);
            valid = false;
        } else {
            valid &&= this.validateDatumPoint(datum.start, `${prefix} [start]`);
            valid &&= this.validateDatumPoint(datum.end, `${prefix} [end]`);
        }

        return valid;
    }

    private validateDatumPoint(point: AnnotationPointProperties, prefix: string) {
        const { domainX, domainY, scaleX, scaleY } = this;

        if (point.x == null || point.y == null) {
            _Util.Logger.warnOnce(`${prefix} requires both an [x] and [y] property, ignoring.`);
            return false;
        }

        if (!domainX || !domainY || !scaleX || !scaleY) return true;

        const validX = this.validateDatumPointDirection(domainX, scaleX, point.x);
        const validY = this.validateDatumPointDirection(domainY, scaleY, point.y);

        if (!validX || !validY) {
            let text = 'x & y domains';
            if (validX) text = 'y domain';
            if (validY) text = 'x domain';
            _Util.Logger.warnOnce(`${prefix} is outside the ${text}, ignoring. - x: [${point.x}], y: ${point.y}]`);
            return false;
        }

        return true;
    }

    private validateDatumPointDirection(domain: any[], scale: _Scene.Scale<any, any>, value: any) {
        if (_Scene.ContinuousScale.is(scale)) {
            return value >= domain[0] && value <= domain[1];
        }
        return true; // domain.includes(value); // TODO: does not work with dates
    }

    private onHover(event: _ModuleSupport.InteractionEvent<'hover'>) {
        const {
            active,
            annotations,
            ctx: { cursorManager },
        } = this;

        this.hovered = undefined;

        annotations.each((annotation, _, index) => {
            if (annotation.locked) return;
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
        if (this.active != null) {
            this.annotations.nodes()[this.active].toggleActive(false);
        }

        this.active = this.hovered;

        if (this.active == null) return;

        this.annotations.nodes()[this.active].toggleActive(true);
    }

    private onDrag(event: _ModuleSupport.InteractionEvent<'drag'>) {
        const {
            active,
            annotationData,
            annotations,
            seriesRect,
            ctx: { updateService },
        } = this;

        if (active == null || annotationData == null) return;

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
        const { active, annotations } = this;
        if (active != null) {
            annotations.nodes()[active].stopDragging();
        }
    }

    private convertLine(datum: AnnotationProperties | AnnotationLinePointsProperties) {
        if (datum.start == null || datum.end == null) return;

        const start = this.convertPoint(datum.start);
        const end = this.convertPoint(datum.end);

        if (start == null || end == null) return;

        return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    }

    private convertPoint(point: AnnotationPointProperties) {
        const { scaleX, scaleY } = this;

        let x = 0;
        let y = 0;

        if (!scaleX || !scaleY || point.x == null || point.y == null) return { x, y };

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
