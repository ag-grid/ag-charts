import {
    type AgAnnotation,
    type AgAnnotationLineStyleType,
    type Direction,
    _ModuleSupport,
    _Widget,
} from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ObserveChanges,
    type Point,
    PropertiesArray,
    Property,
    Vec2,
    isValidDate,
} from 'ag-charts-core';

import { TextInput } from '../text-input/textInput';
import { AxesButtons } from './annotationAxesButtons';
import { AnnotationDefaults } from './annotationDefaults';
import { AnnotationOptionsToolbar } from './annotationOptionsToolbar';
import type {
    AnnotationContext,
    AnnotationOptionsColorPickerType,
    DataPoint,
    HasFontSizeAnnotationType,
    HasLineStyleAnnotationType,
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
import { getGroupingValue } from './utils/scale';
import { isChannelType, isEphemeralType, isLineType, isMeasurerType } from './utils/types';
import { updateAnnotation } from './utils/update';
import { validateDatumPoint } from './utils/validation';
import { invertCoords } from './utils/values';

const { ChartUpdateType, InteractionState, ChartAxisDirection, keyProperty, valueProperty, Selection, BBox } =
    _ModuleSupport;

type AnnotationPropertiesArray = PropertiesArray<AnnotationProperties>;

type AnnotationAxis = {
    layout: _ModuleSupport.AxisLayout;
    context: _ModuleSupport.AxisContext;
    bounds: _ModuleSupport.BBox;
    button?: AxisButton;
};

export class Annotations extends AbstractModuleInstance {
    @Property
    public readonly toolbar = new AnnotationsToolbar(this.ctx);

    @Property
    public optionsToolbar = new AnnotationOptionsToolbar(this.ctx, () => {
        const active = this.state.getActive();
        if (active == null) return;
        return getTypedDatum(this.annotationData.at(active));
    });

    @Property
    public axesButtons = new AxesButtons();

    @Property
    @ObserveChanges<Annotations>((target: Annotations, value?: boolean) => {
        const enabled = value ?? true;
        target.toolbar.enabled = enabled;
        target.optionsToolbar.enabled = enabled;
        target.axesButtons.enabled = enabled;
    })
    public enabled: boolean = true;

    @Property
    public snap: boolean = false;

    // Hidden options for use with measurer statistics
    public data?: any[] = undefined;
    public xKey?: string = undefined;
    public volumeKey?: string = undefined;

    // State
    private readonly state: AnnotationsStateMachine;
    private readonly annotationData: AnnotationPropertiesArray = new PropertiesArray<AnnotationProperties>(
        Annotations.createAnnotationDatum
    );
    private readonly defaults = new AnnotationDefaults();
    private dataModel?: _ModuleSupport.DataModel<any, any>;
    private processedData?: _ModuleSupport.ProcessedData<any>;

    // Elements
    private seriesRect?: _ModuleSupport.BBox;
    private readonly container = new _ModuleSupport.Group({ name: 'static-annotations' });
    private readonly annotations = new Selection<AnnotationScene, AnnotationProperties>(
        this.container,
        this.createAnnotationScene.bind(this)
    );
    private readonly settingsDialog = new AnnotationSettingsDialog(this.ctx);
    private readonly textInput = new TextInput(this.ctx);

    private xAxis?: AnnotationAxis;
    private yAxis?: AnnotationAxis;

    private postUpdateFns: Array<() => void> = [];

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        this.state = this.setupStateMachine();
        this.setupListeners();
        this.setupDOM();

        // Add originators to the history only when this module is enabled to prevent memory increases
        this.ctx.historyManager.addMementoOriginator(ctx.annotationManager);
        this.ctx.historyManager.addMementoOriginator(this.defaults);
        this.textInput.setKeyDownHandler(this.onTextInput.bind(this));

        this.cleanup.register(() => {
            this.clear();
            this.xAxis?.button?.destroy();
            this.yAxis?.button?.destroy();
            this.textInput.destroy();
        });
    }

    private setupStateMachine() {
        const { ctx } = this;

        return new AnnotationsStateMachine({
            resetToIdle: () => {
                ctx.domManager.updateCursor('annotations');
                this.popAnnotationState(InteractionState.Annotations);
                this.hideOverlays();
                this.optionsToolbar.hide();
                this.deleteEphemeralAnnotations();
                this.update();
            },

            hoverAtCoords: (coords: Point, active?: number, previousHovered?: number) => {
                let hovered: number | undefined;

                this.annotations.each((annotation, datum, index) => {
                    if (!datum.isHoverable()) return;
                    const contains = annotation.containsPoint(coords.x, coords.y);
                    if (contains) hovered ??= index;
                    annotation.toggleHovered(contains, active === index, datum.readOnly);
                });

                if (hovered != null) {
                    ctx.tooltipManager.suppressTooltip('annotations');
                } else if (!this.isAnnotationState()) {
                    ctx.tooltipManager.unsuppressTooltip('annotations');
                }

                if (hovered == null || !this.annotationData.at(hovered)?.readOnly) {
                    this.ctx.domManager.updateCursor(
                        'annotations',
                        hovered == null ? undefined : this.annotations.at(hovered)?.getCursor()
                    );
                }

                if (hovered !== previousHovered) {
                    this.update();
                }

                return hovered;
            },

            getNodeAtCoords: (coords: Point, active: number) => {
                const node = this.annotations.at(active);

                if (!node) {
                    return;
                }

                return node.getNodeAtCoords(coords.x, coords.y);
            },

            translate: (index: number, translation: Point) => {
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
                const { annotations, optionsToolbar, toolbar } = this;

                this.hideOverlays();
                toolbar.clearActiveButton();
                toolbar.resetButtonIcons();

                const selectedNode = index == null ? null : annotations.at(index);
                const previousNode = previous == null ? null : annotations.at(previous);
                const selectedDatum = index == null ? null : this.annotationData.at(index);

                // Only change anything else if a different node has been selected or when deselecting
                if (previousNode === selectedNode && selectedNode != null) {
                    return;
                }

                // Deselect the previous node
                previousNode?.toggleActive(false);

                // Hide the annotation options so it has time to update before being shown again
                optionsToolbar.hide();

                if (selectedNode && !selectedDatum?.readOnly) {
                    this.pushAnnotationState(InteractionState.AnnotationsSelected);
                    selectedNode.toggleActive(true);
                    if (!isEphemeralType(selectedDatum)) {
                        optionsToolbar.updateButtons(this.annotationData.at(index!)!);
                        this.postUpdateFns.push(() => {
                            // Set the annotation options to be visible _before_ setting the anchor to ensure the toolbar
                            // element has a width and height that it can use in the anchor calculations.
                            optionsToolbar.show();
                            optionsToolbar.setAnchorScene(selectedNode);
                        });
                    }
                } else {
                    this.popAnnotationState(InteractionState.AnnotationsSelected);
                    this.popAnnotationState(InteractionState.Annotations);
                }

                if (!isEphemeralType(selectedDatum)) {
                    this.deleteEphemeralAnnotations();
                }
                this.update();
            },

            selectLast: () => {
                this.pushAnnotationState(InteractionState.AnnotationsSelected);
                return this.annotationData.length - 1;
            },

            startInteracting: () => {
                this.pushAnnotationState(InteractionState.Annotations);
            },

            stopInteracting: () => {
                this.popAnnotationState(InteractionState.Annotations);
            },

            create: (type: AnnotationType, datum: AnnotationProperties) => {
                this.createAnnotation(type, datum);
            },

            delete: (index: number) => {
                this.annotationData.splice(index, 1);
            },

            deleteAll: () => {
                // Filter the readOnly data and recreate the array since this is not a standard array.
                const readOnly = this.annotationData.filter((datum) => {
                    if (datum.readOnly === true) return datum;
                });
                this.annotationData.splice(0, this.annotationData.length);
                for (const datum of readOnly) {
                    this.annotationData.push(datum);
                }
            },

            validatePoint: (point: DataPoint, options?: { overflowContinuous: boolean }) => {
                const context = this.getAnnotationContext();
                return context ? validateDatumPoint(context, point, options) : true;
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
                    const node = active == null ? null : this.annotations.at(active);
                    if (node == null) return;
                    this.optionsToolbar.setAnchorScene(node);
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

                this.ctx.domManager.updateCursor('annotations');
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

            updateTextInputBBox: (bbox?: _ModuleSupport.BBox) => {
                this.state.transition('updateTextInputBBox', bbox);
            },

            showAnnotationOptions: (active: number) => {
                const node = this.annotations.at(active);
                if (!node || isEphemeralType(this.annotationData.at(active))) return;

                this.optionsToolbar.updateButtons(this.annotationData.at(active)!);
                this.optionsToolbar.show();
                this.optionsToolbar.setAnchorScene(node);
            },

            showAnnotationSettings: (active: number, sourceEvent?: Event, initialTab: 'line' | 'text' = 'line') => {
                const datum = this.annotationData.at(active);

                if (!isLineType(datum) && !isChannelType(datum) && !isMeasurerType(datum)) return;
                if (isEphemeralType(datum)) return;

                const onChangeColor =
                    (colorType: AnnotationOptionsColorPickerType) =>
                    (colorOpacity: string, color: string, opacity: number, isMultiColor: boolean) => {
                        this.setColorAndDefault(datum.type, colorType, colorOpacity, color, opacity, isMultiColor);
                        this.optionsToolbar.updateColorPickerColor(colorType, color, opacity, isMultiColor);
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
                        if (props.bands != null)
                            this.defaults.setDefaultFibonacciOptions(datum.type, 'bands', props.bands);
                        if (props.reverse != null)
                            this.defaults.setDefaultFibonacciOptions(datum.type, 'reverse', props.reverse);
                        if (props.showFill != null)
                            this.defaults.setDefaultFibonacciOptions(datum.type, 'showFill', props.showFill);
                    },
                    onChangeText: (props) => {
                        this.state.transition('lineText', props);
                        if (props.alignment) this.defaults.setDefaultLineTextAlignment(datum.type, props.alignment);
                        if (props.position) this.defaults.setDefaultLineTextPosition(datum.type, props.position);
                        this.recordActionAfterNextUpdate(
                            `Change ${datum.type} text ${Object.keys(props)
                                .map((key) => `${key} to ${(props as any)[key]}`)
                                .join(', ')}`
                        );
                    },
                    onChangeFillColor: onChangeColor('fill-color'),
                    onChangeHideFillColor: onChangeHideColor('fill-color'),
                    onChangeLineColor: onChangeColor('line-color'),
                    onChangeHideLineColor: onChangeHideColor('line-color'),
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
        const { ctx, optionsToolbar, settingsDialog, toolbar } = this;
        const { seriesWidget, seriesDragInterpreter, chartWidget } = ctx.widgets;

        if (seriesDragInterpreter) {
            this.cleanup.register(
                // Interactions
                seriesDragInterpreter.events.on('click', this.hoverTouchPreHandler.bind(this)),
                seriesDragInterpreter.events.on('drag-start', this.hoverTouchPreHandler.bind(this)),
                seriesDragInterpreter.events.on('drag-move', this.dragMoveTouchPreHandler.bind(this)),
                seriesDragInterpreter.events.on('mousemove', this.onHover.bind(this)),
                seriesDragInterpreter.events.on('click', this.onClick.bind(this)),
                seriesDragInterpreter.events.on('dblclick', this.onDoubleClick.bind(this)),
                seriesDragInterpreter.events.on('drag-start', this.onDragStart.bind(this)),
                seriesDragInterpreter.events.on('drag-move', this.onDrag.bind(this)),
                seriesDragInterpreter.events.on('drag-end', this.onDragEnd.bind(this))
            );
        }
        this.cleanup.register(
            // Interactions
            seriesWidget.addListener('keydown', this.onKeyDown.bind(this)),
            seriesWidget.addListener('keyup', this.onKeyUp.bind(this)),
            chartWidget.addListener('click', this.onCancel.bind(this)),

            // Services
            ctx.eventsHub.on('annotations:restore', this.onRestoreAnnotations.bind(this)),
            ctx.eventsHub.on('layout:complete', this.onLayoutComplete.bind(this)),
            ctx.updateService.addListener('pre-scene-render', this.onPreRender.bind(this)),
            ctx.eventsHub.on('zoom:change-request', () => this.onResize()),
            ctx.eventsHub.on('dom:resize', () => this.onResize()),

            // Toolbar
            toolbar.events.on('cancel-create-annotation', () => {
                this.cancel();
                this.reset();
                this.update();
            }),
            toolbar.events.on('pressed-create-annotation', ({ annotation }) => {
                this.cancel();
                this.pushAnnotationState(InteractionState.Annotations);
                this.state.transition(annotation);
                this.update();
            }),
            toolbar.events.on('pressed-clear', () => {
                this.clear();
                this.recordActionAfterNextUpdate('Clear all');
            }),
            toolbar.events.on('pressed-show-menu', () => {
                this.cancel();
                this.reset();
            }),
            toolbar.events.on('pressed-unrelated', () => {
                this.reset();
            }),

            // Annotation Options Toolbar
            optionsToolbar.events.on('pressed-delete', () => {
                this.cancel();
                this.delete();
                this.reset();
            }),
            optionsToolbar.events.on('pressed-settings', ({ sourceEvent }) => {
                this.state.transition('toolbarPressSettings', sourceEvent);
            }),
            optionsToolbar.events.on('pressed-lock', ({ locked }) => {
                this.recordActionAfterNextUpdate(locked ? 'Locked' : 'Unlocked');
                this.update();
            }),
            optionsToolbar.events.on('hid-overlays', () => {
                this.settingsDialog.hide();
            }),
            optionsToolbar.events.on('saved-color', ({ type, colorPickerType, color }) => {
                this.recordActionAfterNextUpdate(`Change ${type} ${colorPickerType} to ${color}`, [
                    'annotations',
                    'defaults',
                ]);
            }),
            optionsToolbar.events.on(
                'updated-color',
                ({ type, colorPickerType, colorOpacity, color, opacity, isMultiColor }) => {
                    this.setColorAndDefault(type, colorPickerType, colorOpacity, color, opacity, isMultiColor);
                }
            ),
            optionsToolbar.events.on('updated-font-size', ({ type, fontSize }) => {
                this.setFontSizeAndDefault(type, fontSize);
            }),
            optionsToolbar.events.on('updated-line-style', ({ type, lineStyleType }) => {
                this.setLineStyleTypeAndDefault(type, lineStyleType);
            }),
            optionsToolbar.events.on('updated-line-width', ({ type, strokeWidth }) => {
                this.setLineStyleWidthAndDefault(type, strokeWidth);
            }),

            // Settings Dialog
            settingsDialog.events.on('hidden', () => {
                this.optionsToolbar.clearActiveButton();
            })
        );
    }

    private setupDOM() {
        const { ctx, toolbar, optionsToolbar } = this;

        this.cleanup.register(ctx.annotationManager.attachNode(this.container), () => {
            ctx.domManager.removeStyles(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
            toolbar.destroy();
            optionsToolbar.destroy();
        });
    }

    async processData(dataController: _ModuleSupport.DataController) {
        if (!this.enabled || this.data == null || this.xKey == null || this.volumeKey == null) return;

        const props = [
            keyProperty(this.xKey, undefined, { id: 'date' }),
            valueProperty(this.volumeKey, 'number', { id: 'volume' }),
        ];

        // TODO: While the below should hold true, we instead need to clone the data array to ensure it is a separate
        // data model and we don't have missing props of `date` and `volume`.
        // Request a data model with no extra props, we expect the required keys of `date` and `volume` will already
        // be provided by the series, so we can skip duplicate processing.
        const dataSet = _ModuleSupport.DataSet.wrap(this.data) ?? _ModuleSupport.DataSet.empty();
        const { dataModel, processedData } = await dataController.request('annotations', dataSet, {
            props,
        });
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
    private static createAnnotationDatum(this: void, params: { type: AnnotationType }) {
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

    private getDatumRangeVolume(fromPoint: DataPoint['x'], toPoint: DataPoint['x']) {
        const { dataModel, processedData } = this;

        let from = getGroupingValue(fromPoint);
        let to = getGroupingValue(toPoint);
        if (!isValidDate(from) || !isValidDate(to) || !dataModel || !processedData || this.volumeKey == null) return;

        if (from > to) {
            [from, to] = [to, from];
        }

        const dateValues = dataModel.resolveKeysById<Date>({ id: 'annotations' }, 'date', processedData);
        const volumeValues = dataModel.resolveColumnById({ id: 'annotations' }, 'volume', processedData);

        let sum = 0;
        for (let datumIndex = 0; datumIndex < processedData.input.count; datumIndex++) {
            const key = dateValues[datumIndex];
            if (isValidDate(key) && key >= from && key <= to) {
                sum += volumeValues[datumIndex];
            }
        }
        return sum;
    }

    private translateNode(
        node: AnnotationScene,
        datum: AnnotationProperties,
        translation: Point
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

    private onRestoreAnnotations(event: { annotations: Array<AgAnnotation> }) {
        if (!this.enabled) return;

        this.clear();
        this.annotationData.set(event.annotations);

        this.postUpdateFns.push(() => {
            this.ctx.annotationManager.fireChangedEvent();
        });
        this.update();
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        if (!this.enabled) return;

        const seriesRect = event.series.paddedRect;
        this.seriesRect = seriesRect;

        // clip annotations to series padded rect
        this.container.setClipRect(seriesRect);

        this.xAxis = this.getAxis(event.axes[ChartAxisDirection.X], seriesRect, this.xAxis?.button);
        this.yAxis = this.getAxis(event.axes[ChartAxisDirection.Y], seriesRect, this.yAxis?.button);

        if (this.showAnnotations()) {
            this.animateAnnotations({ from: 0, to: 1, phase: 'trailing' });
        } else {
            this.animateAnnotations({ from: 1, to: 0, phase: 'remove' });
        }
    }

    private showAnnotations() {
        if (!this.yAxis || !this.xAxis) {
            return false;
        }

        const hasData = this.ctx.chartService.series.some((s) => s.hasData);

        const seriesIds = this.yAxis.context.seriesIds();
        const anyBoundSeriesVisible = seriesIds.some((id) => {
            const series = this.ctx.chartService.series.find((s) => s.id === id);
            return series?.visible;
        });

        return hasData && anyBoundSeriesVisible;
    }

    private animateAnnotations({ from, to, phase }: { from: number; to: number; phase: 'trailing' | 'remove' }) {
        const { annotations } = this;
        this.ctx.animationManager?.animate({
            from,
            to,
            id: 'chart-annotations',
            phase,
            groupId: 'opacity',
            onUpdate(value) {
                annotations.each((node) => {
                    node.opacity = value;
                    if ('setAxisLabelOpacity' in node) {
                        node.setAxisLabelOpacity(value);
                    }
                });
            },
            onStop() {
                annotations.each((node) => {
                    node.opacity = to;
                    if ('setAxisLabelOpacity' in node) {
                        node.setAxisLabelOpacity(to);
                    }
                });
            },
        });
    }

    private onPreRender() {
        if (!this.enabled) return;
        this.updateAnnotations();
        this.state.transition('render');
    }

    private getAxis(
        axisLayout: _ModuleSupport.AxisLayout,
        seriesRect: _ModuleSupport.BBox,
        button?: AxisButton
    ): AnnotationAxis {
        const axisCtx = this.ctx.axisManager.getAxisContext(axisLayout.direction)[0];

        const { position: axisPosition = 'bottom', direction } = axisCtx;
        const padding = axisLayout.gridPadding + axisLayout.seriesAreaPadding;
        const bounds = new BBox(0, 0, seriesRect.width, seriesRect.height).grow(padding, axisPosition);

        const lineDirection = direction === ChartAxisDirection.X ? 'vertical' : 'horizontal';

        const { axesButtons, snap } = this;
        const buttonEnabled =
            this.enabled && axesButtons.enabled && (axesButtons.axes === 'xy' || axesButtons.axes === direction);
        if (buttonEnabled) {
            button ??= new AxisButton(
                this.ctx,
                { ...axisCtx, snapToGroup: snap },
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
            annotationManager.fireChangedEvent();
        });
    }

    private setColorAndDefault(
        datumType: AnnotationType,
        colorPickerType: AnnotationOptionsColorPickerType,
        colorOpacity: string,
        color: string,
        opacity: number,
        isMultiColor: boolean
    ) {
        this.state.transition('color', { colorPickerType, colorOpacity, color, opacity, isMultiColor });
        this.defaults.setDefaultColor(datumType, colorPickerType, colorOpacity, color, opacity, isMultiColor);
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

        annotationManager.updateData(annotationData.toJson() as AgAnnotation[]);

        const showAnnotations = this.showAnnotations();
        this.toolbar.refreshButtonsEnabled(showAnnotations);
        this.toolbar.toggleClearButtonEnabled(annotationData.length > 0 && showAnnotations);

        annotations
            .update(annotationData ?? [], undefined, (datum) => datum.id)
            .each((node, datum) => {
                if (!showAnnotations) {
                    node.visible = false;
                    if ('setAxisLabelVisible' in node) {
                        node.setAxisLabelVisible(false);
                    }
                    return;
                }

                if ('setAxisLabelVisible' in node) {
                    node.setAxisLabelVisible(true);
                }
                this.injectDatumDependencies(datum);
                updateAnnotation(node, datum, context);
            });

        for (const fn of this.postUpdateFns) {
            fn();
        }
        this.postUpdateFns = [];
    }

    private getAnnotationContext(): AnnotationContext | undefined {
        const { seriesRect, xAxis, yAxis, snap } = this;

        if (!(seriesRect && xAxis && yAxis)) {
            return;
        }

        return {
            seriesRect,
            xAxis: {
                ...xAxis.context,
                bounds: xAxis.bounds,
                labelPadding: calculateAxisLabelPadding(xAxis.layout),
                snapToGroup: snap,
            },
            yAxis: {
                ...yAxis.context,
                bounds: yAxis.bounds,
                labelPadding: calculateAxisLabelPadding(xAxis.layout),
                snapToGroup: snap,
            },
        };
    }

    private onHover(event: { currentX: number; currentY: number; sourceEvent: MouseEvent | TouchEvent }) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const shiftKey = event.sourceEvent.shiftKey;

        const offset = Vec2.from(event);
        const point = invertCoords(offset, context);

        state.transition('hover', { offset, point, shiftKey, context });
    }

    private onClick(event: _ModuleSupport.DragInterpreterClickEvent) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const shiftKey = event.sourceEvent.shiftKey;
        const point = invertCoords(Vec2.from(event), context);
        const textInputValue = this.textInput.getValue();
        const bbox = this.textInput.getBBox();

        state.transition('click', { point, shiftKey, textInputValue, bbox });
    }

    private onDoubleClick(event: _ModuleSupport.DragInterpreterDblClickEvent) {
        const { state } = this;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);

        state.transition('dblclick', { offset });
    }

    private onAxisButtonClick(coords?: Point, direction?: Direction) {
        this.cancel();
        this.reset();

        const context = this.getAnnotationContext();
        if (!this.annotationData || !context) return;

        const { state } = this;

        this.pushAnnotationState(InteractionState.Annotations);

        const isHorizontal = direction === 'horizontal';
        state.transition(isHorizontal ? AnnotationType.HorizontalLine : AnnotationType.VerticalLine);

        this.optionsToolbar.hide();

        if (!coords) {
            return;
        }

        const point = invertCoords(coords, context);

        if (!validateDatumPoint(context, point)) {
            return;
        }

        state.transition('click', { point, shiftKey: false });

        this.update();
    }

    private onResize() {
        const textInputValue = this.textInput.getValue();
        const bbox = this.textInput.getBBox();

        this.state.transition('resize', { textInputValue, bbox });
    }

    private hoverTouchPreHandler(event: Parameters<Annotations['onHover']>[0] & { device: 'mouse' | 'touch' }) {
        if (event.device === 'touch') {
            this.onHover(event);
        }
    }

    private dragMoveTouchPreHandler(event: _Widget.DragWidgetEvent<'drag-move'>) {
        if (event.device === 'touch' && this.ctx.interactionManager.isState(InteractionState.AnnotationsSelected)) {
            event.sourceEvent.preventDefault();
        }
    }

    private onDragStart(event: _Widget.DragWidgetEvent<'drag-start'>) {
        if (!this.ctx.interactionManager.isState(InteractionState.AnnotationsDraggable)) return;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        const point = invertCoords(offset, context);

        const textInputValue = this.textInput.getValue();
        const bbox = this.textInput.getBBox();

        this.state.transition('dragStart', { context, offset, point, textInputValue, bbox });
    }

    private onDrag(event: _Widget.DragWidgetEvent<'drag-move'>) {
        if (!this.ctx.interactionManager.isState(InteractionState.AnnotationsDraggable)) return;

        const context = this.getAnnotationContext();
        if (!context) return;

        const offset = Vec2.from(event);
        const point = invertCoords(offset, context);
        const shiftKey = (event.sourceEvent as MouseEvent).shiftKey;
        const textInputValue = this.textInput.getValue();
        const bbox = this.textInput.getBBox();

        this.state.transition('drag', { context, offset, point, shiftKey, textInputValue, bbox });
    }

    private onDragEnd() {
        this.state.transition('dragEnd');
    }

    private onCancel(widgetEvent?: _Widget.MouseWidgetEvent) {
        const { sourceEvent } = widgetEvent ?? {};
        if (sourceEvent?.currentTarget !== sourceEvent?.target) return;
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

        state.transition('textInput', { key, shiftKey, textInputValue, bbox, context });
    }

    private onKeyDown(event: _Widget.KeyboardWidgetEvent<'keydown'>) {
        const { state } = this;
        const context = this.getAnnotationContext();
        if (!context) {
            return;
        }

        const { sourceEvent } = event;
        const { shiftKey, ctrlKey, metaKey } = sourceEvent;
        const ctrlMeta = ctrlKey || metaKey;
        const ctrlShift = ctrlKey || shiftKey;

        state.transition('keyDown', { shiftKey, context });

        const translation = { x: 0, y: 0 };

        const xStep = Math.max(context?.xAxis.scale.bandwidth ?? 0, ctrlShift ? 10 : 1);
        const yStep = Math.max(context?.yAxis.scale.bandwidth ?? 0, ctrlShift ? 10 : 1);
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
            state.transition('translate', { translation });

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

    private onKeyUp(event: _Widget.KeyboardWidgetEvent<'keyup'>) {
        const { shiftKey } = event.sourceEvent;
        const context = this.getAnnotationContext();
        if (!context) {
            return;
        }

        this.state.transition('keyUp', { shiftKey, context });
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
        let deletedEphemeral = false;
        for (const [index, datum] of this.annotationData.entries()) {
            if (isEphemeralType(datum)) {
                this.annotationData.splice(index, 1);
                deletedEphemeral = true;
            }
        }
        if (deletedEphemeral) {
            this.recordActionAfterNextUpdate('Delete ephemeral annotations');
        }
    }

    private hideOverlays() {
        this.settingsDialog.hide();
        this.toolbar.hideOverlays();
        this.optionsToolbar.hideOverlays();
    }

    private pushAnnotationState(
        state: _ModuleSupport.InteractionState.Annotations | _ModuleSupport.InteractionState.AnnotationsSelected
    ) {
        this.ctx.interactionManager.pushState(state);
        this.ctx.tooltipManager.suppressTooltip('annotations');
    }

    private popAnnotationState(
        state: _ModuleSupport.InteractionState.Annotations | _ModuleSupport.InteractionState.AnnotationsSelected
    ) {
        this.ctx.interactionManager.popState(state);
        this.ctx.tooltipManager.unsuppressTooltip('annotations');
    }

    private isAnnotationState() {
        return (
            this.ctx.interactionManager.isState(InteractionState.Annotations) ||
            this.ctx.interactionManager.isState(InteractionState.AnnotationsSelected)
        );
    }

    private update(status = ChartUpdateType.PRE_SCENE_RENDER) {
        this.ctx.updateService.update(status);
    }
}
