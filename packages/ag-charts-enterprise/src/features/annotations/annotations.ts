import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationPoint } from './annotationProperties';
import type { Coords, Point, StateClickEvent, StateHoverEvent } from './annotationTypes';
import { AnnotationType } from './annotationTypes';
import { DisjointChannelAnnotation } from './disjoint-channel/disjointChannelProperties';
import { DisjointChannel } from './disjoint-channel/disjointChannelScene';
import { DisjointChannelStateMachine } from './disjoint-channel/disjointChannelState';
import { LineAnnotation } from './line/lineProperties';
import { Line } from './line/lineScene';
import { LineStateMachine } from './line/lineState';
import { ParallelChannelAnnotation } from './parallel-channel/parallelChannelProperties';
import { ParallelChannel } from './parallel-channel/parallelChannelScene';
import { ParallelChannelStateMachine } from './parallel-channel/parallelChannelState';
import type { Annotation } from './scenes/annotation';

const {
    BOOLEAN,
    OBJECT_ARRAY,
    ChartUpdateType,
    Cursor,
    InteractionState,
    PropertiesArray,
    StateMachine,
    ToolbarManager,
    Validate,
} = _ModuleSupport;

type Constructor<T = {}> = new (...args: any[]) => T;

type AnnotationScene = Line | DisjointChannel | ParallelChannel;
type AnnotationProperties = LineAnnotation | ParallelChannelAnnotation | DisjointChannelAnnotation;
type AnnotationPropertiesArray = _ModuleSupport.PropertiesArray<AnnotationProperties>;

const annotationDatums: Record<AnnotationType, Constructor<AnnotationProperties>> = {
    [AnnotationType.Line]: LineAnnotation,
    [AnnotationType.ParallelChannel]: ParallelChannelAnnotation,
    [AnnotationType.DisjointChannel]: DisjointChannelAnnotation,
};

const annotationScenes: Record<AnnotationType, Constructor<AnnotationScene>> = {
    [AnnotationType.Line]: Line,
    [AnnotationType.DisjointChannel]: DisjointChannel,
    [AnnotationType.ParallelChannel]: ParallelChannel,
};

class AnnotationsStateMachine extends StateMachine<'idle', AnnotationType | 'click' | 'hover'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        ctx: _ModuleSupport.ModuleContext,
        hasActiveAnnotation: () => boolean,
        appendDatum: (type: AnnotationType, datum: AnnotationProperties) => void,
        validateDatumPoint: (point: Point) => boolean
    ) {
        super('idle', {
            idle: {
                onEnter: () => {
                    ctx.cursorManager.updateCursor('annotations');
                    ctx.interactionManager.popState(InteractionState.Annotations);
                    ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', hasActiveAnnotation());
                },
                [AnnotationType.Line]: new LineStateMachine((datum) => appendDatum(AnnotationType.Line, datum)),
                [AnnotationType.DisjointChannel]: new DisjointChannelStateMachine(
                    (datum) => appendDatum(AnnotationType.DisjointChannel, datum),
                    validateDatumPoint
                ),
                [AnnotationType.ParallelChannel]: new ParallelChannelStateMachine(
                    (datum) => appendDatum(AnnotationType.ParallelChannel, datum),
                    validateDatumPoint
                ),
            },
        });
    }
}

export class Annotations extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @_ModuleSupport.ObserveChanges<Annotations>((target, enabled) => {
        target.ctx.toolbarManager.toggleGroup('annotations', 'annotations', Boolean(enabled));
    })
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    @_ModuleSupport.ObserveChanges<Annotations>((target, initial: AnnotationPropertiesArray) => {
        target.annotationData ??= initial;
    })
    @Validate(OBJECT_ARRAY, { optional: true })
    public initial = new PropertiesArray(this.createAnnotationDatum);

    // State
    private readonly state: AnnotationsStateMachine;
    private annotationData?: AnnotationPropertiesArray;
    private hovered?: number;
    private active?: number;

    // Elements
    private seriesRect?: _Scene.BBox;
    private readonly container = new _Scene.Group({ name: 'static-annotations' });
    private readonly annotations = new _Scene.Selection<AnnotationScene, AnnotationProperties>(
        this.container,
        this.createAnnotationScene.bind(this)
    );

    // Cached axis data
    private scaleX?: _Scene.Scale<any, number, number | _Util.TimeInterval>;
    private scaleY?: _Scene.Scale<any, number, number | _Util.TimeInterval>;
    private domainX?: any[];
    private domainY?: any[];

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.state = new AnnotationsStateMachine(
            ctx,
            () => this.active != null,
            this.appendDatum.bind(this),
            this.validateChildStateDatumPoint.bind(this)
        );

        const { All, Default, Annotations: AnnotationsState, ZoomDrag } = InteractionState;

        const region = ctx.regionManager.getRegion('series');
        this.destroyFns.push(
            ctx.annotationManager.attachNode(this.container),
            region.addListener('hover', this.onHover.bind(this), All),
            region.addListener('click', this.onClick.bind(this), All),
            region.addListener('drag', this.onDrag.bind(this), Default | ZoomDrag | AnnotationsState),
            region.addListener('drag-end', this.onDragEnd.bind(this), All),
            ctx.annotationManager.addListener('restore-annotations', this.onRestoreAnnotations.bind(this)),
            ctx.toolbarManager.addListener('button-pressed', this.onToolbarButtonPress.bind(this)),
            ctx.layoutService.addListener('layout-complete', this.onLayoutComplete.bind(this))
        );
    }

    private createAnnotationScene(datum: AnnotationProperties) {
        return new annotationScenes[datum.type]();
    }

    private createAnnotationDatum(params: { type: AnnotationType }) {
        if (params.type in annotationDatums) {
            return new annotationDatums[params.type]().set(params);
        }
        throw new Error(
            `AG Charts - Cannot set property of unknown type [${params.type}], expected one of [${Object.keys(annotationDatums)}], ignoring.`
        );
    }

    private appendDatum(type: AnnotationType, datum: AnnotationProperties) {
        this.annotationData?.push(datum);
        const styles = this.ctx.annotationManager.getAnnotationTypeStyles(type);
        if (styles) datum.set(styles);
    }

    private onRestoreAnnotations(event: { annotations?: any }) {
        this.clear();

        this.annotationData ??= new PropertiesArray(this.createAnnotationDatum);
        this.annotationData.set(event.annotations);

        this.ctx.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onToolbarButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        const {
            active,
            annotations,
            annotationData,
            state,
            ctx: { interactionManager, toolbarManager, updateService },
        } = this;

        if (
            ToolbarManager.isGroup('annotationOptions', event) &&
            event.value === 'delete' &&
            active != null &&
            annotationData != null
        ) {
            annotationData.splice(active, 1);
            this.hovered = undefined;
            this.active = undefined;

            toolbarManager.toggleGroup('annotations', 'annotationOptions', false);
            updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
            return;
        }

        if (active != null) {
            annotations.nodes()[active].toggleActive(false);
            this.active = undefined;
            this.hovered = undefined;
        }

        if (!ToolbarManager.isGroup('annotations', event)) {
            return;
        }

        const annotation = this.stringToAnnotationType(event.value);
        if (!annotation) {
            _Util.Logger.errorOnce(`Can not create unknown annotation type [${event.value}], ignoring.`);
            return;
        }

        interactionManager.pushState(InteractionState.Annotations);
        state.transition(annotation);
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const {
            active,
            annotationData,
            annotations,
            ctx: { annotationManager },
        } = this;

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

        annotationManager.updateData(annotationData?.toJson());

        annotations
            .update(annotationData ?? [], undefined, (datum) => datum.id)
            .each((node, datum, index) => {
                if (!this.validateDatum(datum)) {
                    return;
                }

                if (LineAnnotation.is(datum) && Line.is(node)) {
                    node.update(datum, event.series.rect, this.convertLine(datum));
                }

                if (DisjointChannelAnnotation.is(datum) && DisjointChannel.is(node)) {
                    node.update(datum, event.series.rect, this.convertLine(datum), this.convertLine(datum.bottom));
                }

                if (ParallelChannelAnnotation.is(datum) && ParallelChannel.is(node)) {
                    node.update(datum, event.series.rect, this.convertLine(datum), this.convertLine(datum.bottom));
                }

                if (active === index) {
                    this.ctx.toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
                }
            });
    }

    // Validation of the options beyond the scope of the @Validate decorator
    private validateDatum(datum: AnnotationProperties) {
        let valid = true;

        switch (datum.type) {
            case AnnotationType.Line:
            case AnnotationType.DisjointChannel:
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

    private validateDatumPoint(point: Point, loggerPrefix?: string) {
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

    private validateDatumPointDirection(
        domain: any[],
        scale: _Scene.Scale<any, any, number | _Util.TimeInterval>,
        value: any
    ) {
        if (_Scene.ContinuousScale.is(scale)) {
            return value >= domain[0] && value <= domain[1];
        }
        return true; // domain.includes(value); // TODO: does not work with dates
    }

    private validateChildStateDatumPoint(point: Point) {
        const valid = this.validateDatumPoint(point);
        if (!valid) {
            this.ctx.cursorManager.updateCursor('annotations', Cursor.NotAllowed);
        }
        return valid;
    }

    private onHover(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        if (this.state.is('idle')) {
            this.onHoverSelecting(event);
        } else {
            this.onHoverAdding(event);
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

    private onHoverAdding(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        const {
            annotationData,
            annotations,
            ctx: { cursorManager, updateService },
        } = this;

        if (!annotationData) return;

        const offset = {
            x: event.offsetX - (this.seriesRect?.x ?? 0),
            y: event.offsetY - (this.seriesRect?.y ?? 0),
        };
        const point = this.invertPoint(offset);

        const valid = this.validateDatumPoint(point);
        cursorManager.updateCursor('annotations', valid ? undefined : Cursor.NotAllowed);

        if (!valid || this.state.is('start')) return;

        const datum = annotationData.at(-1);
        this.active = annotationData.length - 1;
        const node = annotations.nodes()[this.active];

        if (!datum || !node) return;

        node.toggleActive(true);

        const data: StateHoverEvent<AnnotationProperties, Annotation> = { datum, node, point };
        this.state.transition('hover', data);

        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onClick(event: _ModuleSupport.PointerInteractionEvent<'click'>) {
        if (this.state.is('idle')) {
            this.onClickSelecting();
        } else {
            this.onClickAdding(event);
        }
    }

    private onClickSelecting() {
        const {
            annotations,
            hovered,
            ctx: { toolbarManager, updateService },
        } = this;

        if (this.active != null) {
            annotations.nodes()[this.active].toggleActive(false);
        }

        this.active = hovered;
        toolbarManager.toggleGroup('annotations', 'annotationOptions', this.active != null);

        if (this.active != null) {
            const node = annotations.nodes()[this.active];
            node.toggleActive(true);
            this.ctx.toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
        }

        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onClickAdding(event: _ModuleSupport.PointerInteractionEvent<'click'>) {
        const {
            active,
            annotationData,
            annotations,
            ctx: { toolbarManager, updateService },
        } = this;

        toolbarManager.toggleGroup('annotations', 'annotationOptions', false);

        if (!annotationData) return;

        const datum = this.annotationData?.at(-1);
        const offset = {
            x: event.offsetX - (this.seriesRect?.x ?? 0),
            y: event.offsetY - (this.seriesRect?.y ?? 0),
        };
        const point = this.invertPoint(offset);
        const node = active ? annotations.nodes()[active] : undefined;

        if (!this.validateDatumPoint(point)) {
            return;
        }

        const data: StateClickEvent<AnnotationProperties, Annotation> = { datum, node, point };
        this.state.transition('click', data);

        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onDrag(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        const {
            active,
            annotationData,
            annotations,
            seriesRect,
            ctx: { cursorManager, interactionManager, updateService },
        } = this;

        if (active == null || annotationData == null || !this.state.is('idle')) return;

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

        if (DisjointChannelAnnotation.is(datum) && DisjointChannel.is(node)) {
            node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        }

        if (ParallelChannelAnnotation.is(datum) && ParallelChannel.is(node)) {
            node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        }

        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onDragNodeHandle(handleOffset: Coords) {
        const point = this.invertPoint(handleOffset);
        const valid = this.validateDatumPoint(point);
        if (!valid) {
            this.ctx.cursorManager.updateCursor('annotations', Cursor.NotAllowed);
            return;
        }
        return point;
    }

    private onDragEnd(_event: _ModuleSupport.PointerInteractionEvent<'drag-end'>) {
        const {
            active,
            annotations,
            ctx: { cursorManager, interactionManager, updateService },
        } = this;

        if (!this.state.is('idle')) return;

        interactionManager.popState(InteractionState.Annotations);
        cursorManager.updateCursor('annotations');

        if (active == null) return;

        annotations.nodes()[active].stopDragging();
        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private clear() {
        this.annotations.clear();
        this.hovered = undefined;
        this.active = undefined;
    }

    private stringToAnnotationType(value: string) {
        switch (value) {
            case 'line':
                return AnnotationType.Line;
            case 'disjoint-channel':
                return AnnotationType.DisjointChannel;
            case 'parallel-channel':
                return AnnotationType.ParallelChannel;
        }
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
