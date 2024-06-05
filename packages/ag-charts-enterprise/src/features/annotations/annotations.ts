import { type Direction, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationPoint } from './annotationProperties';
import type { Coords, Point, StateClickEvent, StateHoverEvent } from './annotationTypes';
import { AnnotationType } from './annotationTypes';
import { validateDatumPoint } from './annotationUtils';
import { CrossLineAnnotation } from './cross-line/crossLineProperties';
import { CrossLine } from './cross-line/crossLineScene';
import { CrossLineStateMachine } from './cross-line/crossLineState';
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
    REGIONS,
} = _ModuleSupport;

type Constructor<T = {}> = new (...args: any[]) => T;

type AnnotationScene = Line | CrossLine | DisjointChannel | ParallelChannel;
type AnnotationProperties =
    | LineAnnotation
    | CrossLineAnnotation
    | ParallelChannelAnnotation
    | DisjointChannelAnnotation;
type AnnotationPropertiesArray = _ModuleSupport.PropertiesArray<AnnotationProperties>;

const annotationDatums: Record<AnnotationType, Constructor<AnnotationProperties>> = {
    [AnnotationType.Line]: LineAnnotation,
    [AnnotationType.CrossLine]: CrossLineAnnotation,
    [AnnotationType.ParallelChannel]: ParallelChannelAnnotation,
    [AnnotationType.DisjointChannel]: DisjointChannelAnnotation,
};

const annotationScenes: Record<AnnotationType, Constructor<AnnotationScene>> = {
    [AnnotationType.Line]: Line,
    [AnnotationType.CrossLine]: CrossLine,
    [AnnotationType.DisjointChannel]: DisjointChannel,
    [AnnotationType.ParallelChannel]: ParallelChannel,
};

class AnnotationsStateMachine extends StateMachine<'idle', AnnotationType | 'click' | 'hover' | 'cancel'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        onEnterIdle: () => void,
        appendDatum: (type: AnnotationType, datum: AnnotationProperties) => void,
        validateChildStateDatumPoint: (point: Point) => boolean
    ) {
        super('idle', {
            idle: {
                onEnter: () => onEnterIdle(),
                [AnnotationType.Line]: new LineStateMachine((datum) => appendDatum(AnnotationType.Line, datum)),
                [AnnotationType.CrossLine]: new CrossLineStateMachine((datum) =>
                    appendDatum(AnnotationType.CrossLine, datum)
                ),
                [AnnotationType.DisjointChannel]: new DisjointChannelStateMachine(
                    (datum) => appendDatum(AnnotationType.DisjointChannel, datum),
                    validateChildStateDatumPoint
                ),
                [AnnotationType.ParallelChannel]: new ParallelChannelStateMachine(
                    (datum) => appendDatum(AnnotationType.ParallelChannel, datum),
                    validateChildStateDatumPoint
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
            () => {
                ctx.cursorManager.updateCursor('annotations');
                ctx.interactionManager.popState(InteractionState.Annotations);
                ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', this.active != null);
                this.toggleAnnotationOptionsButtons();
            },
            this.appendDatum.bind(this),
            this.validateChildStateDatumPoint.bind(this)
        );

        const { All, Default, Annotations: AnnotationsState, ZoomDrag } = InteractionState;

        const seriesRegion = ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);
        this.destroyFns.push(
            ctx.annotationManager.attachNode(this.container),
            horizontalAxesRegion.addListener('click', (event) => this.onAxisClick(event, REGIONS.HORIZONTAL_AXES), All),
            verticalAxesRegion.addListener('click', (event) => this.onAxisClick(event, REGIONS.VERTICAL_AXES), All),
            seriesRegion.addListener('hover', (event) => this.onHover(event, REGIONS.SERIES), All),
            seriesRegion.addListener('click', (event) => this.onClick(event, REGIONS.SERIES), All),
            seriesRegion.addListener('drag', this.onDrag.bind(this), Default | ZoomDrag | AnnotationsState),
            seriesRegion.addListener('drag-end', this.onDragEnd.bind(this), All),
            seriesRegion.addListener('cancel', this.onCancel.bind(this), All),
            seriesRegion.addListener('delete', this.onDelete.bind(this), All),
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
        if (!this.enabled) return;

        this.clear();

        this.annotationData ??= new PropertiesArray(this.createAnnotationDatum);
        this.annotationData.set(event.annotations);

        this.update();
    }

    private onToolbarButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        const {
            state,
            ctx: { interactionManager },
        } = this;

        if (ToolbarManager.isGroup('annotationOptions', event)) {
            this.onToolbarAnnotationOptionButtonPress(event);
            return;
        }

        this.reset();

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

    private onToolbarAnnotationOptionButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('annotationOptions', event)) return;

        const { active, annotationData } = this;

        if (!annotationData || active == null) return;

        switch (event.value) {
            case 'delete':
                annotationData.splice(active, 1);
                this.reset();
                break;

            case 'lock':
                annotationData[active].locked = true;
                this.toggleAnnotationOptionsButtons();
                break;

            case 'unlock':
                annotationData[active].locked = false;
                this.toggleAnnotationOptionsButtons();
                break;
        }

        this.update();
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        this.seriesRect = event.series.rect;

        for (const axis of event.axes ?? []) {
            if (axis.direction === _ModuleSupport.ChartAxisDirection.X) {
                this.scaleX ??= axis.scale;
            } else {
                this.scaleY ??= axis.scale;
            }
        }

        this.updateAxesDomains();
        this.updateAnnotations();
    }

    private updateAnnotations() {
        const {
            active,
            seriesRect,
            annotationData,
            annotations,
            ctx: { annotationManager, toolbarManager },
        } = this;

        if (!seriesRect) {
            return;
        }

        annotationManager.updateData(annotationData?.toJson());

        annotations
            .update(annotationData ?? [], undefined, (datum) => datum.id)
            .each((node, datum, index) => {
                if (!this.validateDatum(datum)) {
                    node.visible = false;
                    return;
                }

                if (LineAnnotation.is(datum) && Line.is(node)) {
                    node.update(datum, seriesRect, this.convertLine(datum));
                }

                if (DisjointChannelAnnotation.is(datum) && DisjointChannel.is(node)) {
                    node.update(datum, seriesRect, this.convertLine(datum), this.convertLine(datum.bottom));
                }

                if (CrossLineAnnotation.is(datum) && CrossLine.is(node)) {
                    node.update(datum, seriesRect, this.convertCrossLine(datum));
                }

                if (ParallelChannelAnnotation.is(datum) && ParallelChannel.is(node)) {
                    node.update(datum, seriesRect, this.convertLine(datum), this.convertLine(datum.bottom));
                }

                if (active === index) {
                    toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
                }
            });
    }

    private updateAxesDomains() {
        this.domainX = this.scaleX?.getDomain?.();
        this.domainY = this.scaleY?.getDomain?.();
    }

    // Validation of the options beyond the scope of the @Validate decorator
    private validateDatum(datum: AnnotationProperties) {
        return datum.isValidWithContext(this.getValidationContext(), `Annotation [${datum.type}] `);
    }

    private validateChildStateDatumPoint(point: Point) {
        const valid = validateDatumPoint(this.getValidationContext(), point);
        if (!valid) {
            this.ctx.cursorManager.updateCursor('annotations', Cursor.NotAllowed);
        }
        return valid;
    }

    private getValidationContext() {
        const { domainX, domainY, scaleX, scaleY } = this;
        return { domainX, domainY, scaleX, scaleY };
    }

    private onHover(event: _ModuleSupport.PointerInteractionEvent<'hover'>, region: _ModuleSupport.RegionName) {
        if (this.state.is('idle')) {
            this.onHoverSelecting(event);
        } else {
            this.onHoverAdding(event, region);
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
            const contains = annotation.containsPoint(event.offsetX, event.offsetY);
            if (contains) this.hovered ??= index;
            annotation.toggleHandles(contains || active === index);
        });

        cursorManager.updateCursor(
            'annotations',
            this.hovered == null ? undefined : annotations.nodes()[this.hovered].getCursor()
        );
    }

    private onHoverAdding(event: _ModuleSupport.PointerInteractionEvent<'hover'>, region?: _ModuleSupport.RegionName) {
        const {
            annotationData,
            annotations,
            ctx: { cursorManager },
        } = this;

        if (!annotationData) return;

        const offset = {
            x: event.offsetX - (this.seriesRect?.x ?? 0),
            y: event.offsetY - (this.seriesRect?.y ?? 0),
        };
        const point = this.invertPoint(offset);

        const valid = validateDatumPoint(this.getValidationContext(), point);
        cursorManager.updateCursor('annotations', valid ? undefined : Cursor.NotAllowed);

        if (!valid || this.state.is('start')) return;

        const datum = annotationData.at(-1);
        this.active = annotationData.length - 1;
        const node = annotations.nodes()[this.active];

        if (!datum || !node) return;

        node.toggleActive(true);

        const data: StateHoverEvent<AnnotationProperties, Annotation> = { datum, node, point, region };
        this.state.transition('hover', data);

        this.update();
    }

    private onClick(event: _ModuleSupport.PointerInteractionEvent<'click'>, region: _ModuleSupport.RegionName) {
        if (this.state.is('idle')) {
            this.onClickSelecting();
        } else {
            this.onClickAdding(event, region);
        }
    }

    private onAxisClick(event: _ModuleSupport.PointerInteractionEvent<'click'>, region: _ModuleSupport.RegionName) {
        this.onAxisClickAdding(event, region);
    }

    private onAxisClickAdding(
        event: _ModuleSupport.PointerInteractionEvent<'click'>,
        region: _ModuleSupport.RegionName
    ) {
        if (!this.annotationData) return;

        this.ctx.interactionManager.pushState(InteractionState.Annotations);
        this.state.transition(AnnotationType.CrossLine);

        this.onClickAdding(event, region);
    }

    private onClickSelecting() {
        const {
            annotations,
            hovered,
            ctx: { toolbarManager },
        } = this;

        if (this.active != null) {
            annotations.nodes()[this.active].toggleActive(false);
        }

        this.active = hovered;
        toolbarManager.toggleGroup('annotations', 'annotationOptions', this.active != null);

        if (this.active == null) {
            this.ctx.tooltipManager.unsuppressTooltip('annotations');
        } else {
            const node = annotations.nodes()[this.active];
            node.toggleActive(true);
            this.ctx.tooltipManager.suppressTooltip('annotations');
            this.toggleAnnotationOptionsButtons();
        }

        this.update();
    }

    private onClickAdding(event: _ModuleSupport.PointerInteractionEvent<'click'>, region: _ModuleSupport.RegionName) {
        const {
            active,
            annotationData,
            annotations,
            ctx: { toolbarManager },
        } = this;

        toolbarManager.toggleGroup('annotations', 'annotationOptions', false);

        if (!annotationData) return;

        const datum = this.annotationData?.at(-1);
        const offset = {
            x: event.offsetX - (this.seriesRect?.x ?? 0),
            y: event.offsetY - (this.seriesRect?.y ?? 0),
        };
        const point = this.invertPoint(offset);

        const node = active != null ? annotations.nodes()[active] : undefined;

        if (!validateDatumPoint(this.getValidationContext(), point)) {
            return;
        }

        const data: StateClickEvent<AnnotationProperties, Annotation> = { datum, node, point, region };
        this.state.transition('click', data);

        this.update();
    }

    private onDrag(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        const {
            active,
            annotationData,
            annotations,
            hovered,
            seriesRect,
            ctx: { cursorManager, interactionManager },
        } = this;

        if (hovered == null || annotationData == null || !this.state.is('idle')) return;

        const index = active ?? hovered;

        if (active == null) {
            this.onClickSelecting();
        }

        interactionManager.pushState(InteractionState.Annotations);

        const { offsetX, offsetY } = event;
        const datum = annotationData[index];
        const node = annotations.nodes()[index];
        const offset = {
            x: offsetX - (seriesRect?.x ?? 0),
            y: offsetY - (seriesRect?.y ?? 0),
        };

        cursorManager.updateCursor('annotations');

        if (LineAnnotation.is(datum) && Line.is(node)) {
            node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        }

        if (CrossLineAnnotation.is(datum) && CrossLine.is(node)) {
            node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        }

        if (DisjointChannelAnnotation.is(datum) && DisjointChannel.is(node)) {
            node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        }

        if (ParallelChannelAnnotation.is(datum) && ParallelChannel.is(node)) {
            node.dragHandle(datum, offset, this.onDragNodeHandle.bind(this));
        }

        this.update();
    }

    private onDragNodeHandle(handleOffset: Coords) {
        const point = this.invertPoint(handleOffset);
        const valid = validateDatumPoint(this.getValidationContext(), point);
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
            ctx: { cursorManager, interactionManager },
        } = this;

        if (!this.state.is('idle')) return;

        interactionManager.popState(InteractionState.Annotations);
        cursorManager.updateCursor('annotations');

        if (active == null) return;

        annotations.nodes()[active].stopDragging();
        this.update();
    }

    private onCancel() {
        const { active, annotationData, state } = this;

        if (!state.is('idle')) {
            state.transition('cancel');

            // Delete active annotation if it is in the process of being created
            if (active != null && annotationData) {
                annotationData.splice(active, 1);
            }
        }

        this.reset();
        this.update();
    }

    private onDelete() {
        const { active, annotationData, state } = this;

        if (active == null || !annotationData) return;

        if (!state.is('idle')) {
            state.transition('cancel');
        }

        annotationData.splice(active, 1);

        this.reset();
        this.update();
    }

    private toggleAnnotationOptionsButtons() {
        const {
            active,
            annotationData,
            ctx: { toolbarManager },
        } = this;

        if (active == null || !annotationData) return;

        const locked = annotationData?.at(active)?.locked ?? false;
        toolbarManager.toggleButton('annotationOptions', 'delete', { visible: !locked });
        toolbarManager.toggleButton('annotationOptions', 'lock', { visible: !locked });
        toolbarManager.toggleButton('annotationOptions', 'unlock', { visible: locked });
    }

    private clear() {
        this.annotations.clear();
        this.reset();
    }

    private reset() {
        if (this.active != null) {
            this.annotations.nodes().at(this.active)?.toggleActive(false);
        }
        this.hovered = undefined;
        this.active = undefined;
        this.ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', false);
    }

    private update() {
        this.ctx.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
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

    private convertCrossLine(datum: { value?: string | number | Date; direction: Direction }) {
        if (datum.value == null) return;

        const { scaleX, scaleY } = this;

        if (!scaleX || !scaleY) return;

        let x1 = 0;
        let x2 = 0;
        let y1 = 0;
        let y2 = 0;

        if (datum.direction === 'vertical') {
            const scaledValue = scaleX.convert(datum.value);
            const yDomain = scaleY.getDomain?.() ?? [0, 0];
            x1 = scaledValue;
            x2 = scaledValue;
            y1 = scaleY.convert(yDomain[0]);
            y2 = scaleY.convert(yDomain.at(-1));
        } else {
            const scaledValue = scaleY.convert(datum.value);
            const xDomain = scaleX.getDomain?.() ?? [0, 0];
            x1 = scaleX.convert(xDomain[0]);
            x2 = scaleX.convert(xDomain.at(-1));
            y1 = scaledValue;
            y2 = scaledValue;
        }

        return { x1, y1, x2, y2 };
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
