import {
    type AgAnnotationLineStyleType,
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
import { AnnotationDefaults } from './annotationDefaults';
import type {
    AnnotationContext,
    AnnotationOptionsColorPickerType,
    ChannelAnnotationType,
    Coords,
    HasFontSizeAnnotationType,
    LineAnnotationType,
    Point,
} from './annotationTypes';
import {
    ANNOTATION_BUTTONS,
    ANNOTATION_BUTTON_GROUPS,
    AnnotationType,
    stringToAnnotationType,
} from './annotationTypes';
import { annotationConfigs, getTypedDatum } from './annotationsConfig';
import { LINE_STROKE_WIDTH_ITEMS, LINE_STYLE_TYPE_ITEMS, TEXT_SIZE_ITEMS } from './annotationsMenuOptions';
import { AnnotationsStateMachine } from './annotationsStateMachine';
import type { AnnotationProperties, AnnotationScene } from './annotationsSuperTypes';
import { AxisButton, DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS } from './axisButton';
import { AnnotationSettingsDialog } from './settings-dialog/settingsDialog';
import { calculateAxisLabelPadding } from './utils/axis';
import { snapToAngle } from './utils/coords';
import { hasFillColor, hasFontSize, hasLineColor, hasLineStyle, hasLineText, hasTextColor } from './utils/has';
import { getLineStyle } from './utils/line';
import { isChannelType, isLineType, isTextType } from './utils/types';
import { updateAnnotation } from './utils/update';
import { validateDatumPoint } from './utils/validation';
import { convertPoint, invertCoords } from './utils/values';

const {
    BOOLEAN,
    ChartUpdateType,
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
    { label: 'toolbarAnnotationsArrowUp', icon: 'arrow-up-drawing', value: AnnotationType.ArrowUp },
    { label: 'toolbarAnnotationsArrowDown', icon: 'arrow-down-drawing', value: AnnotationType.ArrowDown },
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
    private readonly annotationData: AnnotationPropertiesArray = new PropertiesArray<AnnotationProperties>(
        this.createAnnotationDatum
    );
    private readonly defaults = new AnnotationDefaults();

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

        // Add originators to the history only when this module is enabled to prevent memory increases
        this.ctx.historyManager.addMementoOriginator(ctx.annotationManager);
        this.ctx.historyManager.addMementoOriginator(this.defaults);
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

            translate: (index: number, translation: Coords) => {
                const node = this.annotations.at(index);
                const datum = getTypedDatum(this.annotationData.at(index));
                if (!node || !datum) {
                    return;
                }

                return this.translateNode({ node, datum, translation });
            },

            copy: (index: number) => {
                const node = this.annotations.at(index);
                const datum = getTypedDatum(this.annotationData.at(index));
                if (!node || !datum) {
                    return;
                }

                return this.createAnnotationDatumCopy({ node, datum });
            },

            paste: (datum: AnnotationProperties) => {
                this.createAnnotation(datum.type, datum, false);

                this.postUpdateFns.push(() => {
                    this.state.transitionAsync('selectLast');
                    this.state.transitionAsync('copy');
                });
            },

            select: (index?: number, previous?: number) => {
                const {
                    annotations,
                    ctx: { toolbarManager, tooltipManager },
                } = this;

                this.hideOverlays();

                const selectedNode = index != null ? annotations.at(index) : null;
                const previousNode = previous != null ? annotations.at(previous) : null;

                // Only change anything else if a different node has been selected or when deselecting
                if (previousNode === selectedNode && selectedNode != null) {
                    return;
                }

                // Deselect the previous node
                previousNode?.toggleActive(false);

                // Hide the annotation options so it has time to update before being shown again
                toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: false });

                if (selectedNode) {
                    selectedNode.toggleActive(true);
                    tooltipManager.suppressTooltip('annotations');
                    this.toggleAnnotationOptionsButtons();
                    this.postUpdateFns.push(() => {
                        // Set the annotation options to be visible _before_ setting the anchor to ensure the toolbar
                        // element has a width and height that it can use in the anchor calculations.
                        toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: true });
                        toolbarManager.changeFloatingAnchor('annotationOptions', selectedNode.getAnchor());
                    });
                } else {
                    tooltipManager.unsuppressTooltip('annotations');
                }

                // Reset the icons on the annotation toolbars
                toolbarManager.updateButton('annotations', 'line-menu', { icon: undefined });
                toolbarManager.updateButton('annotations', 'text-menu', { icon: undefined });
                toolbarManager.updateButton('annotations', 'shape-menu', { icon: undefined });

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
                this.createAnnotation(type, datum);
            },

            delete: (index: number) => {
                this.annotationData.splice(index, 1);
            },

            deleteAll: () => {
                this.annotationData.splice(0, this.annotationData.length);
            },

            validatePoint: (point: Point) => {
                const context = this.getAnnotationContext();
                return context ? validateDatumPoint(context, point) : true;
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

            recordAction: (label: string) => {
                this.recordActionAfterNextUpdate(label);
            },

            update: () => {
                this.postUpdateFns.push(() => {
                    const active = this.state.getActive();
                    const node = active != null ? this.annotations.at(active) : null;
                    if (node == null) return;
                    ctx.toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
                });
                this.update();
            },

            showTextInput: (active: number) => {
                const datum = getTypedDatum(this.annotationData.at(active));
                const node = this.annotations.at(active);
                if (!node || !datum || !('getTextInputCoords' in datum) || !('getTextPosition' in datum)) return;

                const styles = {
                    color: datum.color,
                    fontFamily: datum.fontFamily,
                    fontSize: datum.fontSize,
                    fontStyle: datum.fontStyle,
                    fontWeight: datum.fontWeight,
                    placeholderColor: datum.getPlaceholderColor(),
                };

                const context = this.getAnnotationContext()!;

                const getTextInputCoords = (height: number) =>
                    Vec2.add(datum.getTextInputCoords(context, height), Vec2.required(this.seriesRect));

                const getTextPosition = () => datum.getTextPosition();

                this.textInput.show({
                    styles,
                    layout: {
                        getTextInputCoords,
                        getTextPosition: getTextPosition,
                        alignment: datum.alignment,
                        textAlign: datum.textAlign,
                        width: datum.width,
                    },
                    text: datum.text,
                    placeholderText: datum.placeholderText,
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

                this.toggleAnnotationOptionsButtons();
                ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: true });
                ctx.toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
            },

            showAnnotationSettings: (active: number, sourceEvent?: Event) => {
                const datum = this.annotationData.at(active);
                if (!isLineType(datum) && !isChannelType(datum)) return;
                this.settingsDialog.showLineOrChannel(datum, {
                    ariaLabel: this.ctx.localeManager.t('ariaLabelAnnotationSettingsDialog'),
                    sourceEvent,
                    onChangeLine: (props) => {
                        this.state.transition('lineProps', props);
                    },
                    onChangeText: (props) => {
                        this.state.transition('lineText', props);
                        if (props.alignment) this.defaults.setDefaultLineTextAlignment(datum.type, props.alignment);
                        if (props.position) this.defaults.setDefaultLineTextPosition(datum.type, props.position);
                        this.recordActionAfterNextUpdate(
                            `Change ${datum.type} text ${Object.entries(props)
                                .map(([key, value]) => `${key} to ${value}`)
                                .join(', ')}`
                        );
                    },
                    onChangeLineColor: (colorOpacity, color, opacity) => {
                        this.setColorAndDefault(datum.type, 'line-color', colorOpacity, color, opacity);
                        this.updateToolbarColorPickerFill('line-color', color, opacity);
                    },
                    onChangeHideLineColor: () => {
                        this.recordActionAfterNextUpdate(
                            `Change ${datum.type} line-color to ${datum.getDefaultColor('line-color')}`,
                            ['annotations', 'defaults']
                        );
                        this.update();
                    },
                    onChangeLineStyleType: (lineStyleType: AgAnnotationLineStyleType) => {
                        this.setLineStyleTypeAndDefault(datum.type, lineStyleType);
                        this.updateToolbarLineStyleType(
                            LINE_STYLE_TYPE_ITEMS.find((item) => item.value === lineStyleType) ??
                                LINE_STYLE_TYPE_ITEMS[0]
                        );
                    },
                    onChangeLineStyleWidth: (strokeWidth: number) => {
                        this.setLineStyleWidthAndDefault(datum.type, strokeWidth);
                        this.updateToolbarStrokeWidth({ strokeWidth, value: strokeWidth, label: String(strokeWidth) });
                    },
                    onChangeTextColor: (colorOpacity, color, opacity) => {
                        this.setColorAndDefault(datum.type, 'text-color', colorOpacity, color, opacity);
                        this.updateToolbarColorPickerFill('text-color', color, opacity);
                    },
                    onChangeHideTextColor: () => {
                        this.recordActionAfterNextUpdate(
                            `Change ${datum.type} text-color to ${datum.getDefaultColor('text-color')}`,
                            ['annotations', 'defaults']
                        );
                        this.update();
                    },
                    onChangeTextFontSize: (fontSize: number) => {
                        this.setFontSizeAndDefault(datum.type, fontSize);
                    },
                });
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
            seriesRegion.addListener('hover', this.onHover.bind(this), All),
            seriesRegion.addListener('click', this.onClick.bind(this), All),
            seriesRegion.addListener('dblclick', this.onDoubleClick.bind(this), All),
            seriesRegion.addListener('drag-start', this.onDragStart.bind(this), Default | ZoomDrag | AnnotationsState),
            seriesRegion.addListener('drag', this.onDrag.bind(this), Default | ZoomDrag | AnnotationsState),
            seriesRegion.addListener('drag-end', this.onDragEnd.bind(this), All),
            ctx.keyNavManager.addListener('cancel', this.onCancel.bind(this), Default | AnnotationsState),
            ctx.keyNavManager.addListener('delete', this.onDelete.bind(this), Default | AnnotationsState),
            ctx.interactionManager.addListener('keydown', this.onTextInput.bind(this), AnnotationsState),
            ctx.interactionManager.addListener('keydown', this.onKeyDown.bind(this), All),
            ctx.interactionManager.addListener('keyup', this.onKeyUp.bind(this), All),
            ...otherRegions.map((region) => region.addListener('click', this.onCancel.bind(this), All)),

            // Services
            ctx.annotationManager.addListener('restore-annotations', this.onRestoreAnnotations.bind(this)),
            ctx.toolbarManager.addListener('button-pressed', this.onToolbarButtonPress.bind(this)),
            ctx.toolbarManager.addListener('button-moved', this.onToolbarButtonMoved.bind(this)),
            ctx.toolbarManager.addListener('group-moved', this.onToolbarGroupMoved.bind(this)),
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
        return new annotationConfigs[datum.type].scene();
    }

    private createAnnotationDatum(params: { type: AnnotationType }) {
        if (params.type in annotationConfigs) {
            return new annotationConfigs[params.type].datum().set(params);
        }
        throw new Error(
            `AG Charts - Cannot set property of unknown type [${params.type}], expected one of [${Object.keys(annotationConfigs)}], ignoring.`
        );
    }

    private translateNode({
        node,
        datum,
        translation,
    }: {
        node: AnnotationScene;
        datum: AnnotationProperties;
        translation: Coords;
    }): AnnotationProperties | undefined {
        const config = this.getAnnotationConfig(datum);

        const context = this.getAnnotationContext();
        if (!context) {
            return;
        }

        config.translate(node, datum, translation, context);
    }

    private createAnnotationDatumCopy({
        node,
        datum,
    }: {
        node: AnnotationScene;
        datum: AnnotationProperties;
    }): AnnotationProperties | undefined {
        const config = this.getAnnotationConfig(datum);

        const newDatum = new config.datum();
        newDatum.set(datum.toJson());

        const context = this.getAnnotationContext();
        if (!context) {
            return;
        }

        return config.copy(node, datum, newDatum, context);
    }

    private getAnnotationConfig(datum: AnnotationProperties) {
        const { type } = datum;

        if (!(type in annotationConfigs)) {
            throw new Error(
                `AG Charts - Cannot set property of unknown type [${type}], expected one of [${Object.keys(annotationConfigs)}], ignoring.`
            );
        }

        return annotationConfigs[type];
    }

    private createAnnotation(type: AnnotationType, datum: AnnotationProperties, applyDefaults: boolean = true) {
        this.annotationData.push(datum);

        if (applyDefaults) {
            const styles = this.ctx.annotationManager.getAnnotationTypeStyles(type);
            if (styles) datum.set(styles);
            this.defaults.applyDefaults(datum);
        }

        if ('setLocaleManager' in datum) datum.setLocaleManager(this.ctx.localeManager);

        this.resetToolbarButtonStates();

        this.removeAmbientKeyboardListener?.();
        this.removeAmbientKeyboardListener = undefined;

        this.update();
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
            this.recordActionAfterNextUpdate('Clear all annotations');
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
        const node = this.annotations.at(active);

        switch (event.value) {
            case AnnotationOptions.LineStyleType: {
                const lineStyle = hasLineStyle(datum) ? getLineStyle(datum.lineDash, datum.lineStyle) : undefined;
                this.lineStyleTypeMenu.show<AgAnnotationLineStyleType>({
                    items: LINE_STYLE_TYPE_ITEMS,
                    ariaLabel: this.ctx.localeManager.t('toolbarAnnotationsLineStyle'),
                    value: lineStyle,
                    sourceEvent: event.sourceEvent,
                    onPress: (item) => this.onLineStyleTypeMenuPress(item, datum),
                    class: 'annotations__line-style-type',
                });
                break;
            }

            case AnnotationOptions.LineStrokeWidth: {
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
            }

            case AnnotationOptions.LineColor:
            case AnnotationOptions.FillColor:
            case AnnotationOptions.TextColor: {
                this.colorPicker.show({
                    color: datum?.getDefaultColor(event.value),
                    opacity: datum?.getDefaultOpacity(event.value),
                    sourceEvent: event.sourceEvent,
                    onChange: datum != null ? this.onColorPickerChange.bind(this, event.value, datum) : undefined,
                    onChangeHide: ((type: AnnotationOptionsColorPickerType) => {
                        this.recordActionAfterNextUpdate(
                            `Change ${node?.type} ${event.value} to ${datum?.getDefaultColor(type)}`,
                            ['annotations', 'defaults']
                        );
                    }).bind(this, event.value),
                });
                break;
            }

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

            case AnnotationOptions.Delete: {
                this.cancel();
                this.delete();
                this.reset();
                break;
            }

            case AnnotationOptions.Lock: {
                annotationData[active].locked = !annotationData[active].locked;
                this.toggleAnnotationOptionsButtons();
                break;
            }

            case AnnotationOptions.Settings: {
                state.transition('toolbarPressSettings', event.sourceEvent);
                break;
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

    private onToolbarGroupMoved(_event: _ModuleSupport.ToolbarGroupMovedEvent) {
        this.hideOverlays();
    }

    private onColorPickerChange(
        colorPickerType: AnnotationOptionsColorPickerType,
        datum: AnnotationProperties,
        colorOpacity: string,
        color: string,
        opacity: number
    ) {
        this.setColorAndDefault(datum.type, colorPickerType, colorOpacity, color, opacity);
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

    private updateToolbarLineStyleType(item: MenuItem<AgAnnotationLineStyleType>) {
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
        if (!hasFontSize(datum)) return;

        const fontSize = item.value;
        this.setFontSizeAndDefault(datum.type, fontSize);
        this.textSizeMenu.hide();
        this.updateToolbarFontSize(fontSize);
    }

    private onLineStyleTypeMenuPress(item: MenuItem<AgAnnotationLineStyleType>, datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) return;

        const type = item.value;
        this.setLineStyleTypeAndDefault(datum.type, type);
        this.lineStyleTypeMenu.hide();
        this.updateToolbarLineStyleType(item);
    }

    private onLineStrokeWidthMenuPress(item: MenuItem<number>, datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) {
            return;
        }

        const strokeWidth = item.value;
        this.setLineStyleWidthAndDefault(datum.type, strokeWidth);
        this.lineStrokeWidthMenu.hide();
        this.updateToolbarStrokeWidth(item);
    }

    private onAnnotationsMenuPress(
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

    private recordActionAfterNextUpdate(label: string, types: Array<'annotations' | 'defaults'> = ['annotations']) {
        const {
            defaults,
            ctx: { annotationManager, historyManager },
        } = this;

        const originators = types.map((type) => (type === 'defaults' ? defaults : annotationManager));
        this.postUpdateFns.push(() => {
            historyManager.record(label, ...originators);
        });
    }

    private setColorAndDefault(
        datumType: AnnotationType,
        colorPickerType: AnnotationOptionsColorPickerType,
        colorOpacity: string,
        color: string,
        opacity: number
    ) {
        this.state.transition('color', { colorPickerType, colorOpacity, color, opacity });
        this.defaults.setDefaultColor(datumType, colorPickerType, colorOpacity, color, opacity);
    }

    private setFontSizeAndDefault(datumType: HasFontSizeAnnotationType, fontSize: number) {
        this.state.transition('fontSize', fontSize);
        this.defaults.setDefaultFontSize(datumType, fontSize);
        this.recordActionAfterNextUpdate(`Change ${datumType} font size to ${fontSize}`, ['annotations', 'defaults']);
    }

    private setLineStyleTypeAndDefault(
        datumType: LineAnnotationType | ChannelAnnotationType,
        styleType: AgAnnotationLineStyleType
    ) {
        this.state.transition('lineStyle', { type: styleType });
        this.defaults.setDefaultLineStyleType(datumType, styleType);
        this.recordActionAfterNextUpdate(`Change ${datumType} line style to ${styleType}`, ['annotations', 'defaults']);
    }

    private setLineStyleWidthAndDefault(datumType: LineAnnotationType | ChannelAnnotationType, strokeWidth: number) {
        this.state.transition('lineStyle', { strokeWidth });
        this.defaults.setDefaultLineStyleWidth(datumType, strokeWidth);
        this.recordActionAfterNextUpdate(`Change ${datumType} stroke width to ${strokeWidth}`, [
            'annotations',
            'defaults',
        ]);
    }

    private updateAnnotations() {
        const {
            annotationData,
            annotations,
            seriesRect,
            ctx: { annotationManager, toolbarManager },
        } = this;

        const context = this.getAnnotationContext();
        if (!seriesRect || !context) {
            return;
        }

        annotationManager.updateData(annotationData.toJson() as any);

        const clearAllEnabled = annotationData.length > 0;
        toolbarManager.toggleButton('annotations', 'clear', { enabled: clearAllEnabled });

        annotations
            .update(annotationData ?? [], undefined, (datum) => datum.id)
            .each((node, datum) => {
                if (!this.validateDatum(datum)) {
                    node.visible = false;
                    return;
                }

                updateAnnotation(node, datum, context);
            });

        this.postUpdateFns.forEach((fn) => fn());
        this.postUpdateFns = [];
    }

    private postUpdateFns: Array<() => void> = [];

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

        const shiftKey = (event.sourceEvent as MouseEvent).shiftKey;

        const offset = Vec2.from(event);
        const point = (origin?: Point, angleStep: number = 1) =>
            shiftKey
                ? invertCoords(
                      snapToAngle(offset, origin ? convertPoint(origin, context) : Vec2.origin(), angleStep),
                      context
                  )
                : invertCoords(offset, context);

        state.transition('hover', { offset, point });
    }

    private onClick(event: _ModuleSupport.RegionEvent<'click'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        const point = () => invertCoords(offset, context);
        const textInputValue = this.textInput.getValue();

        state.transition('click', { offset, point, textInputValue });
    }

    private onDoubleClick() {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        state.transition('dblclick');
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

        const point = () => invertCoords(coords, context);

        if (!validateDatumPoint(context, point())) {
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
        const point = () => invertCoords(offset, context);

        state.transition('drag', { context, offset, point });
    }

    private onDragEnd() {
        this.state.transition('dragEnd');
    }

    private onCancel() {
        this.cancel();
        this.reset();
    }

    private onDelete() {
        this.delete();
        this.update();
    }

    private onTextInput(event: _ModuleSupport.KeyInteractionEvent<'keydown'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const { key, shiftKey } = event.sourceEvent;
        const textInputValue = this.textInput.getValue();

        state.transition('keyDown', { key, shiftKey, textInputValue });
    }

    private onKeyDown(event: _ModuleSupport.KeyInteractionEvent<'keydown'>) {
        const { state } = this;
        const context = this.getAnnotationContext();

        const { sourceEvent } = event;
        const { shiftKey, ctrlKey, metaKey } = sourceEvent;
        const ctrlMeta = ctrlKey || metaKey;
        const ctrlShift = ctrlKey || shiftKey;

        this.state.transition('keyDown', { shiftKey });

        const translation = { x: 0, y: 0 };

        const xStep = Math.max(context?.xAxis.scaleBandwidth() ?? 0, ctrlShift ? 10 : 1);
        const yStep = Math.max(context?.yAxis.scaleBandwidth() ?? 0, ctrlShift ? 10 : 1);
        switch (sourceEvent.key) {
            case 'ArrowDown':
                translation.y = yStep;
                break;
            case 'ArrowUp':
                translation.y = -yStep;
                break;
            case 'ArrowLeft':
                translation.x = -xStep;
                break;
            case 'ArrowRight':
                translation.x = xStep;
                break;
        }

        if (translation.x || translation.y) {
            state.transition('translate', { translation, context });
        }

        if (!ctrlMeta) {
            return;
        }

        switch (sourceEvent.key) {
            case 'c':
                state.transition('copy');
                return;
            case 'x':
                state.transition('cut');
                this.recordActionAfterNextUpdate('Cut annotation');
                return;
            case 'v':
                state.transition('paste');
                this.recordActionAfterNextUpdate('Paste annotation');
                return;
        }
    }

    private onKeyUp(event: _ModuleSupport.KeyInteractionEvent<'keyup'>) {
        const { shiftKey } = event.sourceEvent;

        this.state.transition('keyUp', { shiftKey });
        this.state.transition('translateEnd');
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
            visible: hasLineText(datum),
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
        this.colorPicker.hide({ lastFocus: null });
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
