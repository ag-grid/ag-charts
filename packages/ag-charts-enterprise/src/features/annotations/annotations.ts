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
import { AxesButtons } from './annotationAxesButtons';
import { AnnotationDefaults } from './annotationDefaults';
import type {
    AnnotationContext,
    AnnotationOptionsColorPickerType,
    HasFontSizeAnnotationType,
    HasLineStyleAnnotationType,
    Point,
} from './annotationTypes';
import {
    ANNOTATION_BUTTONS,
    ANNOTATION_BUTTON_GROUPS,
    AnnotationType,
    stringToAnnotationType,
} from './annotationTypes';
import { annotationConfigs, getTypedDatum } from './annotationsConfig';
import {
    AnnotationOptions,
    LINE_ANNOTATION_ITEMS,
    LINE_STROKE_WIDTH_ITEMS,
    LINE_STYLE_TYPE_ITEMS,
    MEASURER_ANNOTATION_ITEMS,
    SHAPE_ANNOTATION_ITEMS,
    TEXT_ANNOTATION_ITEMS,
    TEXT_SIZE_ITEMS,
} from './annotationsMenuOptions';
import { AnnotationsStateMachine } from './annotationsStateMachine';
import type { AnnotationProperties, AnnotationScene } from './annotationsSuperTypes';
import { AxisButton, DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS } from './axisButton';
import { AnnotationSettingsDialog, type LinearSettingsDialogOptions } from './settings-dialog/settingsDialog';
import { calculateAxisLabelPadding } from './utils/axis';
import { snapToAngle } from './utils/coords';
import { hasFillColor, hasFontSize, hasLineColor, hasLineStyle, hasLineText, hasTextColor } from './utils/has';
import { getLineStyle } from './utils/line';
import { isChannelType, isEphemeralType, isLineType, isMeasurerType, isTextType } from './utils/types';
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
    ChartAxisDirection,
    Vec2,
    isValidDate,
    keyProperty,
    valueProperty,
} = _ModuleSupport;

type AnnotationPropertiesArray = _ModuleSupport.PropertiesArray<AnnotationProperties>;

type AnnotationAxis = {
    layout: _ModuleSupport.AxisLayout;
    context: _ModuleSupport.AxisContext;
    bounds: _Scene.BBox;
    button?: AxisButton;
};

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

    // Hidden options for use with measurer statistics
    public data?: any[] = undefined;
    public xKey?: string = undefined;
    public volumeKey?: string = undefined;

    // State
    private readonly state: AnnotationsStateMachine;
    private readonly annotationData: AnnotationPropertiesArray = new PropertiesArray<AnnotationProperties>(
        this.createAnnotationDatum
    );
    private readonly defaults = new AnnotationDefaults();
    private dataModel?: _ModuleSupport.DataModel<any, any>;
    private processedData?: _ModuleSupport.ProcessedData<any>;
    private hoverCoords?: _ModuleSupport.Vec2;

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

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        this.state = this.setupStateMachine();
        this.setupListeners();

        // Add originators to the history only when this module is enabled to prevent memory increases
        this.ctx.historyManager.addMementoOriginator(ctx.annotationManager);
        this.ctx.historyManager.addMementoOriginator(this.defaults);
        this.textInput.setKeyDownHandler(this.onTextInput.bind(this));
    }

    private setupStateMachine() {
        const { ctx } = this;

        return new AnnotationsStateMachine({
            resetToIdle: () => {
                ctx.cursorManager.updateCursor('annotations');
                ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: false });
                ctx.tooltipManager.unsuppressTooltip('annotations');
                this.hideOverlays();
                this.deleteEphemeralAnnotations();
                this.resetToolbarButtonStates();
                this.toggleAnnotationOptionsButtons();
                this.update();
            },

            hoverAtCoords: (coords: _ModuleSupport.Vec2, active?: number) => {
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

            getHoverCoords: () => {
                return this.hoverCoords;
            },

            getNodeAtCoords: (coords: _ModuleSupport.Vec2, active: number) => {
                const node = this.annotations.at(active);

                if (!node) {
                    return;
                }

                return node.getNodeAtCoords(coords.x, coords.y);
            },

            translate: (index: number, translation: _ModuleSupport.Vec2) => {
                const node = this.annotations.at(index);
                const datum = getTypedDatum(this.annotationData.at(index));
                if (!node || !datum) {
                    return;
                }

                return this.translateNode(node, datum, translation);
            },

            copy: (index: number) => {
                const node = this.annotations.at(index);
                const datum = getTypedDatum(this.annotationData.at(index));
                if (!node || !datum) {
                    return;
                }

                return this.createAnnotationDatumCopy(node, datum);
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
                    this.ctx.interactionManager.pushState(InteractionState.AnnotationsSelected);
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
                    this.ctx.interactionManager.popState(InteractionState.AnnotationsSelected);
                    this.ctx.interactionManager.popState(InteractionState.Annotations);
                    tooltipManager.unsuppressTooltip('annotations');
                }

                // Reset the icons on the annotation toolbars
                toolbarManager.updateButton('annotations', 'line-menu', { icon: undefined });
                toolbarManager.updateButton('annotations', 'text-menu', { icon: undefined });
                toolbarManager.updateButton('annotations', 'shape-menu', { icon: undefined });
                toolbarManager.updateButton('annotations', 'measurer-menu', { icon: undefined });

                this.deleteEphemeralAnnotations();
                this.update();
            },

            selectLast: () => {
                this.ctx.interactionManager.pushState(InteractionState.AnnotationsSelected);
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

            addPostUpdateFns: (...fns: (() => void)[]) => {
                this.postUpdateFns.push(...fns);
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

                this.ctx.cursorManager.updateCursor('annotations', undefined);
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
                if (!node || isEphemeralType(this.annotationData.at(active))) return;

                this.toggleAnnotationOptionsButtons();
                ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible: true });
                ctx.toolbarManager.changeFloatingAnchor('annotationOptions', node.getAnchor());
            },

            showAnnotationSettings: (active: number, sourceEvent?: Event, initialTab: 'line' | 'text' = 'line') => {
                const datum = this.annotationData.at(active);

                if (!isLineType(datum) && !isChannelType(datum) && !isMeasurerType(datum)) return;
                if (isEphemeralType(datum)) return;

                const onChangeColor =
                    (colorType: AnnotationOptionsColorPickerType) =>
                    (colorOpacity: string, color: string, opacity: number) => {
                        this.setColorAndDefault(datum.type, colorType, colorOpacity, color, opacity);
                        this.updateToolbarColorPickerFill(colorType, color, opacity);
                    };
                const onChangeHideColor = (colorType: AnnotationOptionsColorPickerType) => () => {
                    this.recordActionAfterNextUpdate(
                        `Change ${datum.type} ${colorType} to ${datum.getDefaultColor(colorType)}`,
                        ['annotations', 'defaults']
                    );
                    this.update();
                };

                const options: LinearSettingsDialogOptions = {
                    initialSelectedTab: initialTab,
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
                    onChangeFillColor: onChangeColor('fill-color'),
                    onChangeHideFillColor: onChangeHideColor('fill-color'),
                    onChangeLineColor: onChangeColor('line-color'),
                    onChangeHideLineColor: onChangeHideColor('line-color'),
                    onChangeLineStyleType: (lineStyleType) => {
                        this.setLineStyleTypeAndDefault(datum.type, lineStyleType);
                        this.updateToolbarLineStyleType(
                            LINE_STYLE_TYPE_ITEMS.find((item) => item.value === lineStyleType) ??
                                LINE_STYLE_TYPE_ITEMS[0]
                        );
                    },
                    onChangeLineStyleWidth: (strokeWidth) => {
                        this.setLineStyleWidthAndDefault(datum.type, strokeWidth);
                        this.updateToolbarStrokeWidth({ strokeWidth, value: strokeWidth, label: String(strokeWidth) });
                    },
                    onChangeTextColor: onChangeColor('text-color'),
                    onChangeHideTextColor: onChangeHideColor('text-color'),
                    onChangeTextFontSize: (fontSize) => {
                        this.setFontSizeAndDefault(datum.type, fontSize);
                    },
                };

                this.settingsDialog.show(datum, options);
            },
        });
    }

    private setupListeners() {
        const { ctx } = this;
        const { All, Default, Annotations: AnnotationsState, AnnotationsSelected, ZoomDrag } = InteractionState;

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

        const annotationsState = Default | ZoomDrag | AnnotationsState | AnnotationsSelected;

        this.destroyFns.push(
            // Interactions
            seriesRegion.addListener('hover', this.onHover.bind(this), All),
            seriesRegion.addListener('click', this.onClick.bind(this), All),
            seriesRegion.addListener('dblclick', this.onDoubleClick.bind(this), All),
            seriesRegion.addListener('drag-start', this.onDragStart.bind(this), annotationsState),
            seriesRegion.addListener('drag', this.onDrag.bind(this), annotationsState),
            seriesRegion.addListener('drag-end', this.onDragEnd.bind(this), All),
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
            ctx.zoomManager.addListener('zoom-change', () => this.onZoomChange()),

            // DOM
            ctx.annotationManager.attachNode(this.container),
            () => this.colorPicker.destroy(),
            () => ctx.domManager.removeStyles(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS)
        );
    }

    override destroy(): void {
        super.destroy();
    }

    async processData(dataController: _ModuleSupport.DataController) {
        if (!this.enabled || this.data == null || this.xKey == null || this.volumeKey == null) return;

        const props = [
            keyProperty(this.xKey, undefined, { id: 'date' }),
            valueProperty(this.volumeKey, 'number', { id: 'volume' }),
        ];

        const { dataModel, processedData } = await dataController.request('annotations', this.data, { props });
        this.dataModel = dataModel;
        this.processedData = processedData;
    }

    /**
     * Create an annotation scene within the `this.annotations` scene selection. This method is automatically called by
     * the selection when a new scene is required.
     */
    private createAnnotationScene(datum: AnnotationProperties) {
        if (datum.type in annotationConfigs) {
            return new annotationConfigs[datum.type].scene();
        }
        throw new Error(
            `AG Charts - Cannot create annotation scene of type [${datum.type}], expected one of [${Object.keys(annotationConfigs)}], ignoring.`
        );
    }

    /**
     * Create an annotation datum within the `this.annotationData` properties array. It is created as an instance
     * of `AnnotationProperties` from the given config for its type. This method is only called when annotations
     * are added from the initial state.
     */
    private createAnnotationDatum(params: { type: AnnotationType }) {
        if (params.type in annotationConfigs) {
            return new annotationConfigs[params.type].datum().set(params);
        }
        throw new Error(
            `AG Charts - Cannot create annotation datum of unknown type [${params.type}], expected one of [${Object.keys(annotationConfigs)}], ignoring.`
        );
    }

    /**
     * Append an annotation datum to `this.annotationData`, applying default styles. This method is called when a user
     * interacts with the chart to draw their own annotations.
     */
    private createAnnotation(type: AnnotationType, datum: AnnotationProperties, applyDefaults: boolean = true) {
        this.annotationData.push(datum);

        if (applyDefaults) {
            const styles = this.ctx.annotationManager.getAnnotationTypeStyles(type);
            if (styles) datum.set(styles);
            this.defaults.applyDefaults(datum);
        }

        this.injectDatumDependencies(datum);
        this.resetToolbarButtonStates();
        this.update();
    }

    private injectDatumDependencies(datum: AnnotationProperties) {
        if ('setLocaleManager' in datum) {
            datum.setLocaleManager(this.ctx.localeManager);
        }

        if ('getVolume' in datum) {
            datum.getVolume = this.getDatumRangeVolume.bind(this);
        }
    }

    private getDatumRangeVolume(from: Point['x'], to: Point['x']) {
        if (!isValidDate(from) || !isValidDate(to) || !this.dataModel || !this.processedData) return;

        if (from > to) {
            [from, to] = [to, from];
        }

        const dateDef = this.dataModel.resolveProcessedDataDefById({ id: 'annotations' }, 'date');
        const volumeDef = this.dataModel.resolveProcessedDataDefById({ id: 'annotations' }, 'volume');

        return this.processedData.data.reduce((sum, datum) => {
            const key = datum.keys[dateDef.index];
            if (isValidDate(key) && key >= from && key <= to) {
                return sum + datum.values[volumeDef.index];
            }
            return sum;
        }, 0);
    }

    private translateNode(
        node: AnnotationScene,
        datum: AnnotationProperties,
        translation: _ModuleSupport.Vec2
    ): AnnotationProperties | undefined {
        const config = this.getAnnotationConfig(datum);

        const context = this.getAnnotationContext();
        if (!context) {
            return;
        }

        config.translate(node, datum, translation, context);
    }

    private createAnnotationDatumCopy(
        node: AnnotationScene,
        datum: AnnotationProperties
    ): AnnotationProperties | undefined {
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
        if (datum.type in annotationConfigs) {
            return annotationConfigs[datum.type];
        }
        throw new Error(
            `AG Charts - Cannot get annotation config of unknown type [${datum.type}], expected one of [${Object.keys(annotationConfigs)}], ignoring.`
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

        if (event.value === 'measurer-menu') {
            this.onToolbarButtonPressMenu(event, 'toolbarAnnotationsMeasurerAnnotations', MEASURER_ANNOTATION_ITEMS);
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

    private setLineStyleTypeAndDefault(datumType: HasLineStyleAnnotationType, styleType: AgAnnotationLineStyleType) {
        this.state.transition('lineStyle', { type: styleType });
        this.defaults.setDefaultLineStyleType(datumType, styleType);
        this.recordActionAfterNextUpdate(`Change ${datumType} line style to ${styleType}`, ['annotations', 'defaults']);
    }

    private setLineStyleWidthAndDefault(datumType: HasLineStyleAnnotationType, strokeWidth: number) {
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

        annotationManager.updateData(annotationData.toJson().filter((datum) => !isEphemeralType(datum)) as any);

        const clearAllEnabled = annotationData.length > 0;
        toolbarManager.toggleButton('annotations', 'clear', { enabled: clearAllEnabled });

        annotations
            .update(annotationData ?? [], undefined, (datum) => datum.id)
            .each((node, datum) => {
                if (!this.validateDatum(datum)) {
                    node.visible = false;
                    return;
                }

                this.injectDatumDependencies(datum);
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

    private getPointFn(shiftKey: boolean, offset: _ModuleSupport.Vec2, context: AnnotationContext) {
        return (origin?: Point, angleStep: number = 1) =>
            shiftKey
                ? invertCoords(
                      snapToAngle(offset, origin ? convertPoint(origin, context) : Vec2.origin(), angleStep),
                      context
                  )
                : invertCoords(offset, context);
    }

    private onHover(event: _ModuleSupport.RegionEvent<'hover'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const shiftKey = (event.sourceEvent as MouseEvent).shiftKey;

        const offset = Vec2.from(event);
        this.hoverCoords = offset;

        const point = this.getPointFn(shiftKey, offset, context);

        state.transition('hover', { offset, point });
    }

    private onClick(event: _ModuleSupport.RegionEvent<'click'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        const point = () => invertCoords(offset, context);
        const textInputValue = this.textInput.getValue();
        const bbox = this.textInput.getBBox();

        state.transition('click', { offset, point, textInputValue, bbox });
    }

    private onDoubleClick(event: _ModuleSupport.RegionEvent<'dblclick'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);

        state.transition('dblclick', { offset });
    }

    private onAxisButtonClick(coords?: _ModuleSupport.Vec2, direction?: Direction) {
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

    private onZoomChange() {
        const textInputValue = this.textInput.getValue();
        const bbox = this.textInput.getBBox();

        this.state.transition('zoomChange', { textInputValue, bbox });
    }

    private onDragStart(event: _ModuleSupport.RegionEvent<'drag-start'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        this.hoverCoords = offset;

        state.transition('dragStart', { context, offset });
    }

    private onDrag(event: _ModuleSupport.RegionEvent<'drag'>) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        this.hoverCoords = offset;

        const shiftKey = (event.sourceEvent as MouseEvent).shiftKey;
        const point = this.getPointFn(shiftKey, offset, context);

        const textInputValue = this.textInput.getValue();
        const bbox = this.textInput.getBBox();

        state.transition('drag', { context, offset, point, textInputValue, bbox });
    }

    private onDragEnd() {
        this.hoverCoords = undefined;

        this.state.transition('dragEnd');
    }

    private onCancel() {
        this.cancel();
        this.reset();
    }

    private onDelete() {
        if (this.textInput.isVisible()) return;
        this.cancel();
        this.delete();
        this.reset();
        this.update();
    }

    private onTextInput(event: KeyboardEvent) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const { key, shiftKey } = event;
        const textInputValue = this.textInput.getValue();
        const bbox = this.textInput.getBBox();

        state.transition('keyDown', { key, shiftKey, textInputValue, bbox, context });
    }

    private onKeyDown(event: _ModuleSupport.KeyInteractionEvent<'keydown'>) {
        const { state } = this;
        const context = this.getAnnotationContext();
        if (!context) {
            return;
        }

        const { sourceEvent } = event;
        const { shiftKey, ctrlKey, metaKey } = sourceEvent;
        const ctrlMeta = ctrlKey || metaKey;
        const ctrlShift = ctrlKey || shiftKey;

        const point = this.hoverCoords ? this.getPointFn(shiftKey, this.hoverCoords, context) : undefined;
        this.state.transition('keyDown', { shiftKey, context, point });

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
            case 'Escape':
                this.onCancel();
                return;
            case 'Backspace':
            case 'Delete':
                this.onDelete();
                return;
        }

        if (translation.x || translation.y) {
            state.transition('translate', { translation, context });

            sourceEvent.stopPropagation();
            sourceEvent.preventDefault();
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
        const context = this.getAnnotationContext();
        if (!context) {
            return;
        }

        const point = this.hoverCoords ? this.getPointFn(shiftKey, this.hoverCoords, context) : undefined;

        this.state.transition('keyUp', { shiftKey, context, point });
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

    private updateToolbarLineStyles(datum?: AnnotationProperties) {
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

    private deleteEphemeralAnnotations() {
        for (const [index, datum] of this.annotationData.entries()) {
            if (isEphemeralType(datum)) {
                this.annotationData.splice(index, 1);
            }
        }
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
