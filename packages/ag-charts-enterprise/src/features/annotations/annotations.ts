import {
    type AgToolbarAnnotationsButtonValue,
    type Direction,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { buildBounds } from '../../utils/position';
import { ColorPicker } from '../color-picker/colorPicker';
import { type MenuItem, Popover } from '../popover/popover';
import { TextInput } from '../text-input/textInput';
import type { AnnotationContext, AnnotationOptionsColorPickerType, Coords, Point } from './annotationTypes';
import { ANNOTATION_BUTTONS, AnnotationType, stringToAnnotationType } from './annotationTypes';
import { calculateAxisLabelPadding, invertCoords, validateDatumPoint } from './annotationUtils';
import {
    annotationDatums,
    annotationScenes,
    colorDatum,
    getTypedDatum,
    isChannelType,
    isLineType,
    isTextType,
    updateAnnotation,
} from './annotationsConfig';
import { AnnotationsStateMachine } from './annotationsStateMachine';
import type { AnnotationProperties, AnnotationScene } from './annotationsSuperTypes';
import { AxisButton, DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS } from './axisButton';

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

const TEXT_SIZE_ITEMS: MenuItem<number>[] = [
    { label: '10', value: 10 },
    { label: '12', value: 12 },
    { label: '14', value: 14 },
    { label: '16', value: 16 },
    { label: '18', value: 18 },
    { label: '22', value: 22 },
    { label: '28', value: 28 },
    { label: '36', value: 36 },
    { label: '46', value: 46 },
];

const TEXT_ANNOTATION_ITEMS: MenuItem<AnnotationType>[] = [
    { label: 'toolbarAnnotationsText', icon: 'text-annotation', value: AnnotationType.Text },
    { label: 'toolbarAnnotationsComment', icon: 'comment-annotation', value: AnnotationType.Comment },
    { label: 'toolbarAnnotationsCallout', icon: 'callout-annotation', value: AnnotationType.Callout },
    { label: 'toolbarAnnotationsNote', icon: 'note-annotation', value: AnnotationType.Note },
];

enum AnnotationOptions {
    Delete = 'delete',
    LineColor = 'line-color',
    FillColor = 'fill-color',
    Lock = 'lock',
    TextColor = 'text-color',
    TextSize = 'text-size',
    Unlock = 'unlock',
}

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

        toolbarManager.toggleGroup('annotations', 'annotations', { visible: Boolean(enabled) });

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

    // Elements
    private seriesRect?: _Scene.BBox;
    private readonly container = new _Scene.Group({ name: 'static-annotations' });
    private readonly annotations = new _Scene.Selection<AnnotationScene, AnnotationProperties>(
        this.container,
        this.createAnnotationScene.bind(this)
    );

    private readonly colorPicker = new ColorPicker(this.ctx);
    private readonly textSizePopover = new Popover(this.ctx, 'annotations');
    private readonly textAnnotationsPopover = new Popover(this.ctx, 'text');
    private readonly defaultColors: Map<AnnotationOptionsColorPickerType, string | undefined> = new Map([
        ['line-color', undefined],
        ['fill-color', undefined],
        ['text-color', undefined],
    ]);

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

        return new AnnotationsStateMachine({
            resetToIdle: () => {
                ctx.cursorManager.updateCursor('annotations');
                ctx.interactionManager.popState(InteractionState.Annotations);
                ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: false });
                ctx.tooltipManager.unsuppressTooltip('annotations');
                this.colorPicker.hide();
                this.textSizePopover.hide();
                this.textAnnotationsPopover.hide();
                this.resetToolbarButtonStates();
                this.toggleAnnotationOptionsButtons();
                this.update();
            },

            hoverAtCoords: (coords: Coords, active?: number) => {
                let hovered;

                this.annotations.each((annotation, _, index) => {
                    const contains = annotation.containsPoint(coords.x, coords.y);
                    if (contains) hovered ??= index;
                    annotation.toggleHandles(contains || active === index);
                });

                this.ctx.cursorManager.updateCursor(
                    'annotations',
                    hovered == null ? undefined : this.annotations.at(hovered)?.getCursor()
                );

                return hovered;
            },

            select: (index?: number, previous?: number) => {
                const {
                    annotations,
                    colorPicker,
                    textSizePopover,
                    textAnnotationsPopover,
                    ctx: { toolbarManager, tooltipManager },
                } = this;

                colorPicker.hide();
                textSizePopover.hide();
                textAnnotationsPopover.hide();

                if (previous != null) {
                    annotations.at(previous)?.toggleActive(false);
                }

                const node = index != null ? annotations.at(index) : undefined;
                toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: index != null });
                if (node) toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());

                if (index == null) {
                    tooltipManager.unsuppressTooltip('annotations');
                } else {
                    node?.toggleActive(true);
                    tooltipManager.suppressTooltip('annotations');
                    this.toggleAnnotationOptionsButtons();
                }

                this.update();

                return index;
            },

            selectLast: () => {
                return this.annotationData.length - 1;
            },

            startInteracting: () => {
                this.ctx.interactionManager.pushState(InteractionState.Annotations);
            },

            stopInteracting: () => {
                this.ctx.interactionManager.popState(InteractionState.Annotations);
            },

            create: (type: AnnotationType, datum: AnnotationProperties) => {
                this.annotationData.push(datum);

                const styles = this.ctx.annotationManager.getAnnotationTypeStyles(type);
                if (styles) datum.set(styles);

                for (const [colorPickerType, color] of this.defaultColors) {
                    if (color) {
                        colorDatum(datum, colorPickerType, color);
                    }
                }

                this.update();

                ctx.toolbarManager.updateButton('annotations', 'text-menu', {
                    icon: undefined,
                });
                ctx.toolbarManager.toggleButton('annotations', 'text-menu', {
                    active: false,
                });
            },

            delete: (index: number) => {
                this.annotationData.splice(index, 1);
            },

            validatePoint: (point: Point) => {
                const context = this.getAnnotationContext();
                const valid = context ? validateDatumPoint(context, point) : true;
                if (!valid) {
                    this.ctx.cursorManager.updateCursor('annotations', Cursor.NotAllowed);
                }
                return valid;
            },

            getAnnotationType: (index: number) => {
                return stringToAnnotationType(this.annotationData[index].type);
            },

            datum: (index: number) => {
                return this.annotationData.at(index);
            },

            node: (index: number) => {
                return this.annotations.at(index);
            },

            resetToolbarButtonStates: () => {
                this.resetToolbarButtonStates();
            },

            update: () => {
                this.update();
            },

            showTextInput: (active: number) => {
                const datum = getTypedDatum(this.annotationData.at(active));
                if (!datum || !('getTextInputCoords' in datum)) return;

                const styles = {
                    color: datum.color,
                    fontFamily: datum.fontFamily,
                    fontSize: datum.fontSize,
                    fontStyle: datum.fontStyle,
                    fontWeight: datum.fontWeight,
                };

                this.textInput.show({
                    styles,
                    text: datum.text,
                    onChange: (_text, bbox) => {
                        this.state.transition('textInput', { bbox });
                    },
                });

                const point = Vec2.add(
                    datum.getTextInputCoords(this.getAnnotationContext()!),
                    Vec2.required(this.seriesRect)
                );

                this.textInput.setLayout({
                    point,
                    position: datum.position,
                    alignment: datum.alignment,
                    textAlign: datum.textAlign,
                });
            },

            hideTextInput: () => {
                this.textInput.hide();
            },

            showAnnotationOptions: () => {
                const active = this.state.getActive();
                if (active == null) return;

                const node = this.annotations.at(active);
                if (!node) return;

                ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: true });
                ctx.toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
                this.toggleAnnotationOptionsButtons();
            },
        });
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
            ctx.updateService.addListener('update-complete', this.onUpdateComplete.bind(this)),

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

    private onRestoreAnnotations(event: { annotations?: any }) {
        if (!this.enabled) return;

        this.clear();
        this.annotationData.set(event.annotations);
        this.update();
    }

    private onToolbarButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        const { tooltipManager } = this.ctx;

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

        if (event.value === 'text-menu') {
            const { x, y, width } = event.rect;
            this.textAnnotationsPopover.setAnchor({ x: x + width + 6, y });
            this.textAnnotationsPopover.show<AnnotationType>({
                items: TEXT_ANNOTATION_ITEMS,
                onPress: this.onTextAnnotationsPopoverPress.bind(this, event),
                onClose: this.onTextAnnotationsPopoverClose.bind(this),
            });
            return;
        }

        tooltipManager.suppressTooltip('annotations');

        const annotation = stringToAnnotationType(event.value);
        if (annotation) {
            this.beginAnnotationPlacement(annotation);
        } else {
            _Util.Logger.errorOnce(`Can not create unknown annotation type [${event.value}], ignoring.`);
            this.update();
        }
    }

    private beginAnnotationPlacement(annotation: AnnotationType) {
        const {
            state,
            ctx: { interactionManager, toolbarManager },
        } = this;

        if (!state.is('idle')) {
            this.cancel();
        }

        this.reset();

        interactionManager.pushState(InteractionState.Annotations);
        for (const annotationType of ANNOTATION_BUTTONS) {
            toolbarManager.toggleButton('annotations', annotationType, { active: annotationType === annotation });
        }
        state.transition(annotation);

        this.update();
    }

    private onToolbarAnnotationOptionButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('annotationOptions', event)) return;

        const { annotationData, state } = this;
        const active = state.getActive();

        if (active == null) return;

        switch (event.value) {
            case AnnotationOptions.LineColor:
            case AnnotationOptions.FillColor:
            case AnnotationOptions.TextColor:
                this.colorPicker.show({
                    color: getTypedDatum(annotationData[active])?.getDefaultColor(event.value),
                    onChange: this.onColorPickerChange.bind(this, event.value),
                    onClose: this.onColorPickerClose.bind(this),
                });
                break;

            case AnnotationOptions.TextSize:
                this.textSizePopover.show<number>({
                    items: TEXT_SIZE_ITEMS,
                    onPress: this.onTextSizePopoverPress.bind(this),
                    onClose: this.onTextSizePopoverClose.bind(this),
                    minWidth: 60,
                });
                break;

            case AnnotationOptions.Delete:
                annotationData.splice(active, 1);
                this.reset();
                break;

            case AnnotationOptions.Lock:
                annotationData[active].locked = true;
                this.toggleAnnotationOptionsButtons();
                this.colorPicker.hide();
                this.textSizePopover.hide();
                break;

            case AnnotationOptions.Unlock:
                annotationData[active].locked = false;
                this.toggleAnnotationOptionsButtons();
                break;
        }

        this.update();
    }

    private onToolbarButtonMoved(event: _ModuleSupport.ToolbarButtonMovedEvent) {
        const { group, rect, value } = event;

        if (
            group !== 'annotationOptions' ||
            (value !== AnnotationOptions.LineColor && value !== AnnotationOptions.TextColor)
        ) {
            return;
        }

        const anchor = Vec2.add(rect, Vec2.from(0, rect.height + 4));
        const fallback = { y: rect.y - 4 };
        this.colorPicker.setAnchor(anchor, fallback);
        this.textSizePopover.setAnchor(anchor);
    }

    private onColorPickerChange(colorPickerType: AnnotationOptionsColorPickerType, color: string) {
        this.state.transition('color', { colorPickerType, color });
        this.defaultColors.set(colorPickerType, color);

        this.updateToolbarColorPickerFill(colorPickerType, color);
    }

    private updateToolbarColorPickerFill(colorPickerType: AnnotationOptionsColorPickerType, color?: string) {
        this.ctx.toolbarManager.updateButton('annotationOptions', colorPickerType, {
            fill: color,
        });
    }

    private updateToolbarFills() {
        const active = this.state.getActive();
        const annotation = active != null ? this.annotationData[active] : undefined;
        const datum = getTypedDatum(annotation);
        this.updateToolbarColorPickerFill(
            AnnotationOptions.LineColor,
            datum?.getDefaultColor(AnnotationOptions.LineColor)
        );
        this.updateToolbarColorPickerFill(
            AnnotationOptions.FillColor,
            datum?.getDefaultColor(AnnotationOptions.FillColor)
        );
        this.updateToolbarColorPickerFill(
            AnnotationOptions.TextColor,
            datum?.getDefaultColor(AnnotationOptions.TextColor)
        );
    }

    private onColorPickerClose() {
        this.colorPicker.hide();
    }

    private updateToolbarFontSize(fontSize: number | undefined) {
        this.ctx.toolbarManager.updateButton('annotationOptions', AnnotationOptions.TextSize, {
            label: fontSize != null ? String(fontSize) : undefined,
        });
    }

    private onTextSizePopoverPress(item: MenuItem<number>) {
        const fontSize = item.value;
        this.state.transition('fontSize', fontSize);

        this.updateToolbarFontSize(fontSize);
    }

    private onTextSizePopoverClose() {
        this.textSizePopover.hide();
    }

    private onTextAnnotationsPopoverPress(
        event: _ModuleSupport.ToolbarButtonPressedEvent<AgToolbarAnnotationsButtonValue>,
        item: MenuItem<AnnotationType>
    ) {
        const { toolbarManager } = this.ctx;
        toolbarManager.toggleButton('annotations', event.id, {
            active: true,
        });
        toolbarManager.updateButton('annotations', event.id, {
            icon: item.icon,
        });
        this.beginAnnotationPlacement(item.value);
        this.onTextAnnotationsPopoverClose();
    }

    private onTextAnnotationsPopoverClose() {
        this.textSizePopover.hide();
    }

    private onToolbarCancelled(event: _ModuleSupport.ToolbarCancelledEvent) {
        if (event.group !== 'annotations') return;

        this.cancel();
        this.resetToolbarButtonStates();
        this.reset();
        this.update();
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

    private onUpdateComplete() {
        this.state.transition('render');
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
            annotationData,
            annotations,
            seriesRect,
            state,
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

                updateAnnotation(node, datum, context);

                if (state.isActive(index)) {
                    toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
                }
            });
    }

    // Validation of the options beyond the scope of the @Validate decorator
    private validateDatum(datum: AnnotationProperties) {
        const context = this.getAnnotationContext();
        return context ? datum.isValidWithContext(context, `Annotation [${datum.type}] `) : true;
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
        const { seriesRect, state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.fromOffset(event);
        const point = invertCoords(Vec2.sub(offset, Vec2.required(seriesRect)), context);

        state.transition('hover', { offset, point });
    }

    private onClick(event: _ModuleSupport.PointerInteractionEvent<'click'>) {
        const { seriesRect, state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.sub(Vec2.fromOffset(event), Vec2.required(seriesRect));
        const point = invertCoords(offset, context);
        const textInputValue = this.textInput.getValue();

        state.transition('click', { offset, point, textInputValue });
    }

    private onAxisButtonClick(coords?: Coords, direction?: Direction) {
        this.cancel();
        this.reset();

        const context = this.getAnnotationContext();
        if (!this.annotationData || !context) return;

        const {
            state,
            ctx: { toolbarManager, interactionManager },
        } = this;

        interactionManager.pushState(InteractionState.Annotations);

        const isHorizontal = direction === 'horizontal';
        state.transition(isHorizontal ? AnnotationType.HorizontalLine : AnnotationType.VerticalLine);

        toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: false });

        if (!coords) {
            return;
        }

        const point = invertCoords(coords, context);

        if (!validateDatumPoint(context, point)) {
            return;
        }

        state.transition('click', { point });

        this.update();
    }

    private onDragStart(event: _ModuleSupport.PointerInteractionEvent<'drag-start'>) {
        const { seriesRect, state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.sub(Vec2.fromOffset(event), Vec2.required(seriesRect));
        state.transition('dragStart', { context, offset });
    }

    private onDrag(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        const { seriesRect, state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.sub(Vec2.fromOffset(event), Vec2.required(seriesRect));
        const point = invertCoords(offset, context);
        state.transition('drag', { context, offset, point });
    }

    private onDragEnd(_event: _ModuleSupport.PointerInteractionEvent<'drag-end'>) {
        this.state.transition('dragEnd');
    }

    private onCancel() {
        this.cancel();
        this.reset();
        this.update();
    }

    private onDelete() {
        const { annotationData, state } = this;

        const active = state.getActive();
        if (active == null) return;

        state.transition('cancel');
        annotationData.splice(active, 1);

        this.reset();
        this.update();
    }

    private onKeyDown(event: _ModuleSupport.KeyInteractionEvent<'keydown'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const { key, shiftKey } = event.sourceEvent;
        const textInputValue = this.textInput.getValue();

        // TODO: Use `event.sourceEvent.shiftKey`, @see AG-12164
        state.transition('keyDown', { key, shiftKey, textInputValue });
    }

    private toggleAnnotationOptionsButtons() {
        const {
            annotationData,
            state,
            ctx: { toolbarManager },
        } = this;
        const active = state.getActive();

        if (active == null) return;

        const datum = getTypedDatum(annotationData.at(active));
        const locked = datum?.locked ?? false;

        this.updateToolbarFontSize(datum != null && 'fontSize' in datum ? datum.fontSize : undefined);
        this.updateToolbarFills();
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.LineColor, {
            enabled: !locked,
            visible: isLineType(datum) || isChannelType(datum),
        });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.TextColor, {
            enabled: !locked,
            visible: isTextType(datum),
        });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.TextSize, {
            enabled: !locked,
            visible: isTextType(datum),
        });

        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.Delete, { enabled: !locked });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.Lock, { visible: !locked });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.Unlock, { visible: locked });
    }

    private clear() {
        this.annotationData.splice(0, this.annotationData.length);
        this.reset();
    }

    private reset() {
        this.state.transition('reset');
    }

    private cancel() {
        const { annotationData, state } = this;
        const active = state.getActive();

        state.transition('cancel');

        // TODO: shift delete into state machine

        // Delete active annotation if it is in the process of being created
        if (active != null && annotationData) {
            annotationData.splice(active, 1);
        }
    }

    private resetToolbarButtonStates() {
        for (const annotationType of ANNOTATION_BUTTONS) {
            this.ctx.toolbarManager.toggleButton('annotations', annotationType, { active: false });
        }
    }

    private update() {
        this.ctx.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }
}
