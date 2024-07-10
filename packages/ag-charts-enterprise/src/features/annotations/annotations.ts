import { type Direction, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { buildBounds } from '../../utils/position';
import { ColorPicker } from '../color-picker/colorPicker';
import { TextInput } from '../text-input/textInput';
import type {
    AnnotationContext,
    Coords,
    Point,
    StateClickEvent,
    StateDragEvent,
    StateHoverEvent,
    StateInputEvent,
} from './annotationTypes';
import { ANNOTATION_BUTTONS, AnnotationType, stringToAnnotationType } from './annotationTypes';
import { calculateAxisLabelPadding, invertCoords, validateDatumPoint } from './annotationUtils';
import {
    type AnnotationProperties,
    annotationDatums,
    annotationScenes,
    dragAnnotation,
    dragStartAnnotation,
    getTypedDatum,
    updateAnnotation,
} from './annotationsConfig';
import { AnnotationsStateMachine } from './annotationsStateMachine';
import { AxisButton, DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS } from './axisButton';
import type { AnnotationScene } from './scenes/annotationScene';
import { TextProperties } from './text/textProperties';

const {
    BOOLEAN,
    ChartUpdateType,
    Cursor,
    InteractionState,
    PropertiesArray,
    ToolbarManager,
    Validate,
    REGIONS,
    UNION,
    ChartAxisDirection,
} = _ModuleSupport;
const { Vec2 } = _Util;

type AnnotationPropertiesArray = _ModuleSupport.PropertiesArray<AnnotationProperties>;

type AnnotationAxis = {
    layout: _ModuleSupport.AxisLayout;
    context: _ModuleSupport.AxisContext;
    bounds: _Scene.BBox;
    button?: AxisButton;
};

const AXIS_TYPE = UNION(['x', 'y', 'xy'], 'an axis type');

class AxesButtons {
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    @Validate(AXIS_TYPE, { optional: true })
    public axes?: 'x' | 'y' | 'xy' = 'y';
}

export class Annotations extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    // TODO: When the 'restore-annotations' event is triggered from `ActionsOnSet.newValue()`, the module is still
    // disabled when `onRestoreAnnotations()` is called, preventing the state from being restored. However,
    // when `ObserveChanges()` is first called `target.enabled === false`, rather than `undefined`. So
    // there is no way to detect if the module was actively disabled. This flag simulates a combined
    // behaviour of both and is toggled when the module is actively disabled and enabled.
    private __hackWasDisabled = false;

    @_ModuleSupport.ObserveChanges<Annotations, boolean>((target, enabled) => {
        const {
            ctx: { annotationManager, stateManager, toolbarManager },
        } = target;

        toolbarManager.toggleGroup('annotations', 'annotations', Boolean(enabled));

        // Restore the annotations only if this module was previously disabled
        if (target.__hackWasDisabled && enabled) {
            stateManager.restoreState(annotationManager);
            target.__hackWasDisabled = false;
        } else if (enabled === false) {
            target.__hackWasDisabled = true;
            target.clear();
        }
    })
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    public axesButtons = new AxesButtons();

    // State
    private readonly state: AnnotationsStateMachine;
    private readonly annotationData: AnnotationPropertiesArray = new PropertiesArray(this.createAnnotationDatum);
    private hovered?: number;
    private active?: number;
    private dragOffset?: Coords;

    // Elements
    private seriesRect?: _Scene.BBox;
    private readonly container = new _Scene.Group({ name: 'static-annotations' });
    private readonly annotations = new _Scene.Selection<AnnotationScene, AnnotationProperties>(
        this.container,
        this.createAnnotationScene.bind(this)
    );

    private readonly colorPicker = new ColorPicker(this.ctx);
    private defaultColor?: string;

    private readonly textInput = new TextInput(this.ctx);

    private xAxis?: AnnotationAxis;
    private yAxis?: AnnotationAxis;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        this.state = this.setupStateMachine();
        this.setupListeners();
    }

    private setupStateMachine() {
        const { ctx } = this;

        const onEnterIdle = () => {
            ctx.cursorManager.updateCursor('annotations');
            ctx.interactionManager.popState(InteractionState.Annotations);
            ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', this.active != null);
            ctx.tooltipManager.unsuppressTooltip('annotations');
            for (const annotationType of ANNOTATION_BUTTONS) {
                ctx.toolbarManager.toggleButton('annotations', annotationType, { active: false });
            }
            this.toggleAnnotationOptionsButtons();
        };

        const onExitSingleClick = () => {
            this.active = this.annotationData.length - 1;
        };

        return new AnnotationsStateMachine(
            onEnterIdle,
            this.appendDatum.bind(this),
            onExitSingleClick,
            this.validateChildStateDatumPoint.bind(this),
            () => {
                if (this.active == null) return;

                const datum = getTypedDatum(this.annotationData[this.active]);
                if (!TextProperties.is(datum)) return;

                const styles = {
                    color: datum.color,
                    fontFamily: datum.fontFamily,
                    fontSize: datum.fontSize,
                    fontStyle: datum.fontStyle,
                    fontWeight: datum.fontWeight,
                };
                this.textInput.show({ styles });
            },
            () => {
                this.textInput.hide();
            }
        );
    }

    private setupListeners() {
        const { ctx } = this;
        const { All, Default, Annotations: AnnotationsState, ZoomDrag } = InteractionState;

        const seriesRegion = ctx.regionManager.getRegion(REGIONS.SERIES);

        const otherRegions = Object.values(REGIONS)
            .filter(
                (region) =>
                    ![
                        REGIONS.SERIES,

                        // TODO: Navigator wrongly enchroaches on the top of the chart, even if it is disabled. We
                        // have to ignore it to prevent it immediately calling `onCancel()` when the top-left
                        // annotations toolbar button is clicked.
                        REGIONS.NAVIGATOR,
                    ].includes(region)
            )
            .map((region) => ctx.regionManager.getRegion(region));

        this.destroyFns.push(
            // Interactions
            seriesRegion.addListener('hover', (event) => this.onHover(event), All),
            seriesRegion.addListener('click', (event) => this.onClick(event), All),
            seriesRegion.addListener('drag-start', this.onDragStart.bind(this), Default | ZoomDrag | AnnotationsState),
            seriesRegion.addListener('drag', this.onDrag.bind(this), Default | ZoomDrag | AnnotationsState),
            seriesRegion.addListener('drag-end', this.onDragEnd.bind(this), All),
            seriesRegion.addListener('cancel', this.onCancel.bind(this), All),
            seriesRegion.addListener('delete', this.onDelete.bind(this), All),
            ctx.interactionManager.addListener('keydown', this.onKeyDown.bind(this), AnnotationsState),
            ...otherRegions.map((region) => region.addListener('click', this.onCancel.bind(this), All)),

            // Services
            ctx.annotationManager.addListener('restore-annotations', this.onRestoreAnnotations.bind(this)),
            ctx.toolbarManager.addListener('button-pressed', this.onToolbarButtonPress.bind(this)),
            ctx.toolbarManager.addListener('button-moved', this.onToolbarButtonMoved.bind(this)),
            ctx.toolbarManager.addListener('cancelled', this.onToolbarCancelled.bind(this)),
            ctx.layoutService.addListener('layout-complete', this.onLayoutComplete.bind(this)),

            // DOM
            ctx.annotationManager.attachNode(this.container),
            () => this.colorPicker.destroy(),
            () => ctx.domManager.removeStyles(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS)
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
        this.annotationData.push(datum);
        const styles = this.ctx.annotationManager.getAnnotationTypeStyles(type);
        if (styles) datum.set(styles);

        if (this.defaultColor) {
            this.colorDatum(datum, this.defaultColor);
        }
    }

    private onRestoreAnnotations(event: { annotations?: any }) {
        if (!this.enabled) return;

        this.clear();
        this.annotationData.set(event.annotations);
        this.update();
    }

    private onToolbarButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        const {
            state,
            ctx: { interactionManager, toolbarManager, tooltipManager },
        } = this;

        if (ToolbarManager.isGroup('annotationOptions', event)) {
            this.onToolbarAnnotationOptionButtonPress(event);
            return;
        }

        if (!ToolbarManager.isGroup('annotations', event)) {
            this.reset();
            this.update();
            return;
        }

        if (event.value === 'clear') {
            this.clear();
            this.update();
            return;
        }

        tooltipManager.suppressTooltip('annotations');

        const annotation = stringToAnnotationType(event.value);
        if (!annotation) {
            _Util.Logger.errorOnce(`Can not create unknown annotation type [${event.value}], ignoring.`);
            this.update();
            return;
        }

        if (!state.is('idle')) {
            this.cancel();
        }

        interactionManager.pushState(InteractionState.Annotations);
        for (const annotationType of ANNOTATION_BUTTONS) {
            toolbarManager.toggleButton('annotations', annotationType, { active: annotationType === event.value });
        }
        state.transition(annotation);

        this.reset();
        this.update();
    }

    private onToolbarAnnotationOptionButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('annotationOptions', event)) return;

        const { active, annotationData } = this;

        if (active == null) return;

        switch (event.value) {
            case 'line-color':
                this.colorPicker.show({
                    color: getTypedDatum(annotationData[active])?.getDefaultColor(),
                    onChange: this.onColorPickerChange.bind(this),
                    onClose: this.onColorPickerClose.bind(this),
                });
                break;

            case 'delete':
                annotationData.splice(active, 1);
                this.reset();
                break;

            case 'lock':
                annotationData[active].locked = true;
                this.toggleAnnotationOptionsButtons();
                this.colorPicker.hide();
                break;

            case 'unlock':
                annotationData[active].locked = false;
                this.toggleAnnotationOptionsButtons();
                break;
        }

        this.update();
    }

    private onToolbarButtonMoved(event: _ModuleSupport.ToolbarButtonMovedEvent) {
        const { rect } = event;
        const anchor = Vec2.add(rect, Vec2.from(0, rect.height + 4));
        const fallback = { y: rect.y - 4 };
        this.colorPicker.setAnchor(anchor, fallback);
    }

    private onColorPickerChange(color: string) {
        const { active, annotationData } = this;

        if (active == null) return;

        this.colorDatum(annotationData[active], color);
        this.defaultColor = color;
        this.update();
    }

    private onColorPickerClose() {
        this.colorPicker.hide();
    }

    private onToolbarCancelled(event: _ModuleSupport.ToolbarCancelledEvent) {
        if (event.group !== 'annotations') return;

        this.onCancel();

        for (const annotationType of ANNOTATION_BUTTONS) {
            this.ctx.toolbarManager.toggleButton('annotations', annotationType, { active: false });
        }
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const seriesRect = event.series.paddedRect;
        this.seriesRect = seriesRect;

        for (const axisLayout of event.axes ?? []) {
            if (axisLayout.direction === _ModuleSupport.ChartAxisDirection.X) {
                this.xAxis = this.getAxis(axisLayout, seriesRect, this.xAxis?.button);
            } else {
                this.yAxis = this.getAxis(axisLayout, seriesRect, this.yAxis?.button);
            }
        }

        this.updateAnnotations();
    }

    private getAxis(
        axisLayout: _ModuleSupport.AxisLayout,
        seriesRect: _Scene.BBox,
        button?: AxisButton
    ): AnnotationAxis {
        const axisCtx = this.ctx.axisManager.getAxisContext(axisLayout.direction)[0];

        const { position: axisPosition = 'bottom', direction } = axisCtx;
        const padding = axisLayout.gridPadding + axisLayout.seriesAreaPadding;
        const bounds = buildBounds(new _Scene.BBox(0, 0, seriesRect.width, seriesRect.height), axisPosition, padding);

        const lineDirection = axisCtx.direction === ChartAxisDirection.X ? 'vertical' : 'horizontal';

        const { axesButtons } = this;
        const buttonEnabled =
            this.enabled && axesButtons.enabled && (axesButtons.axes === 'xy' || axesButtons.axes === direction);
        if (buttonEnabled) {
            button ??= new AxisButton(
                this.ctx,
                axisCtx,
                (coords) => this.onAxisButtonClick(coords, lineDirection),
                seriesRect
            );
            const axisLabelPadding = calculateAxisLabelPadding(axisLayout);
            button.update(seriesRect, axisLabelPadding);
        } else {
            button?.destroy();
            button = undefined;
        }

        return { layout: axisLayout, context: axisCtx, bounds, button };
    }

    private updateAnnotations() {
        const {
            active,
            annotationData,
            annotations,
            seriesRect,
            ctx: { annotationManager, toolbarManager },
        } = this;

        const context = this.getAnnotationContext();
        if (!seriesRect || !context) {
            return;
        }

        annotationManager.updateData(annotationData.toJson());

        annotations
            .update(annotationData ?? [], undefined, (datum) => datum.id)
            .each((node, datum, index) => {
                if (!this.validateDatum(datum)) {
                    node.visible = false;
                    return;
                }

                updateAnnotation(node, datum, context, active === index, this.textInput);

                if (active === index) {
                    toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
                }
            });
    }

    // Validation of the options beyond the scope of the @Validate decorator
    private validateDatum(datum: AnnotationProperties) {
        const context = this.getAnnotationContext();
        return context ? datum.isValidWithContext(context, `Annotation [${datum.type}] `) : true;
    }

    private validateChildStateDatumPoint(point: Point) {
        const context = this.getAnnotationContext();
        const valid = context ? validateDatumPoint(context, point) : true;
        if (!valid) {
            this.ctx.cursorManager.updateCursor('annotations', Cursor.NotAllowed);
        }
        return valid;
    }

    private getAnnotationContext(): AnnotationContext | undefined {
        const { seriesRect, xAxis, yAxis } = this;

        if (!(seriesRect && xAxis && yAxis)) {
            return;
        }

        return {
            seriesRect,
            xAxis: {
                ...xAxis.context,
                bounds: xAxis.bounds,
                labelPadding: calculateAxisLabelPadding(xAxis.layout),
            },
            yAxis: {
                ...yAxis.context,
                bounds: yAxis.bounds,
                labelPadding: calculateAxisLabelPadding(xAxis.layout),
            },
        };
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
            const contains = annotation.containsPoint(event.offsetX, event.offsetY);
            if (contains) this.hovered ??= index;
            annotation.toggleHandles(contains || active === index);
        });

        cursorManager.updateCursor(
            'annotations',
            this.hovered == null ? undefined : annotations.at(this.hovered)?.getCursor()
        );
    }

    private onHoverAdding(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        const {
            annotationData,
            annotations,
            seriesRect,
            state,
            ctx: { cursorManager },
        } = this;

        const context = this.getAnnotationContext();

        if (!context) return;

        const offset = Vec2.sub(Vec2.fromOffset(event), Vec2.required(seriesRect));
        const point = invertCoords(offset, context);
        const valid = validateDatumPoint(context, point);
        cursorManager.updateCursor('annotations', valid ? undefined : Cursor.NotAllowed);

        if (!valid || state.is('start')) return;

        const datum = annotationData.at(-1);
        this.active = annotationData.length - 1;
        const node = annotations.at(this.active);

        if (!datum || !node) return;

        node.toggleActive(true);

        const data: StateHoverEvent<AnnotationProperties, AnnotationScene> = { datum, node, point };
        this.state.transition('hover', data);

        this.update();
    }

    private onClick(event: _ModuleSupport.PointerInteractionEvent<'click'>) {
        const { dragOffset, state } = this;

        // Prevent clicks triggered on the exact same event as the drag when placing the second point. This "double"
        // event causes channels to be created with start and end at the same position and render incorrectly.
        if (state.is('end') && dragOffset && dragOffset.x === event.offsetX && dragOffset.y === event.offsetY) {
            this.dragOffset = undefined;
            return;
        }

        if (state.is('idle')) {
            this.onClickSelecting();
        } else {
            this.onClickAdding(event);
        }
    }

    private onAxisButtonClick(coords?: Coords, direction?: Direction) {
        this.onCancel();

        const context = this.getAnnotationContext();
        if (!this.annotationData || !context) return;

        const {
            state,
            ctx: { toolbarManager, interactionManager },
        } = this;

        interactionManager.pushState(InteractionState.Annotations);

        const isHorizontal = direction === 'horizontal';
        state.transition(isHorizontal ? AnnotationType.HorizontalLine : AnnotationType.VerticalLine);

        toolbarManager.toggleGroup('annotations', 'annotationOptions', false);

        if (!coords) {
            return;
        }

        const point = invertCoords(coords, context);

        if (!validateDatumPoint(context, point)) {
            return;
        }

        const data: StateClickEvent<AnnotationProperties, AnnotationScene> = { point };
        state.transition('click', data);

        this.update();
    }

    private onClickSelecting() {
        const {
            annotations,
            colorPicker,
            hovered,
            ctx: { toolbarManager, tooltipManager },
        } = this;

        colorPicker.hide();

        if (this.active != null) {
            annotations.at(this.active)?.toggleActive(false);
        }

        this.active = hovered;
        toolbarManager.toggleGroup('annotations', 'annotationOptions', this.active != null);

        if (this.active == null) {
            tooltipManager.unsuppressTooltip('annotations');
        } else {
            annotations.at(this.active)?.toggleActive(true);
            tooltipManager.suppressTooltip('annotations');
            this.toggleAnnotationOptionsButtons();
        }

        this.update();
    }

    private onClickAdding(event: _ModuleSupport.PointerInteractionEvent<'click'>) {
        const {
            active,
            annotationData,
            annotations,
            seriesRect,
            state,
            ctx: { toolbarManager },
        } = this;

        toolbarManager.toggleGroup('annotations', 'annotationOptions', false);

        const context = this.getAnnotationContext();
        if (!context) return;

        const datum = annotationData.at(-1);
        const offset = Vec2.sub(Vec2.fromOffset(event), Vec2.required(seriesRect));
        const point = invertCoords(offset, context);

        const node = active != null ? annotations.at(active) : undefined;

        if (!validateDatumPoint(context, point)) {
            return;
        }

        const data: StateClickEvent<AnnotationProperties, AnnotationScene> = { datum, node, point };
        state.transition('click', data);

        this.update();
    }

    private onDragStart(event: _ModuleSupport.PointerInteractionEvent<'drag-start'>) {
        const { annotationData, annotations, hovered, seriesRect } = this;

        if (this.isOtherElement(event)) {
            return;
        }

        const context = this.getAnnotationContext();

        if (hovered == null || annotationData == null || !this.state.is('idle') || context == null) return;

        const datum = annotationData[hovered];
        const node = annotations.at(hovered);
        if (!node) return;

        const offset = Vec2.sub(Vec2.fromOffset(event), Vec2.required(seriesRect));

        dragStartAnnotation(node, datum, context, offset);
    }

    private onDrag(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        const { state } = this;

        if (this.isOtherElement(event)) {
            return;
        }

        // Only track pointer offset for drag + click prevention when we are placing the first point
        if (state.is('start')) {
            this.dragOffset = Vec2.fromOffset(event);
        }

        if (state.is('idle')) {
            this.onClickSelecting();
            this.onDragAnnotation(event);
        } else {
            this.onDragAdding(event);
        }
    }

    private onDragAnnotation(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        const {
            annotationData,
            annotations,
            hovered,
            seriesRect,
            ctx: { cursorManager, interactionManager },
        } = this;

        const context = this.getAnnotationContext();

        if (hovered == null || annotationData == null || !this.state.is('idle') || context == null) return;

        interactionManager.pushState(InteractionState.Annotations);

        const datum = annotationData[hovered];
        const node = annotations.at(hovered);
        if (!node) return;

        const offset = Vec2.sub(Vec2.fromOffset(event), Vec2.required(seriesRect));

        cursorManager.updateCursor('annotations');
        const onDragInvalid = () => cursorManager.updateCursor('annotations', Cursor.NotAllowed);

        dragAnnotation(node, datum, context, offset, onDragInvalid);

        this.update();
    }

    private onDragAdding(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        const {
            active,
            annotationData,
            annotations,
            seriesRect,
            state,
            ctx: { interactionManager },
        } = this;

        const context = this.getAnnotationContext();
        if (annotationData == null || context == null) return;

        const datum = active != null ? annotationData[active] : undefined;
        const node = active != null ? annotations.at(active) : undefined;
        const offset = Vec2.sub(Vec2.fromOffset(event), Vec2.required(seriesRect));

        interactionManager.pushState(InteractionState.Annotations);

        const point = invertCoords(offset, context);
        const data: StateDragEvent<AnnotationProperties, AnnotationScene> = { datum, node, point };

        state.transition('drag', data);

        // Assuming the first drag event appends a new datum, immediately activate it
        this.active = annotationData.length - 1;

        this.update();
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

        annotations.at(active)?.stopDragging();
        this.update();
    }

    private onCancel() {
        if (!this.state.is('idle')) {
            this.cancel();
        }
        this.reset();
        this.update();
    }

    private onDelete() {
        const { active, annotationData, state } = this;

        if (active == null) return;

        if (!state.is('idle')) {
            state.transition('cancel');
        }

        annotationData.splice(active, 1);

        this.reset();
        this.update();
    }

    private onKeyDown(event: _ModuleSupport.KeyInteractionEvent<'keydown'>) {
        const { annotationData, state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const datum = annotationData.at(-1);
        const { key } = event.sourceEvent;

        if (key === 'Tab') {
            const value = this.textInput.getValue();
            const data: StateInputEvent<AnnotationProperties> = { datum, value };
            state.transition('input', data);

            this.update();
        }
    }

    private toggleAnnotationOptionsButtons() {
        const {
            active,
            annotationData,
            ctx: { toolbarManager },
        } = this;

        if (active == null) return;

        const locked = annotationData.at(active)?.locked ?? false;
        toolbarManager.toggleButton('annotationOptions', 'line-color', { enabled: !locked });
        toolbarManager.toggleButton('annotationOptions', 'delete', { enabled: !locked });
        toolbarManager.toggleButton('annotationOptions', 'lock', { visible: !locked });
        toolbarManager.toggleButton('annotationOptions', 'unlock', { visible: locked });
    }

    private colorDatum(datum: AnnotationProperties, color: string) {
        if ('stroke' in datum) datum.stroke = color;

        if ('axisLabel' in datum) {
            datum.axisLabel.fill = color;
            datum.axisLabel.stroke = color;
        }

        if ('background' in datum) datum.background.fill = color;
    }

    private isOtherElement({ targetElement }: { targetElement?: HTMLElement }) {
        const {
            colorPicker,
            ctx: { domManager },
        } = this;

        if (!targetElement) return false;

        return ToolbarManager.isChildElement(domManager, targetElement) || colorPicker.isChildElement(targetElement);
    }

    private clear() {
        this.annotationData.splice(0, this.annotationData.length);
        this.reset();
    }

    private reset() {
        if (this.active != null) {
            this.annotations.at(this.active)?.toggleActive(false);
        }
        this.hovered = undefined;
        this.active = undefined;
        this.ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', false);
        this.colorPicker.hide();
    }

    private cancel() {
        const { active, annotationData, state } = this;

        state.transition('cancel');

        // Delete active annotation if it is in the process of being created
        if (active != null && annotationData) {
            annotationData.splice(active, 1);
        }
    }

    private update() {
        this.ctx.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }
}
