import { type AgAnnotationLineStyleType, _ModuleSupport } from 'ag-charts-community';

import { ColorPicker } from '../../components/color-picker/colorPicker';
import {
    type AnnotationOptionsColorPickerType,
    type HasColorAnnotationType,
    type HasFontSizeAnnotationType,
    type HasLineStyleAnnotationType,
} from './annotationTypes';
import {
    AnnotationOptions,
    LINE_STROKE_WIDTH_ITEMS,
    LINE_STYLE_TYPE_ITEMS,
    TEXT_SIZE_ITEMS,
} from './annotationsMenuOptions';
import type { AnnotationProperties, AnnotationScene } from './annotationsSuperTypes';
import { hasFillColor, hasFontSize, hasLineColor, hasLineStyle, hasLineText, hasTextColor } from './utils/has';
import { getLineStyle } from './utils/line';
import { isTextType } from './utils/types';

const {
    ARRAY,
    BOOLEAN,
    NUMBER,
    OBJECT,
    STRING,
    UNION,
    Color,
    FloatingToolbar,
    InteractionState,
    Listeners,
    Menu,
    PropertiesArray,
    ToolbarButtonProperties,
    ToolbarButtonWidget,
    Validate,
} = _ModuleSupport;

interface EventMap {
    'pressed-delete': void;
    'pressed-settings': { sourceEvent: Event };
    'save-color': {
        type: HasColorAnnotationType;
        colorPickerType: AnnotationOptionsColorPickerType;
        color: string | undefined;
    };
    'update-color': {
        type: HasColorAnnotationType;
        colorPickerType: AnnotationOptionsColorPickerType;
        colorOpacity: string;
        color: string;
        opacity: number;
    };
    'update-font-size': { type: HasFontSizeAnnotationType; fontSize: number };
    'update-line-style': { type: HasLineStyleAnnotationType; lineStyleType: AgAnnotationLineStyleType };
    'update-line-width': { type: HasLineStyleAnnotationType; strokeWidth: number };
}

class AnnotationOptionsButtonProperties extends ToolbarButtonProperties {
    @Validate(
        UNION([
            'line-stroke-width',
            'line-style-type',
            'line-color',
            'fill-color',
            'text-color',
            'text-size',
            'delete',
            'settings',
            'lock',
        ])
    )
    value!: AnnotationOptions;

    @Validate(OBJECT, { optional: true })
    checkedOverrides = new ToolbarButtonProperties();

    @Validate(STRING, { optional: true })
    fill?: string;

    @Validate(NUMBER, { optional: true })
    strokeWidth?: number;
}

interface AnnotationOptionsButtonOptions extends _ModuleSupport.ToolbarButtonOptions {
    value: AnnotationOptions;
    fill?: string;
    strokeWidth?: number;
}

class AnnotationOptionsButtonWidget extends ToolbarButtonWidget {
    public override update(options: AnnotationOptionsButtonOptions) {
        super.update(options as any);

        if (options.value === AnnotationOptions.LineStrokeWidth) {
            this.updateLineStrokeWidth(options);
        }

        if (
            options.value === AnnotationOptions.FillColor ||
            options.value === AnnotationOptions.LineColor ||
            options.value === AnnotationOptions.TextColor
        ) {
            this.updateFillColor(options);
        }
    }

    private updateFillColor(options: AnnotationOptionsButtonOptions) {
        const element = this.getElement();
        element.classList.add('ag-charts-annotations-fill-button');
        element.style.setProperty('--fill', options.fill ?? null);
    }

    private updateLineStrokeWidth(options: AnnotationOptionsButtonOptions) {
        const element = this.getElement();
        element.classList.add('ag-charts-annotations-stroke-width-button');
        element.style.setProperty('--stroke-width', `${options.strokeWidth}px`);
    }
}

class FloatingAnnotationOptionsToolbar extends FloatingToolbar<
    AnnotationOptionsButtonOptions,
    any // TODO: AnnotationOptionsButtonWidget
> {
    protected override createButtonWidget() {
        return new AnnotationOptionsButtonWidget(this.ctx);
    }
}

export class AnnotationOptionsToolbar extends _ModuleSupport.BaseProperties {
    @Validate(BOOLEAN)
    public enabled?: boolean = true;

    @Validate(ARRAY)
    public buttons = new PropertiesArray(AnnotationOptionsButtonProperties);

    private readonly destroyFns: (() => void)[] = [];

    private readonly events = new Listeners<keyof EventMap, any>();

    private readonly toolbar = new FloatingAnnotationOptionsToolbar(
        this.ctx,
        'annotation-options',
        this.onButtonPress.bind(this),
        this.onToolbarMoved.bind(this)
    );
    private readonly colorPicker = new ColorPicker(this.ctx);
    private readonly textSizeMenu = new Menu(this.ctx, 'text-size');
    private readonly lineStyleTypeMenu = new Menu(this.ctx, 'annotations-line-style-type');
    private readonly lineStrokeWidthMenu = new Menu(this.ctx, 'annotations-line-stroke-width');

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly getActiveDatum: () => AnnotationProperties | undefined
    ) {
        super();

        const seriesRegion = ctx.regionManager.getRegion('series');
        this.destroyFns.push(
            seriesRegion.addListener('drag-start', this.onDragStart.bind(this), InteractionState.All),
            seriesRegion.addListener('drag-end', this.onDragEnd.bind(this), InteractionState.All),
            ctx.layoutManager.addListener('layout:complete', this.onLayoutComplete.bind(this)),
            () => this.colorPicker.destroy()
        );
    }

    private onDragStart() {
        this.toolbar.ignorePointerEvents();
    }

    private onDragEnd() {
        this.toolbar.capturePointerEvents();
    }

    public destroy() {
        for (const destroyFn of this.destroyFns) {
            destroyFn();
        }
    }

    public addListener<K extends keyof EventMap>(eventType: K, handler: (event: EventMap[K]) => void) {
        return this.events.addListener(eventType, handler);
    }

    public show() {
        this.toolbar.show({});
    }

    public hide() {
        this.toolbar.hide();
    }

    public toggleButtons() {
        const datum = this.getActiveDatum();
        if (!datum) return;

        const locked = datum.locked ?? false;

        const visible = {
            [AnnotationOptions.LineStyleType]: hasLineStyle(datum),
            [AnnotationOptions.LineStrokeWidth]: hasLineStyle(datum),
            [AnnotationOptions.LineColor]: hasLineColor(datum),
            [AnnotationOptions.TextColor]: hasTextColor(datum),
            [AnnotationOptions.FillColor]: hasFillColor(datum),
            [AnnotationOptions.TextSize]: hasFontSize(datum),
            [AnnotationOptions.Settings]: hasLineText(datum),
            [AnnotationOptions.Lock]: true,
            [AnnotationOptions.Delete]: true,
        };

        const visibleIndices = [];

        for (const [index, button] of this.buttons.entries()) {
            if (!button) continue;

            if (visible[button.value]) visibleIndices.push(index);

            if (button.value === AnnotationOptions.Lock) {
                this.toolbar.toggleSwitchCheckedByIndex(index, locked);
            } else {
                this.toolbar.toggleButtonEnabledByIndex(index, !locked);
            }
        }

        this.toolbar.toggleButtonVisibilities(visibleIndices);

        this.updateFontSize('fontSize' in datum ? datum.fontSize : undefined);
        this.updateFills(datum);
        this.updateLineStyles(datum);
    }

    public setAnchorScene(scene: AnnotationScene) {
        if (this.toolbar.hasBeenDragged()) return;
        this.toolbar.setAnchor(scene.getAnchor());
    }

    public hideOverlays() {
        this.colorPicker.hide({ lastFocus: null });
        this.textSizeMenu.hide();
        this.lineStyleTypeMenu.hide();
        this.lineStrokeWidthMenu.hide();
    }

    private updateFills(datum: AnnotationProperties) {
        this.updateColorPickerFill(
            AnnotationOptions.LineColor,
            datum.getDefaultColor(AnnotationOptions.LineColor),
            datum.getDefaultOpacity(AnnotationOptions.LineColor)
        );
        this.updateColorPickerFill(
            AnnotationOptions.FillColor,
            datum.getDefaultColor(AnnotationOptions.FillColor),
            datum.getDefaultOpacity(AnnotationOptions.FillColor)
        );
        this.updateColorPickerFill(
            AnnotationOptions.TextColor,
            datum.getDefaultColor(AnnotationOptions.TextColor),
            datum.getDefaultOpacity(AnnotationOptions.TextColor)
        );
    }

    public updateColorPickerFill(colorPickerType: AnnotationOptionsColorPickerType, color?: string, opacity?: number) {
        if (color != null && opacity != null) {
            const { r, g, b } = Color.fromString(color);
            color = Color.fromArray([r, g, b, opacity]).toHexString();
        }
        this.updateButtonByValue(colorPickerType as any, {
            fill: color,
        });
    }

    private updateFontSize(fontSize: number | undefined) {
        this.updateButtonByValue(AnnotationOptions.TextSize, {
            label: fontSize != null ? String(fontSize) : undefined,
        });
    }

    public updateLineStyleType(item: _ModuleSupport.MenuItem<AgAnnotationLineStyleType>) {
        this.updateButtonByValue(AnnotationOptions.LineStyleType, {
            icon: item.icon,
        });
    }

    public updateStrokeWidth(item: _ModuleSupport.MenuItem<number>) {
        this.updateButtonByValue(AnnotationOptions.LineStrokeWidth, {
            label: item.label,
            strokeWidth: item.value,
        });
    }

    private dispatch<K extends keyof EventMap>(eventType: K, event?: EventMap[K]) {
        this.events.dispatch(eventType, event);
    }

    private onLayoutComplete() {
        this.toolbar.updateButtons(this.buttons.toJson() as any);
    }

    private onButtonPress(button: { value: any }, event: _ModuleSupport.MouseWidgetEvent<'click'>) {
        const datum = this.getActiveDatum();
        if (!datum) return;

        this.hideOverlays();

        switch (button.value) {
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
                    color: datum?.getDefaultColor(button.value),
                    opacity: datum?.getDefaultOpacity(button.value),
                    sourceEvent: event.sourceEvent,
                    onChange: datum != null ? this.onColorPickerChange.bind(this, button.value, datum) : undefined,
                    onChangeHide: ((type: AnnotationOptionsColorPickerType) => {
                        this.dispatch('save-color', {
                            type: datum.type,
                            colorPickerType: button.value as AnnotationOptionsColorPickerType,
                            color: datum.getDefaultColor(type),
                        });
                    }).bind(this, button.value),
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
                this.dispatch('pressed-delete');
                break;
            }

            case AnnotationOptions.Lock: {
                datum.locked = !datum.locked;
                this.toggleButtons();
                break;
            }

            case AnnotationOptions.Settings: {
                this.dispatch('pressed-settings', event);
                break;
            }
        }
    }

    private onToolbarMoved(event: {
        buttonBounds: Array<_ModuleSupport.BBoxValues>;
        popoverBounds: _ModuleSupport.BBoxValues;
    }) {
        const { buttonBounds, popoverBounds } = event;

        this.hideOverlays();

        const colorPickerAnchor = { x: popoverBounds.x, y: popoverBounds.y + popoverBounds.height + 4 };
        const colorPickerFallbackAnchor = { y: popoverBounds.y - 4 };
        this.colorPicker.setAnchor(colorPickerAnchor, colorPickerFallbackAnchor);

        for (const [index, bounds] of buttonBounds.entries()) {
            const button = this.buttons.at(index);
            if (!button) continue;

            const anchor = { x: bounds.x, y: bounds.y + bounds.height - 1 };
            const fallbackAnchor = { y: bounds.y };

            switch (button.value) {
                case AnnotationOptions.LineStrokeWidth:
                    this.lineStrokeWidthMenu.setAnchor(anchor, fallbackAnchor);
                    break;

                case AnnotationOptions.LineStyleType:
                    this.lineStyleTypeMenu.setAnchor(anchor, fallbackAnchor);
                    break;

                case AnnotationOptions.TextSize:
                    this.textSizeMenu.setAnchor(anchor, fallbackAnchor);
                    break;
            }
        }
    }

    private onColorPickerChange(
        colorPickerType: AnnotationOptionsColorPickerType,
        datum: AnnotationProperties,
        colorOpacity: string,
        color: string,
        opacity: number
    ) {
        this.dispatch('update-color', { type: datum.type, colorPickerType, colorOpacity, color, opacity });
        this.updateColorPickerFill(colorPickerType, colorOpacity);
    }

    private onTextSizeMenuPress(item: _ModuleSupport.MenuItem<number>, datum?: AnnotationProperties) {
        if (!hasFontSize(datum)) return;

        const fontSize = item.value;
        this.dispatch('update-font-size', { type: datum.type, fontSize });
        this.textSizeMenu.hide();
        this.updateFontSize(fontSize);
    }

    private onLineStyleTypeMenuPress(
        item: _ModuleSupport.MenuItem<AgAnnotationLineStyleType>,
        datum?: AnnotationProperties
    ) {
        if (!hasLineStyle(datum)) return;

        const type = item.value;
        this.dispatch('update-line-style', { type: datum.type, lineStyleType: type });
        this.lineStyleTypeMenu.hide();
        this.updateLineStyleType(item);
    }

    private onLineStrokeWidthMenuPress(item: _ModuleSupport.MenuItem<number>, datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) {
            return;
        }

        const strokeWidth = item.value;
        this.dispatch('update-line-width', { type: datum.type, strokeWidth });
        this.lineStrokeWidthMenu.hide();
        this.updateStrokeWidth(item);
    }

    private updateLineStyles(datum: AnnotationProperties) {
        if (!hasLineStyle(datum)) {
            return;
        }
        const strokeWidth = datum.strokeWidth ?? 1;
        const lineStyleType = getLineStyle(datum.lineDash, datum.lineStyle);

        this.updateStrokeWidth({
            strokeWidth,
            value: strokeWidth,
            label: String(strokeWidth),
        });

        this.updateLineStyleType(
            LINE_STYLE_TYPE_ITEMS.find((item) => item.value === lineStyleType) ?? LINE_STYLE_TYPE_ITEMS[0]
        );
    }

    private updateButtonByValue(value: AnnotationOptions, change: Partial<AnnotationOptionsButtonOptions>) {
        const index = this.buttons.findIndex((button) => button.value === value);
        const button = this.buttons.at(index)!;
        this.buttons[index].set({ ...button.toJson(), value, ...change });
        this.toolbar.updateButtonByIndex(index, { ...button.toJson(), value, ...change });
    }
}
