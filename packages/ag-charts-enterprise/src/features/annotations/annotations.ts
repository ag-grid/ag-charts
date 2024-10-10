import { type AgAnnotationLineStyleType, type Direction, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { buildBounds } from '../../utils/position';
import { TextInput } from '../text-input/textInput';
import { AxesButtons } from './annotationAxesButtons';
import { AnnotationDefaults } from './annotationDefaults';
import { AnnotationOptionsToolbar } from './annotationOptionsToolbar';
import type {
    AnnotationContext,
    AnnotationOptionsColorPickerType,
    HasFontSizeAnnotationType,
    HasLineStyleAnnotationType,
    Point,
} from './annotationTypes';
import { AnnotationType, stringToAnnotationType } from './annotationTypes';
import { annotationConfigs, getTypedDatum } from './annotationsConfig';
import { LINE_STYLE_TYPE_ITEMS } from './annotationsMenuOptions';
import { AnnotationsStateMachine } from './annotationsStateMachine';
import type { AnnotationProperties, AnnotationScene } from './annotationsSuperTypes';
import { AnnotationsToolbar } from './annotationsToolbar';
import { AxisButton, DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS } from './axisButton';
import { AnnotationSettingsDialog, type LinearSettingsDialogOptions } from './settings-dialog/settingsDialog';
import { calculateAxisLabelPadding } from './utils/axis';
import { snapToAngle } from './utils/coords';
import { isChannelType, isEphemeralType, isLineType, isMeasurerType } from './utils/types';
import { updateAnnotation } from './utils/update';
import { validateDatumPoint } from './utils/validation';
import { convertPoint, invertCoords } from './utils/values';

const {
    BOOLEAN,
    ChartUpdateType,
    InteractionState,
    ObserveChanges,
    PropertiesArray,
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
            ctx: { annotationManager, stateManager },
        } = target;

        if (newValue === oldValue) return;

        // TODO: This should call `target.toolbar.toggle(Boolean(newValue))`, but `target.toolbar` is undefined when
        // the module is first enabled.
        target.ctx.toolbarManager.toggleGroup('annotations', 'annotations', { visible: Boolean(newValue) });

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

    // Elements
    private seriesRect?: _Scene.BBox;
    private readonly container = new _Scene.Group({ name: 'static-annotations' });
    private readonly annotations = new _Scene.Selection<AnnotationScene, AnnotationProperties>(
        this.container,
        this.createAnnotationScene.bind(this)
    );
    private readonly settingsDialog = new AnnotationSettingsDialog(this.ctx);
    private readonly textInput = new TextInput(this.ctx);

    private xAxis?: AnnotationAxis;
    private yAxis?: AnnotationAxis;

    private readonly toolbar = new AnnotationsToolbar(this.ctx);
    private readonly optionsToolbar = new AnnotationOptionsToolbar(this.ctx, () => {
        const active = this.state.getActive();
        if (active == null) return;
        return getTypedDatum(this.annotationData.at(active));
    });

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
                ctx.interactionManager.popState(InteractionState.Annotations);
                this.optionsToolbar.toggleVisibility(false);
                ctx.tooltipManager.unsuppressTooltip('annotations');
                this.hideOverlays();
                this.deleteEphemeralAnnotations();
                this.toolbar.resetButtonStates();
                this.optionsToolbar.toggleAnnotationOptionsButtons();
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
                    ctx: { tooltipManager },
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
                this.optionsToolbar.toggleVisibility(false);

                if (selectedNode) {
                    this.ctx.interactionManager.pushState(InteractionState.AnnotationsSelected);
                    selectedNode.toggleActive(true);
                    tooltipManager.suppressTooltip('annotations');
                    this.optionsToolbar.toggleAnnotationOptionsButtons();
                    this.postUpdateFns.push(() => {
                        // Set the annotation options to be visible _before_ setting the anchor to ensure the toolbar
                        // element has a width and height that it can use in the anchor calculations.
                        this.optionsToolbar.toggleVisibility(true);
                        this.optionsToolbar.setAnchorScene(selectedNode);
                    });
                } else {
                    this.ctx.interactionManager.popState(InteractionState.AnnotationsSelected);
                    tooltipManager.unsuppressTooltip('annotations');
                }

                // Reset the icons on the annotation toolbars
                this.toolbar.resetButtonIcons();

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
                    this.optionsToolbar.setAnchorScene(node);
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

                this.optionsToolbar.toggleAnnotationOptionsButtons();
                this.optionsToolbar.toggleVisibility(true);
                this.optionsToolbar.setAnchorScene(node);
            },

            showAnnotationSettings: (active: number, sourceEvent?: Event, initialTab: 'line' | 'text' = 'line') => {
                const datum = this.annotationData.at(active);

                if (!isLineType(datum) && !isChannelType(datum) && !isMeasurerType(datum)) return;
                if (isEphemeralType(datum)) return;

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
                    onChangeLineColor: (colorOpacity, color, opacity) => {
                        this.setColorAndDefault(datum.type, 'line-color', colorOpacity, color, opacity);
                        this.optionsToolbar.updateColorPickerFill('line-color', color, opacity);
                    },
                    onChangeHideLineColor: () => {
                        this.recordActionAfterNextUpdate(
                            `Change ${datum.type} line-color to ${datum.getDefaultColor('line-color')}`,
                            ['annotations', 'defaults']
                        );
                        this.update();
                    },
                    onChangeLineStyleType: (lineStyleType) => {
                        this.setLineStyleTypeAndDefault(datum.type, lineStyleType);
                        this.optionsToolbar.updateLineStyleType(
                            LINE_STYLE_TYPE_ITEMS.find((item) => item.value === lineStyleType) ??
                                LINE_STYLE_TYPE_ITEMS[0]
                        );
                    },
                    onChangeLineStyleWidth: (strokeWidth) => {
                        this.setLineStyleWidthAndDefault(datum.type, strokeWidth);
                        this.optionsToolbar.updateStrokeWidth({
                            strokeWidth,
                            value: strokeWidth,
                            label: String(strokeWidth),
                        });
                    },
                    onChangeTextColor: (colorOpacity, color, opacity) => {
                        this.setColorAndDefault(datum.type, 'text-color', colorOpacity, color, opacity);
                        this.optionsToolbar.updateColorPickerFill('text-color', color, opacity);
                    },
                    onChangeHideTextColor: () => {
                        this.recordActionAfterNextUpdate(
                            `Change ${datum.type} text-color to ${datum.getDefaultColor('text-color')}`,
                            ['annotations', 'defaults']
                        );
                        this.update();
                    },
                    onChangeTextFontSize: (fontSize) => {
                        this.setFontSizeAndDefault(datum.type, fontSize);
                    },
                };

                this.settingsDialog.show(datum, options);
            },
        });
    }

    private setupListeners() {
        const { ctx, optionsToolbar, toolbar } = this;
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
            ctx.layoutManager.addListener('layout:complete', this.onLayoutComplete.bind(this)),
            ctx.updateService.addListener('pre-scene-render', this.onPreRender.bind(this)),
            ctx.zoomManager.addListener('zoom-change', () => this.onZoomChange()),

            // Toolbar
            toolbar.addListener('cancel-create-annotation', () => {
                this.cancel();
                this.toolbar.resetButtonStates();
                this.reset();
                this.update();
            }),
            toolbar.addListener('pressed-create-annotation', ({ annotation }) => {
                this.cancel();
                this.ctx.interactionManager.pushState(InteractionState.Annotations);
                this.state.transition(annotation);
                this.update();
            }),
            toolbar.addListener('pressed-clear', () => {
                this.clear();
            }),
            toolbar.addListener('pressed-show-menu', () => {
                this.cancel();
                this.reset();
            }),
            toolbar.addListener('pressed-unrelated', () => {
                this.reset();
            }),

            // Annotation Options Toolbar
            optionsToolbar.addListener('pressed-delete', () => {
                this.cancel();
                this.delete();
                this.reset();
            }),
            optionsToolbar.addListener('pressed-settings', ({ sourceEvent }) => {
                this.state.transition('toolbarPressSettings', sourceEvent);
            }),
            optionsToolbar.addListener('save-color', ({ type, colorPickerType, color }) => {
                this.recordActionAfterNextUpdate(`Change ${type} ${colorPickerType} to ${color}`, [
                    'annotations',
                    'defaults',
                ]);
            }),
            optionsToolbar.addListener('update-color', ({ type, colorPickerType, colorOpacity, color, opacity }) => {
                this.setColorAndDefault(type, colorPickerType, colorOpacity, color, opacity);
            }),
            optionsToolbar.addListener('update-font-size', ({ type, fontSize }) => {
                this.setFontSizeAndDefault(type, fontSize);
            }),
            optionsToolbar.addListener('update-line-style', ({ type, lineStyleType }) => {
                this.setLineStyleTypeAndDefault(type, lineStyleType);
            }),
            optionsToolbar.addListener('update-line-width', ({ type, strokeWidth }) => {
                this.setLineStyleWidthAndDefault(type, strokeWidth);
            }),

            // DOM
            ctx.annotationManager.attachNode(this.container),
            () => ctx.domManager.removeStyles(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS)
        );
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
        this.toolbar.resetButtonStates();

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
        if (!isValidDate(from) || !isValidDate(to) || !this.dataModel || !this.processedData) return 0;

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
            ctx: { annotationManager },
        } = this;

        const context = this.getAnnotationContext();
        if (!seriesRect || !context) return;

        annotationManager.updateData(annotationData.toJson() as any);

        this.toolbar.toggleClearButtonEnabled(annotationData.length > 0);

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
            ctx: { interactionManager },
        } = this;

        interactionManager.pushState(InteractionState.Annotations);

        const isHorizontal = direction === 'horizontal';
        state.transition(isHorizontal ? AnnotationType.HorizontalLine : AnnotationType.VerticalLine);

        this.optionsToolbar.toggleVisibility(false);

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

        state.transition('keyDown', { key, shiftKey, textInputValue, bbox });
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

        this.state.transition('keyUp', { shiftKey });
        this.state.transition('translateEnd');
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
        this.settingsDialog.hide();
        this.toolbar.hideOverlays();
        this.optionsToolbar.hideOverlays();
    }

    private update(status = ChartUpdateType.PRE_SCENE_RENDER) {
        this.ctx.updateService.update(status, { skipAnimations: true });
    }
}
