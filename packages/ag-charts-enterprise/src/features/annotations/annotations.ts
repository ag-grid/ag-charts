import {
    type AgToolbarAnnotationsButtonValue,
    type Direction,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { Menu, type MenuItem } from '../../components/menu/menu';
import { buildBounds } from '../../utils/position';
import { ColorPicker } from '../color-picker/colorPicker';
import { TextInput } from '../text-input/textInput';
import type {
    AnnotationContext,
    AnnotationLineStyle,
    AnnotationLineStyleType,
    AnnotationOptionsColorPickerType,
    ChannelAnnotationType,
    Coords,
    LineAnnotationType,
    Point,
    TextualAnnotationType,
} from './annotationTypes';
import {
    ANNOTATION_BUTTONS,
    ANNOTATION_BUTTON_GROUPS,
    AnnotationType,
    stringToAnnotationType,
} from './annotationTypes';
import { calculateAxisLabelPadding, invertCoords, validateDatumPoint } from './annotationUtils';
import {
    annotationDatums,
    annotationScenes,
    getLineStyle,
    getTypedDatum,
    hasFillColor,
    hasFontSize,
    hasLineColor,
    hasLineStyle,
    hasTextColor,
    isTextType,
    setDefaults,
    updateAnnotation,
} from './annotationsConfig';
import { AnnotationsStateMachine } from './annotationsStateMachine';
import type { AnnotationProperties, AnnotationScene } from './annotationsSuperTypes';
import { AxisButton, DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS } from './axisButton';
import { LineProperties } from './line/lineProperties';
import { AnnotationSettingsDialog } from './settings-dialog/settingsDialog';

const {
    BOOLEAN,
    ChartUpdateType,
    Cursor,
    InteractionState,
    ObserveChanges,
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

const LINE_STROKE_WIDTH_ITEMS: MenuItem<number>[] = [
    { strokeWidth: 1, label: '1', value: 1 },
    { strokeWidth: 2, label: '2', value: 2 },
    { strokeWidth: 3, label: '3', value: 3 },
    { strokeWidth: 4, label: '4', value: 4 },
    { strokeWidth: 8, label: '8', value: 8 },
];

const LINE_STYLE_TYPE_ITEMS: MenuItem<AnnotationLineStyleType>[] = [
    { icon: 'line-style-solid', value: 'solid' },
    { icon: 'line-style-dashed', value: 'dashed' },
    { icon: 'line-style-dotted', value: 'dotted' },
];

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

const LINE_ANNOTATION_ITEMS: MenuItem<AnnotationType>[] = [
    {
        label: 'toolbarAnnotationsTrendLine',
        icon: 'trend-line-drawing',
        value: AnnotationType.Line,
    },
    {
        label: 'toolbarAnnotationsHorizontalLine',
        icon: 'horizontal-line-drawing',
        value: AnnotationType.HorizontalLine,
    },
    {
        label: 'toolbarAnnotationsVerticalLine',
        icon: 'vertical-line-drawing',
        value: AnnotationType.VerticalLine,
    },
    {
        label: 'toolbarAnnotationsParallelChannel',
        icon: 'parallel-channel-drawing',
        value: AnnotationType.ParallelChannel,
    },
    {
        label: 'toolbarAnnotationsDisjointChannel',
        icon: 'disjoint-channel-drawing',
        value: AnnotationType.DisjointChannel,
    },
];

const TEXT_ANNOTATION_ITEMS: MenuItem<AnnotationType>[] = [
    { label: 'toolbarAnnotationsText', icon: 'text-annotation', value: AnnotationType.Text },
    { label: 'toolbarAnnotationsComment', icon: 'comment-annotation', value: AnnotationType.Comment },
    { label: 'toolbarAnnotationsCallout', icon: 'callout-annotation', value: AnnotationType.Callout },
    { label: 'toolbarAnnotationsNote', icon: 'note-annotation', value: AnnotationType.Note },
];

const SHAPE_ANNOTATION_ITEMS: MenuItem<AnnotationType>[] = [
    { label: 'toolbarAnnotationsArrow', icon: 'arrow-drawing', value: AnnotationType.Arrow },
    { label: 'toolbarAnnotationsArrowUp', icon: 'arrow-up', value: AnnotationType.ArrowUp },
    { label: 'toolbarAnnotationsArrowDown', icon: 'arrow-down', value: AnnotationType.ArrowDown },
];

enum AnnotationOptions {
    Delete = 'delete',
    LineStrokeWidth = 'line-stroke-width',
    LineStyleType = 'line-style-type',
    LineColor = 'line-color',
    FillColor = 'fill-color',
    Lock = 'lock',
    TextColor = 'text-color',
    TextSize = 'text-size',
    Settings = 'settings',
}

class AxesButtons {
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    @Validate(AXIS_TYPE, { optional: true })
    public axes?: 'x' | 'y' | 'xy' = 'y';
}

export class Annotations extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ObserveChanges<Annotations>((target, newValue?: boolean, oldValue?: boolean) => {
        const {
            ctx: { annotationManager, stateManager, toolbarManager },
        } = target;

        if (newValue === oldValue) return;

        toolbarManager.toggleGroup('annotations', 'annotations', { visible: Boolean(newValue) });

        // Restore the annotations only if this module was previously disabled
        if (oldValue === false && newValue === true) {
            stateManager.restoreState(annotationManager);
        } else if (newValue === false) {
            target.clear();
        }
    })
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    public axesButtons = new AxesButtons();

    // State
    private readonly state: AnnotationsStateMachine;
    private readonly annotationData: AnnotationPropertiesArray = new PropertiesArray(this.createAnnotationDatum);
    private readonly defaultColors: Map<
        AnnotationType,
        Map<AnnotationOptionsColorPickerType, [string, string, number] | undefined>
    > = new Map(
        Object.values(AnnotationType).map((type) => [
            type,
            new Map([
                ['line-color', undefined],
                ['fill-color', undefined],
                ['text-color', undefined],
            ]),
        ])
    );
    private readonly defaultFontSizes: Map<TextualAnnotationType, number | undefined> = new Map([
        [AnnotationType.Callout, undefined],
        [AnnotationType.Comment, undefined],
        [AnnotationType.Note, undefined],
        [AnnotationType.Text, undefined],
    ]);

    private readonly defaultLineStyles: Map<
        LineAnnotationType | ChannelAnnotationType,
        AnnotationLineStyle | undefined
    > = new Map<LineAnnotationType | ChannelAnnotationType, AnnotationLineStyle | undefined>([
        [AnnotationType.Line, undefined],
        [AnnotationType.HorizontalLine, undefined],
        [AnnotationType.VerticalLine, undefined],
        [AnnotationType.DisjointChannel, undefined],
        [AnnotationType.ParallelChannel, undefined],
        [AnnotationType.Arrow, undefined],
    ]);

    // Elements
    private seriesRect?: _Scene.BBox;
    private readonly container = new _Scene.Group({ name: 'static-annotations' });
    private readonly annotations = new _Scene.Selection<AnnotationScene, AnnotationProperties>(
        this.container,
        this.createAnnotationScene.bind(this)
    );
    private readonly colorPicker = new ColorPicker(this.ctx);
    private readonly textSizeMenu = new Menu(this.ctx, 'text-size');
    private readonly lineStyleTypeMenu = new Menu(this.ctx, 'annotations-line-style-type');
    private readonly lineStrokeWidthMenu = new Menu(this.ctx, 'annotations-line-stroke-width');
    private readonly annotationMenu = new Menu(this.ctx, 'annotations');
    private readonly settingsDialog = new AnnotationSettingsDialog(this.ctx);
    private readonly textInput = new TextInput(this.ctx);

    private xAxis?: AnnotationAxis;
    private yAxis?: AnnotationAxis;

    private removeAmbientKeyboardListener?: () => void = undefined;

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
                this.hideOverlays();
                this.resetToolbarButtonStates();
                this.toggleAnnotationOptionsButtons();
                this.update();
            },

            hoverAtCoords: (coords: Coords, active?: number) => {
                let hovered;

                this.annotations.each((annotation, _, index) => {
                    const contains = annotation.containsPoint(coords.x, coords.y);
                    if (contains) hovered ??= index;
                    annotation.toggleHovered(contains || active === index);
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
                    ctx: { toolbarManager, tooltipManager },
                } = this;

                const node = index != null ? annotations.at(index) : undefined;
                node?.toggleActive(true);

                this.hideOverlays();

                if (previous != null && previous != index) {
                    annotations.at(previous)?.toggleActive(false);
                }

                if (index == null) {
                    tooltipManager.unsuppressTooltip('annotations');
                } else {
                    tooltipManager.suppressTooltip('annotations');
                }

                if (index == null || (index != null && index !== previous)) {
                    ctx.toolbarManager.updateButton('annotations', 'line-menu', { icon: undefined });
                    ctx.toolbarManager.updateButton('annotations', 'text-menu', { icon: undefined });
                }

                if (node) {
                    this.toggleAnnotationOptionsButtons();
                    toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: true });
                } else {
                    toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: false });
                }

                this.update();
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

                setDefaults({
                    datum,
                    defaultColors: this.defaultColors,
                    defaultFontSizes: this.defaultFontSizes,
                    defaultLineStyles: this.defaultLineStyles,
                });

                this.resetToolbarButtonStates();

                this.removeAmbientKeyboardListener?.();
                this.removeAmbientKeyboardListener = undefined;

                this.update();
            },

            delete: (index: number) => {
                this.annotationData.splice(index, 1);
            },

            deleteAll: () => {
                this.annotationData.splice(0, this.annotationData.length);
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

            update: () => {
                this.update();
            },

            showTextInput: (active: number) => {
                const datum = getTypedDatum(this.annotationData.at(active));
                const node = this.annotations.at(active);
                if (!node || !datum || !('getTextInputCoords' in datum)) return;

                const styles = {
                    color: datum.color,
                    fontFamily: datum.fontFamily,
                    fontSize: datum.fontSize,
                    fontStyle: datum.fontStyle,
                    fontWeight: datum.fontWeight,
                    placeholderColor: datum.getPlaceholderColor(),
                };

                const context = this.getAnnotationContext()!;

                const getTextInputCoords = () =>
                    Vec2.add(datum.getTextInputCoords(context), Vec2.required(this.seriesRect));

                this.textInput.show({
                    styles,
                    layout: {
                        getTextInputCoords,
                        position: datum.position,
                        alignment: datum.alignment,
                        textAlign: datum.textAlign,
                        width: datum.width,
                    },
                    text: datum.text,
                    onChange: (_text, bbox) => {
                        this.state.transition('updateTextInputBBox', bbox);
                    },
                });
            },

            hideTextInput: () => {
                this.textInput.hide();
            },

            updateTextInputColor: (color: string) => {
                this.textInput.updateColor(color);
            },

            updateTextInputFontSize: (fontSize: number) => {
                const bbox = this.textInput.updateFontSize(fontSize);
                this.state.transition('updateTextInputBBox', bbox);
            },

            updateTextInputBBox: (bbox?: _Scene.BBox) => {
                this.state.transition('updateTextInputBBox', bbox);
            },

            showAnnotationOptions: (active: number) => {
                const node = this.annotations.at(active);
                if (!node) return;

                ctx.toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
                this.toggleAnnotationOptionsButtons();
                ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: true });
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
            ctx.keyNavManager.addListener('cancel', this.onCancel.bind(this)),
            ctx.keyNavManager.addListener('delete', this.onDelete.bind(this)),
            ctx.interactionManager.addListener('keydown', this.onKeyDown.bind(this), AnnotationsState),
            ...otherRegions.map((region) => region.addListener('click', this.onCancel.bind(this), All)),

            // Services
            ctx.annotationManager.addListener('restore-annotations', this.onRestoreAnnotations.bind(this)),
            ctx.toolbarManager.addListener('button-pressed', this.onToolbarButtonPress.bind(this)),
            ctx.toolbarManager.addListener('button-moved', this.onToolbarButtonMoved.bind(this)),
            ctx.toolbarManager.addListener('cancelled', this.onToolbarCancelled.bind(this)),
            ctx.layoutManager.addListener('layout:complete', this.onLayoutComplete.bind(this)),
            ctx.updateService.addListener('pre-scene-render', this.onPreRender.bind(this)),

            // DOM
            ctx.annotationManager.attachNode(this.container),
            () => this.colorPicker.destroy(),
            () => ctx.domManager.removeStyles(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS)
        );
    }

    override destroy(): void {
        super.destroy();
        this.removeAmbientKeyboardListener?.();
        this.removeAmbientKeyboardListener = undefined;
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
        if (ToolbarManager.isGroup('annotationOptions', event)) {
            this.onToolbarAnnotationOptionButtonPress(event);
            return;
        }

        if (!ToolbarManager.isGroup('annotations', event)) {
            this.reset();
            return;
        }

        if (event.value === 'clear') {
            this.clear();
            return;
        }

        if (event.value === 'line-menu') {
            this.onToolbarButtonPressMenu(event, 'toolbarAnnotationsLineAnnotations', LINE_ANNOTATION_ITEMS);
            return;
        }

        if (event.value === 'text-menu') {
            this.onToolbarButtonPressMenu(event, 'toolbarAnnotationsTextAnnotations', TEXT_ANNOTATION_ITEMS);
            return;
        }

        if (event.value === 'shape-menu') {
            this.onToolbarButtonPressMenu(event, 'toolbarAnnotationsShapeAnnotations', SHAPE_ANNOTATION_ITEMS);
            return;
        }

        this.onToolbarButtonPressAnnotation(event);
    }

    private onToolbarAnnotationOptionButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('annotationOptions', event)) return;

        const { annotationData, state } = this;
        const active = state.getActive();

        if (active == null) return;

        this.hideOverlays();

        const datum = getTypedDatum(annotationData[active]);

        switch (event.value) {
            case AnnotationOptions.LineStyleType:
                const lineStyle = hasLineStyle(datum) ? getLineStyle(datum.lineDash, datum.lineStyle) : undefined;
                this.lineStyleTypeMenu.show<AnnotationLineStyleType>({
                    items: LINE_STYLE_TYPE_ITEMS,
                    ariaLabel: this.ctx.localeManager.t('toolbarAnnotationsLineStyleType'),
                    value: lineStyle,
                    sourceEvent: event.sourceEvent,
                    onPress: (item) => this.onLineStyleTypeMenuPress(item, datum),
                    class: 'annotations__line-style-type',
                });
                break;
            case AnnotationOptions.LineStrokeWidth:
                const strokeWidth = hasLineStyle(datum) ? datum.strokeWidth : undefined;
                this.lineStrokeWidthMenu.show<number>({
                    items: LINE_STROKE_WIDTH_ITEMS,
                    ariaLabel: this.ctx.localeManager.t('toolbarAnnotationsLineStrokeWidth'),
                    value: strokeWidth,
                    sourceEvent: event.sourceEvent,
                    onPress: (item) => this.onLineStrokeWidthMenuPress(item, datum),
                    class: 'annotations__line-stroke-width',
                });
                break;
            case AnnotationOptions.LineColor:
            case AnnotationOptions.FillColor:
            case AnnotationOptions.TextColor:
                this.colorPicker.show({
                    color: datum?.getDefaultColor(event.value),
                    opacity: datum?.getDefaultOpacity(event.value),
                    onChange: datum != null ? this.onColorPickerChange.bind(this, event.value, datum) : undefined,
                });
                break;

            case AnnotationOptions.TextSize: {
                const fontSize = isTextType(datum) ? datum.fontSize : undefined;
                this.textSizeMenu.show<number>({
                    items: TEXT_SIZE_ITEMS,
                    ariaLabel: this.ctx.localeManager.t('toolbarAnnotationsTextSize'),
                    value: fontSize,
                    sourceEvent: event.sourceEvent,
                    onPress: (item) => this.onTextSizeMenuPress(item, datum),
                    class: 'ag-charts-annotations-text-size-menu',
                });
                break;
            }

            case AnnotationOptions.Delete:
                this.cancel();
                this.delete();
                this.reset();
                break;

            case AnnotationOptions.Lock: {
                annotationData[active].locked = !annotationData[active].locked;
                this.toggleAnnotationOptionsButtons();
                break;
            }

            case AnnotationOptions.Settings: {
                if (!LineProperties.is(datum)) break;
                this.settingsDialog.showLine(datum, {
                    onChangeText: (_text: string) => {
                        // TODO: AG-12600
                    },
                });
            }
        }

        this.update();
    }

    private onToolbarButtonPressMenu(
        event: _ModuleSupport.ToolbarButtonPressedEvent,
        ariaLabel: string,
        items: Array<MenuItem<AnnotationType>>
    ) {
        const { x, y, width } = event.rect;

        this.cancel();
        this.reset();

        this.annotationMenu.setAnchor({ x: x + width + 6, y });
        this.annotationMenu.show<AnnotationType>({
            items,
            ariaLabel: this.ctx.localeManager.t(ariaLabel),
            sourceEvent: event.sourceEvent,
            onPress: this.onAnnotationsMenuPress.bind(this, event),
        });
    }

    private onToolbarButtonPressAnnotation(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        this.ctx.tooltipManager.suppressTooltip('annotations');

        const annotation = stringToAnnotationType(event.value);
        if (annotation) {
            this.beginAnnotationPlacement(annotation);
        } else {
            _Util.Logger.errorOnce(`Can not create unknown annotation type [${event.value}], ignoring.`);
            this.update();
        }
    }

    private onToolbarButtonMoved(event: _ModuleSupport.ToolbarButtonMovedEvent) {
        const { group, rect, groupRect, value } = event;

        if (group !== 'annotationOptions') return;

        const anchor = { x: rect.x, y: rect.y + rect.height - 1 };

        switch (value as AnnotationOptions) {
            case AnnotationOptions.FillColor:
            case AnnotationOptions.LineColor:
            case AnnotationOptions.TextColor: {
                const colorPickerAnchor = Vec2.add(groupRect, Vec2.from(0, groupRect.height + 4));
                const fallback = { y: groupRect.y - 4 };
                this.colorPicker.setAnchor(colorPickerAnchor, fallback);
                break;
            }
            case AnnotationOptions.LineStrokeWidth: {
                this.lineStrokeWidthMenu.setAnchor(anchor);
                break;
            }
            case AnnotationOptions.LineStyleType: {
                this.lineStyleTypeMenu.setAnchor(anchor);
                break;
            }
            case AnnotationOptions.TextSize: {
                this.textSizeMenu.setAnchor(anchor);
                break;
            }
            default:
                break;
        }
    }

    private onColorPickerChange(
        colorPickerType: AnnotationOptionsColorPickerType,
        datum: AnnotationProperties,
        colorOpacity: string,
        color: string,
        opacity: number
    ) {
        this.state.transition('color', { colorPickerType, colorOpacity, color, opacity });
        this.defaultColors.get(datum.type)?.set(colorPickerType, [colorOpacity, color, opacity]);

        this.updateToolbarColorPickerFill(colorPickerType, colorOpacity);
    }

    private updateToolbarColorPickerFill(
        colorPickerType: AnnotationOptionsColorPickerType,
        color?: string,
        opacity?: number
    ) {
        if (color != null && opacity != null) {
            const { r, g, b } = _Util.Color.fromString(color);
            color = _Util.Color.fromArray([r, g, b, opacity]).toHexString();
        }
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
            datum?.getDefaultColor(AnnotationOptions.LineColor),
            datum?.getDefaultOpacity(AnnotationOptions.LineColor)
        );
        this.updateToolbarColorPickerFill(
            AnnotationOptions.FillColor,
            datum?.getDefaultColor(AnnotationOptions.FillColor),
            datum?.getDefaultOpacity(AnnotationOptions.FillColor)
        );
        this.updateToolbarColorPickerFill(
            AnnotationOptions.TextColor,
            datum?.getDefaultColor(AnnotationOptions.TextColor),
            datum?.getDefaultOpacity(AnnotationOptions.TextColor)
        );
    }

    private updateToolbarFontSize(fontSize: number | undefined) {
        this.ctx.toolbarManager.updateButton('annotationOptions', AnnotationOptions.TextSize, {
            label: fontSize != null ? String(fontSize) : undefined,
        });
    }

    private updateToolbarLineStyleType(item: MenuItem<AnnotationLineStyleType>) {
        this.ctx.toolbarManager.updateButton('annotationOptions', AnnotationOptions.LineStyleType, {
            icon: item.icon,
        });
    }

    private updateToolbarStrokeWidth(item: MenuItem<number>) {
        this.ctx.toolbarManager.updateButton('annotationOptions', AnnotationOptions.LineStrokeWidth, {
            label: item.label,
            strokeWidth: item.value,
        });
    }

    private onTextSizeMenuPress(item: MenuItem<number>, datum?: AnnotationProperties) {
        const fontSize = item.value;
        if (isTextType(datum)) {
            this.defaultFontSizes.set(datum.type, fontSize);
        }

        this.state.transition('fontSize', fontSize);
        this.textSizeMenu.hide();

        this.updateToolbarFontSize(fontSize);
    }

    private onLineStyleTypeMenuPress(item: MenuItem<AnnotationLineStyleType>, datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) {
            return;
        }

        const type = item.value;

        const defaultStyle = this.defaultLineStyles.get(datum.type);
        if (defaultStyle) {
            defaultStyle.type = type;
        } else {
            this.defaultLineStyles.set(datum.type, { type: type });
        }

        this.state.transition('lineStyle', { type });
        this.lineStyleTypeMenu.hide();

        this.updateToolbarLineStyleType(item);
    }

    private onLineStrokeWidthMenuPress(item: MenuItem<number>, datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) {
            return;
        }

        const strokeWidth = item.value;

        const defaultStyle = this.defaultLineStyles.get(datum.type);
        if (defaultStyle) {
            defaultStyle.strokeWidth = strokeWidth;
        } else {
            this.defaultLineStyles.set(datum.type, { strokeWidth });
        }

        this.state.transition('lineStyle', { strokeWidth });
        this.lineStrokeWidthMenu.hide();

        this.updateToolbarStrokeWidth(item);
    }

    private onAnnotationsMenuPress(
        event: _ModuleSupport.ToolbarButtonPressedEvent<AgToolbarAnnotationsButtonValue>,
        item: MenuItem<AnnotationType>
    ) {
        const { toolbarManager, domManager } = this.ctx;

        domManager.focus();

        toolbarManager.toggleButton('annotations', event.id, {
            active: true,
        });
        toolbarManager.updateButton('annotations', event.id, {
            icon: item.icon,
        });

        this.beginAnnotationPlacement(item.value);
        this.annotationMenu.hide();

        this.removeAmbientKeyboardListener?.();
        this.removeAmbientKeyboardListener = this.ctx.interactionManager.addListener(
            'keydown',
            (e) => this.handleAmbientKeyboardEvent(e),
            InteractionState.All
        );
    }

    private handleAmbientKeyboardEvent(e: _ModuleSupport.KeyInteractionEvent<'keydown'>) {
        if (e.sourceEvent.key !== 'Escape') return;

        this.cancelPlacementInteraction();

        e.preventDefault();
        e.sourceEvent.stopPropagation();

        this.removeAmbientKeyboardListener?.();
        this.removeAmbientKeyboardListener = undefined;
    }

    private onToolbarCancelled(event: _ModuleSupport.ToolbarCancelledEvent) {
        if (event.group === 'annotations') {
            this.cancelPlacementInteraction();
        }
    }

    private cancelPlacementInteraction() {
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
    }

    private onPreRender() {
        this.updateAnnotations();
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

    private onHover(event: _ModuleSupport.RegionEvent<'hover'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        const point = invertCoords(offset, context);

        state.transition('hover', { offset, point });
    }

    private onClick(event: _ModuleSupport.RegionEvent<'click'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
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

    private onDragStart(event: _ModuleSupport.RegionEvent<'drag-start'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        state.transition('dragStart', { context, offset });
    }

    private onDrag(event: _ModuleSupport.RegionEvent<'drag'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        const point = invertCoords(offset, context);
        state.transition('drag', { context, offset, point });
    }

    private onDragEnd(_event: _ModuleSupport.RegionEvent<'drag-end'>) {
        this.state.transition('dragEnd');
    }

    private onCancel() {
        this.cancel();
        this.reset();
    }

    private onDelete() {
        this.cancel();
        this.delete();
        this.reset();
        this.update();
    }

    private onKeyDown(event: _ModuleSupport.KeyInteractionEvent<'keydown'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const { key, shiftKey } = event.sourceEvent;
        const textInputValue = this.textInput.getValue();

        state.transition('keyDown', { key, shiftKey, textInputValue });
    }

    private beginAnnotationPlacement(annotation: AnnotationType) {
        this.cancel();

        this.ctx.interactionManager.pushState(InteractionState.Annotations);
        this.state.transition(annotation);

        this.update();
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

        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.LineStyleType, {
            enabled: !locked,
            visible: hasLineStyle(datum),
        });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.LineStrokeWidth, {
            enabled: !locked,
            visible: hasLineStyle(datum),
        });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.LineColor, {
            enabled: !locked,
            visible: hasLineColor(datum),
        });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.TextColor, {
            enabled: !locked,
            visible: hasTextColor(datum),
        });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.FillColor, {
            enabled: !locked,
            visible: hasFillColor(datum),
        });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.TextSize, {
            enabled: !locked,
            visible: hasFontSize(datum),
        });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.Settings, {
            enabled: !locked,
            visible: LineProperties.is(datum),
        });

        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.Delete, { enabled: !locked });
        toolbarManager.toggleButton('annotationOptions', AnnotationOptions.Lock, { checked: locked });

        toolbarManager.updateGroup('annotationOptions');

        this.updateToolbarFontSize(datum != null && 'fontSize' in datum ? datum.fontSize : undefined);
        this.updateToolbarFills();
        this.updateToolbarLineStyles(datum);
    }

    updateToolbarLineStyles(datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) {
            return;
        }
        const strokeWidth = datum.strokeWidth ?? 1;
        const lineStyleType = getLineStyle(datum.lineDash, datum.lineStyle);

        this.updateToolbarStrokeWidth({
            strokeWidth,
            value: strokeWidth,
            label: String(strokeWidth),
        });

        this.updateToolbarLineStyleType(
            LINE_STYLE_TYPE_ITEMS.find((item) => item.value === lineStyleType) ?? LINE_STYLE_TYPE_ITEMS[0]
        );
    }

    private clear() {
        this.cancel();
        this.deleteAll();
        this.reset();
    }

    private reset() {
        this.state.transition('reset');
    }

    private cancel() {
        this.state.transition('cancel');
    }

    private delete() {
        this.state.transition('delete');
    }

    private deleteAll() {
        this.state.transition('deleteAll');
    }

    private hideOverlays() {
        this.colorPicker.hide();
        this.textSizeMenu.hide();
        this.lineStyleTypeMenu.hide();
        this.lineStrokeWidthMenu.hide();
        this.annotationMenu.hide();
        this.settingsDialog.hide();
    }

    private resetToolbarButtonStates() {
        const {
            ctx: { toolbarManager },
        } = this;

        for (const annotationType of ANNOTATION_BUTTONS) {
            toolbarManager.toggleButton('annotations', annotationType, { active: false });
        }

        for (const annotationGroup of ANNOTATION_BUTTON_GROUPS) {
            toolbarManager.toggleButton('annotations', annotationGroup, { active: false });
        }
    }

    private update(status = ChartUpdateType.PRE_SCENE_RENDER) {
        this.ctx.updateService.update(status, { skipAnimations: true });
    }
}
