import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import {
    AnnotationLinePointsProperties,
    AnnotationPointProperties,
    AnnotationProperties,
} from './annotationProperties';
import type { Coords } from './annotationTypes';
import { AnnotationType } from './annotationTypes';
import type { Annotation } from './scenes/annotation';
import { Channel } from './scenes/channel';
import { Line } from './scenes/line';

const { BOOLEAN, OBJECT_ARRAY, InteractionState, PropertiesArray, Validate } = _ModuleSupport;

enum AddingStep {
    Start = 'start',
    End = 'end',
    Height = 'height',
}

type ClickAddingFn = (node: Annotation | undefined, point: Coords, offset: Coords) => void;
type HoverAddingFn = (datum: AnnotationProperties, node: Annotation, point: Coords, offset: Coords) => void;

export class Annotations extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @_ModuleSupport.ObserveChanges<Annotations>((target, enabled) => {
        target.ctx.toolbarManager.toggleGroup('annotations', Boolean(enabled));
    })
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    @_ModuleSupport.ObserveChanges<Annotations>((target, newValue) => {
        target.annotationData ??= newValue;
    })
    @Validate(OBJECT_ARRAY, { optional: true })
    public initial = new PropertiesArray(AnnotationProperties);

    // State
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

    private addingType?: AnnotationType;
    private addingStep?: AddingStep;

    private seriesRect?: _Scene.BBox;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const { All, Default, Annotations: AnnotationsState, ZoomDrag } = InteractionState;

        const region = ctx.regionManager.getRegion('series');
        this.destroyFns.push(
            ctx.annotationManager.attachNode(this.container),
            region.addListener('hover', this.onHover.bind(this), All),
            region.addListener('click', this.onClick.bind(this), All),
            region.addListener('drag', this.onDrag.bind(this), Default | ZoomDrag | AnnotationsState),
            region.addListener('drag-end', this.onDragEnd.bind(this), All),
            ctx.toolbarManager.addListener('button-pressed', (event) => this.onToolbarButtonPress(event)),
            ctx.layoutService.addListener('layout-complete', this.onLayoutComplete.bind(this))
        );
    }

    private onToolbarButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (this.active != null) {
            this.annotations.nodes()[this.active].toggleActive(false);
            this.active = undefined;
        }

        if (event.group !== 'annotations' || !Object.values(AnnotationType).includes(event.value)) return;

        this.ctx.interactionManager.pushState(InteractionState.Annotations);

        this.addingStep = AddingStep.Start;
        this.addingType = event.value;
    }

    private createAnnotation(datum: AnnotationProperties) {
        switch (datum.type) {
            case AnnotationType.ParallelChannel:
                return new Channel();

            case AnnotationType.Line:
            default:
                return new Line();
        }
    }

    private createDatum(type: AnnotationType, point: Coords) {
        const datum = new AnnotationProperties();
        datum.set(_ModuleSupport.mergeDefaults({ type }, this.ctx.annotationManager.getAnnotationTypeStyles(type)));

        switch (type) {
            case AnnotationType.Line:
                datum.set({ start: point, end: point });
                break;

            case AnnotationType.ParallelChannel:
                datum.set({
                    top: { start: point, end: point },
                    bottom: { start: point, end: point },
                });
                break;
        }

        return datum;
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

    private validateDatumPoint(
        point: { x?: number | string | Date; y?: number | string | Date },
        loggerPrefix?: string
    ) {
        const { domainX, domainY, scaleX, scaleY } = this;

        if (point.x == null || point.y == null) {
            if (loggerPrefix) {
                _Util.Logger.warnOnce(`${loggerPrefix} requires both an [x] and [y] property, ignoring.`);
            }
            return false;
        }

        if (!domainX || !domainY || !scaleX || !scaleY) return true;

        const validX = this.validateDatumPointDirection(domainX, scaleX, point.x);
        const validY = this.validateDatumPointDirection(domainY, scaleY, point.y);

        if (!validX || !validY) {
            let text = 'x & y domains';
            if (validX) text = 'y domain';
            if (validY) text = 'x domain';
            if (loggerPrefix) {
                _Util.Logger.warnOnce(
                    `${loggerPrefix} is outside the ${text}, ignoring. - x: [${point.x}], y: ${point.y}]`
                );
            }
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

    private onHover(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        const { addingStep } = this;

        if (addingStep == null) {
            this.onHoverSelecting(event);
        } else {
            this.onHoverEditing(event);
        }
    }

    private onHoverSelecting(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
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

    private onHoverEditing(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        const {
            annotationData,
            annotations,
            addingStep,
            addingType,
            ctx: { cursorManager, updateService },
        } = this;

        if (!annotationData || !addingType || !addingStep) return;

        const offset = {
            x: event.offsetX - (this.seriesRect?.x ?? 0),
            y: event.offsetY - (this.seriesRect?.y ?? 0),
        };
        const point = this.invertPoint(offset);

        const valid = this.validateDatumPoint(point);
        cursorManager.updateCursor('annotations', valid ? undefined : 'not-allowed');

        if (!valid || addingStep === AddingStep.Start) return;

        const datum = annotationData.at(-1);
        this.active = annotationData.length - 1;
        const node = annotations.nodes()[this.active];

        if (!datum || !node) return;

        node.toggleActive(true);

        const hoverAddingFn = this.hoverAddingFns[addingType]?.[addingStep];
        if (hoverAddingFn) {
            hoverAddingFn(datum, node, point, offset);
        }

        updateService.update();
    }

    private hoverAddingFns: Partial<Record<AnnotationType, Partial<Record<AddingStep, HoverAddingFn>>>> = {
        [AnnotationType.Line]: {
            [AddingStep.End]: (datum, node, point) => {
                datum.set({ end: point });
                node.toggleHandles({ end: false });
            },
        },
        [AnnotationType.ParallelChannel]: {
            [AddingStep.End]: (datum, node, point) => {
                datum.set({ top: { end: point }, bottom: { end: point } });
                node.toggleHandles(false);
            },
            [AddingStep.Height]: (datum, node, point, offset) => {
                const start = this.convertPoint(datum.bottom.start);
                const end = this.convertPoint(datum.bottom.end);

                if (!start || !end) return;

                const height = offset.y - end.y;
                const startY = this.invertY(start.y + height);
                const endY = point.y;

                if (
                    !this.validateDatumPoint({ x: start.x, y: startY }) ||
                    !this.validateDatumPoint({ x: end.x, y: endY })
                ) {
                    return;
                }

                node.toggleHandles({ topMiddle: false, bottomMiddle: false });
                datum.set({
                    bottom: { start: { y: startY }, end: { y: endY } },
                });
            },
        },
    };

    private onClick(event: _ModuleSupport.PointerInteractionEvent<'click'>) {
        if (this.addingStep == null) {
            this.onClickSelecting();
        } else {
            this.onClickAdding(event);
        }
    }

    private onClickSelecting() {
        if (this.active != null) {
            this.annotations.nodes()[this.active].toggleActive(false);
        }

        this.active = this.hovered;

        if (this.active == null) return;

        this.annotations.nodes()[this.active].toggleActive(true);
    }

    private onClickAdding(event: _ModuleSupport.PointerInteractionEvent<'click'>) {
        const {
            active,
            annotationData,
            annotations,
            addingStep,
            addingType,
            ctx: { updateService },
        } = this;
        if (!annotationData || !addingStep || !addingType) return;

        const offset = {
            x: event.offsetX - (this.seriesRect?.x ?? 0),
            y: event.offsetY - (this.seriesRect?.y ?? 0),
        };
        const point = this.invertPoint(offset);
        const node = active ? annotations.nodes()[active] : undefined;

        if (!this.validateDatumPoint(point)) {
            return;
        }

        const clickAddingFn = this.clickAddingFns[addingType]?.[addingStep];
        if (clickAddingFn) {
            clickAddingFn(node, point, offset);
        }

        updateService.update(_ModuleSupport.ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private clickAddingFns: Partial<Record<AnnotationType, Partial<Record<AddingStep, ClickAddingFn>>>> = {
        [AnnotationType.Line]: {
            [AddingStep.Start]: (_node, point) => {
                const datum = this.createDatum(AnnotationType.Line, point);
                this.annotationData?.push(datum);
                this.addingStep = AddingStep.End;
            },
            [AddingStep.End]: (node, point) => {
                this.annotationData?.at(-1)?.set({ end: point });
                node?.toggleHandles(true);
                this.addingStep = undefined;
                this.ctx.cursorManager.updateCursor('annotations');
                this.ctx.interactionManager.popState(InteractionState.Annotations);
            },
        },
        [AnnotationType.ParallelChannel]: {
            [AddingStep.Start]: (_node, point) => {
                const datum = this.createDatum(AnnotationType.ParallelChannel, point);
                this.annotationData?.push(datum);
                this.addingStep = AddingStep.End;
            },
            [AddingStep.End]: (node, point) => {
                this.annotationData?.at(-1)?.set({
                    top: { end: point },
                    bottom: { end: point },
                });
                node?.toggleHandles({ topMiddle: false, bottomMiddle: false });
                this.addingStep = AddingStep.Height;
            },
            [AddingStep.Height]: (node, point, offset) => {
                // TODO: rationalise with the hoverAddingFn which is very similar
                const datum = this.annotationData?.at(-1)!;
                const start = this.convertPoint(datum.bottom.start);
                const end = this.convertPoint(datum.bottom.end);

                if (!start || !end) return;

                const height = offset.y - end.y;
                const startY = this.invertY(start.y + height);
                const endY = point.y;
                if (
                    datum &&
                    this.validateDatumPoint({ x: start.x, y: startY }) &&
                    this.validateDatumPoint({ x: end.x, y: endY })
                ) {
                    datum.set({
                        bottom: { start: { y: startY }, end: { y: endY } },
                    });
                }

                node?.toggleHandles(true);
                this.addingStep = undefined;
                this.ctx.cursorManager.updateCursor('annotations');
                this.ctx.interactionManager.popState(InteractionState.Annotations);
            },
        },
    };

    private onDrag(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        const {
            active,
            annotationData,
            annotations,
            addingStep,
            seriesRect,
            ctx: { cursorManager, interactionManager, updateService },
        } = this;

        if (active == null || annotationData == null || addingStep != null) return;

        interactionManager.pushState(InteractionState.Annotations);

        const { offsetX, offsetY } = event;
        const datum = annotationData[active];
        const node = annotations.nodes()[active];
        const offset = {
            x: offsetX - (seriesRect?.x ?? 0),
            y: offsetY - (seriesRect?.y ?? 0),
        };

        cursorManager.updateCursor('annotations');
        node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        updateService.update(_ModuleSupport.ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onDragNodeHandle(handleOffset: Coords) {
        const point = this.invertPoint(handleOffset);
        const valid = this.validateDatumPoint(point);
        if (!valid) {
            this.ctx.cursorManager.updateCursor('annotations', 'not-allowed');
            return;
        }
        return point;
    }

    private onDragEnd(_event: _ModuleSupport.PointerInteractionEvent<'drag-end'>) {
        const {
            active,
            annotations,
            addingStep,
            ctx: { cursorManager, interactionManager, updateService },
        } = this;

        if (addingStep != null) return;

        interactionManager.popState(InteractionState.Annotations);
        cursorManager.updateCursor('annotations');

        if (active == null) return;

        annotations.nodes()[active].stopDragging();
        updateService.update(_ModuleSupport.ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
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
        return {
            x: this.invertX(point.x),
            y: this.invertY(point.y),
        };
    }

    private invertX(x: number) {
        const { scaleX } = this;

        if (_Scene.ContinuousScale.is(scaleX)) {
            x = scaleX.invert(x);
        } else if (_Scene.BandScale.is(scaleX)) {
            x = scaleX.invertNearest(x);
        }

        return x;
    }

    private invertY(y: number) {
        const { scaleY } = this;

        if (_Scene.ContinuousScale.is(scaleY)) {
            y = scaleY.invert(y);
        } else if (_Scene.BandScale.is(scaleY)) {
            y = scaleY.invertNearest(y);
        }

        return y;
    }
}
