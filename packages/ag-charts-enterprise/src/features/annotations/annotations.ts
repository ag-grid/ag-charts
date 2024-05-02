import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import {
    AnnotationPoint,
    type AnnotationProperties,
    DisjointChannelAnnotation,
    LineAnnotation,
    ParallelChannelAnnotation,
} from './annotationProperties';
import type { Coords } from './annotationTypes';
import { AnnotationType } from './annotationTypes';
import type { Annotation } from './scenes/annotation';
import { Channel } from './scenes/channel';
import { Line } from './scenes/line';

const { BOOLEAN, OBJECT_ARRAY, InteractionState, PropertiesArray, Validate, isArray } = _ModuleSupport;

enum AddingStep {
    Start = 'start',
    End = 'end',
    Height = 'height',
}

type Constructor<T = {}> = new (...args: any[]) => T;

const annotationDatums: Record<AnnotationType, Constructor<AnnotationProperties>> = {
    [AnnotationType.Line]: LineAnnotation,
    [AnnotationType.ParallelChannel]: ParallelChannelAnnotation,
    [AnnotationType.DisjointChannel]: DisjointChannelAnnotation,
};

const annotationScenes: Record<AnnotationType, Constructor<Line | Channel>> = {
    [AnnotationType.Line]: Line,
    [AnnotationType.DisjointChannel]: Channel,
    [AnnotationType.ParallelChannel]: Channel,
};

type ClickAddingFn = (node: Annotation | undefined, point: Coords, offset: Coords) => void;
type HoverAddingFn = (datum: AnnotationProperties, node: Annotation, point: Coords, offset: Coords) => void;

class TypedPropertiesArray<T extends _ModuleSupport.BaseProperties> extends PropertiesArray<T> {
    private itemFactories!: { [type: string]: new () => T };

    constructor(itemFactories: { [type: string]: new () => T }, ...properties: object[]) {
        super(itemFactories[Object.keys(itemFactories)[0]], ...properties);
        Object.defineProperty(this, 'itemFactories', { value: itemFactories, enumerable: false, configurable: false });
        this.set(properties);
    }

    override set(properties: object[]): TypedPropertiesArray<T> {
        if (isArray(properties)) {
            this.length = properties.length;
            for (let i = 0; i < properties.length; i++) {
                const factory = this.itemFactories[properties[i].type]; // TODO <<<<====
                this[i] = new factory().set(properties[i]);
            }
        }
        return this;
    }

    override reset(properties: object[]): TypedPropertiesArray<T> {
        return new TypedPropertiesArray(this.itemFactories, ...properties);
    }
}

export class Annotations extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @_ModuleSupport.ObserveChanges<Annotations>((target, enabled) => {
        target.ctx.toolbarManager.toggleGroup('annotations', Boolean(enabled));
    })
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    @_ModuleSupport.ObserveChanges<Annotations>((target, initial: Array<AnnotationProperties>) => {
        target.annotationData ??= initial;
    })
    @Validate(OBJECT_ARRAY, { optional: true })
    // public initial = new PropertiesArray(LineAnnotation);
    public initial = new TypedPropertiesArray(annotationDatums);
    // public initial: Array<AnnotationProperties> = [];

    // State
    private annotationData?: AnnotationProperties[];

    private container = new _Scene.Group({ name: 'static-annotations' });
    private annotations = new _Scene.Selection<Line | Channel, AnnotationProperties>(
        this.container,
        this.createAnnotation.bind(this)
    );

    private scaleX?: _Scene.Scale<any, number>;
    private scaleY?: _Scene.Scale<any, number>;
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
        return new annotationScenes[datum.type]();
    }

    private createDatum(type: AnnotationType, point: Coords) {
        const datum = new annotationDatums[type]();
        datum.set({ start: point, end: point });

        const styles = this.ctx.annotationManager.getAnnotationTypeStyles(type);
        if (styles) datum.set(styles);

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

            if (LineAnnotation.is(datum) && Line.is(node)) {
                node.update(datum, event.series.rect, this.convertLine(datum));
            }

            if (ParallelChannelAnnotation.is(datum) && Channel.is(node)) {
                node.update(datum, event.series.rect, this.convertLine(datum), this.convertLine(datum.bottom));
            }
        });
    }

    // Validation of the options beyond the scope of the @Validate decorator
    private validateDatum(datum: AnnotationProperties) {
        let valid = true;

        switch (datum.type) {
            case AnnotationType.Line:
            case AnnotationType.ParallelChannel:
                valid = this.validateDatumLine(datum, `Annotation [${datum.type}]`);
                break;
        }

        return valid;
    }

    private validateDatumLine(datum: { start: AnnotationPoint; end: AnnotationPoint }, prefix: string) {
        let valid = true;

        valid &&= this.validateDatumPoint(datum.start, `${prefix} [start]`);
        valid &&= this.validateDatumPoint(datum.end, `${prefix} [end]`);

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
            hoverAddingFns,
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

        const hoverAddingFn = hoverAddingFns[addingType]?.[addingStep];
        if (hoverAddingFn) {
            hoverAddingFn(datum, node, point, offset);
        }

        updateService.update();
    }

    // private hoverAddingFns: Partial<Record<AnnotationType, Partial<Record<AddingStep, HoverAddingFn>>>> = {
    private hoverAddingFns = {
        [AnnotationType.Line]: {
            [AddingStep.End]: (datum: LineAnnotation, node: Line, point: Coords) => {
                datum.set({ end: point });
                node.toggleHandles({ end: false });
            },
        },
        [AnnotationType.ParallelChannel]: {
            [AddingStep.End]: (datum: ParallelChannelAnnotation, node: Channel, point: Coords) => {
                datum.set({ end: point, size: 0 });
                node.toggleHandles(false);
            },
            [AddingStep.Height]: (datum: ParallelChannelAnnotation, node: Channel, point: Coords) => {
                if (datum.start.y == null || datum.end.y == null) return;

                const size = datum.end.y - point.y;
                const bottomStartY = datum.start.y - size;

                if (
                    !this.validateDatumPoint({ x: datum.start.y, y: bottomStartY }) ||
                    !this.validateDatumPoint({ x: datum.end.x, y: point.y })
                ) {
                    return;
                }

                node.toggleHandles({ topMiddle: false, bottomMiddle: false });
                datum.set({ size });
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

    // private clickAddingFns: Partial<Record<AnnotationType, Partial<Record<AddingStep, ClickAddingFn>>>> = {
    private clickAddingFns = {
        [AnnotationType.Line]: {
            [AddingStep.Start]: (_node: Line, point: Coords) => {
                const datum = this.createDatum(AnnotationType.Line, point);
                this.annotationData?.push(datum);
                this.addingStep = AddingStep.End;
            },
            [AddingStep.End]: (node: Line, point: Coords) => {
                this.annotationData?.at(-1)?.set({ end: point });
                node?.toggleHandles(true);
                this.addingStep = undefined;
                this.ctx.cursorManager.updateCursor('annotations');
                this.ctx.interactionManager.popState(InteractionState.Annotations);
            },
        },
        [AnnotationType.ParallelChannel]: {
            [AddingStep.Start]: (_node: Channel, point: Coords) => {
                const datum = this.createDatum(AnnotationType.ParallelChannel, point);
                this.annotationData?.push(datum);
                this.addingStep = AddingStep.End;
            },
            [AddingStep.End]: (node: Channel, point: Coords) => {
                this.annotationData?.at(-1)?.set({
                    end: point,
                });
                node?.toggleHandles({ topMiddle: false, bottomMiddle: false });
                this.addingStep = AddingStep.Height;
            },
            [AddingStep.Height]: (node: Channel, point: Coords) => {
                // TODO: rationalise with the hoverAddingFn which is very similar
                const datum = this.annotationData?.at(-1);
                if (
                    (ParallelChannelAnnotation.is(datum) || DisjointChannelAnnotation.is(datum)) &&
                    datum.start.y != null &&
                    datum.end.y != null
                ) {
                    const size = datum.end.y - point.y;
                    const bottomStartY = datum.start.y - size;

                    if (
                        this.validateDatumPoint({ x: datum.start.y, y: bottomStartY }) &&
                        this.validateDatumPoint({ x: datum.end.x, y: point.y })
                    ) {
                        datum.set({ size });
                    }
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

        if (LineAnnotation.is(datum) && Line.is(node)) {
            node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        }

        if (ParallelChannelAnnotation.is(datum) && Channel.is(node)) {
            node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        }

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

    private convertLine(datum: { start: Pick<AnnotationPoint, 'x' | 'y'>; end: Pick<AnnotationPoint, 'x' | 'y'> }) {
        if (datum.start == null || datum.end == null) return;

        const start = this.convertPoint(datum.start);
        const end = this.convertPoint(datum.end);

        if (start == null || end == null) return;

        return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    }

    private convertPoint(point: Pick<AnnotationPoint, 'x' | 'y'>) {
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
