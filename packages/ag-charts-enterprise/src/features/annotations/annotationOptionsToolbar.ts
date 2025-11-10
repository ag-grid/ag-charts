import { type AgAnnotationLineStyleType, _ModuleSupport } from 'ag-charts-community';
import {
    BaseProperties,
    type BoxBounds,
    CleanupRegistry,
    Color,
    EventEmitter,
    PropertiesArray,
    Property,
} from 'ag-charts-core';

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

const { FloatingToolbar, Menu, ToolbarButtonProperties, ToolbarButtonWidget } = _ModuleSupport;
interface EventMap {
    'pressed-delete': null;
    'pressed-settings': { sourceEvent: Event };
    'pressed-lock': { locked: boolean };
    'hid-overlays': null;
    'saved-color': {
        type: HasColorAnnotationType;
        colorPickerType: AnnotationOptionsColorPickerType;
        color: string | undefined;
    };
    'updated-color': {
        type: HasColorAnnotationType;
        colorPickerType: AnnotationOptionsColorPickerType;
        colorOpacity: string;
        color: string;
        opacity: number;
        isMultiColor: boolean;
    };
    'updated-font-size': { type: HasFontSizeAnnotationType; fontSize: number };
    'updated-line-style': { type: HasLineStyleAnnotationType; lineStyleType: AgAnnotationLineStyleType };
    'updated-line-width': { type: HasLineStyleAnnotationType; strokeWidth: number };
}

class AnnotationOptionsButtonProperties extends ToolbarButtonProperties {
    @Property
    value!: AnnotationOptions;

    @Property
    checkedOverrides = new ToolbarButtonProperties();

    @Property
    color?: string;

    @Property
    strokeWidth?: number;

    @Property
    isMultiColor?: boolean;
}

interface AnnotationOptionsButtonOptions extends _ModuleSupport.ToolbarButtonOptions {
    value: AnnotationOptions;
    color?: string;
    strokeWidth?: number;
    isMultiColor?: boolean;
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
        element.classList.add('ag-charts-annotations__color-picker-button');
        element.classList.toggle('ag-charts-annotations__color-picker-button--multi-color', options.isMultiColor);
        element.style.setProperty('--color', options.color ?? null);
    }

    private updateLineStrokeWidth(options: AnnotationOptionsButtonOptions) {
        const element = this.getElement();
        element.classList.add('ag-charts-annotations__stroke-width-button');
        element.style.setProperty('--stroke-width', `${options.strokeWidth}px`);
    }
}

class FloatingAnnotationOptionsToolbar extends FloatingToolbar<
    AnnotationOptionsButtonOptions,
    AnnotationOptionsButtonWidget
> {
    protected override createButtonWidget() {
        return new AnnotationOptionsButtonWidget(this.localeManager);
    }
}

export class AnnotationOptionsToolbar extends BaseProperties {
    @Property
    public enabled?: boolean = true;

    @Property
    public buttons = new PropertiesArray(AnnotationOptionsButtonProperties);

    private readonly cleanup = new CleanupRegistry();

    readonly events = new EventEmitter<EventMap>();
    private visibleButtons: Array<AnnotationOptionsButtonProperties> = [];

    private readonly toolbar = new FloatingAnnotationOptionsToolbar(
        this.ctx,
        'ariaLabelAnnotationOptionsToolbar',
        'annotation-options'
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

        this.cleanup.register(
            this.toolbar.addToolbarListener('button-pressed', this.onButtonPress.bind(this)),
            this.toolbar.addToolbarListener('toolbar-moved', this.onToolbarMoved.bind(this)),
            ctx.widgets.seriesWidget.addListener('drag-start', this.onDragStart.bind(this)),
            ctx.widgets.seriesWidget.addListener('drag-end', this.onDragEnd.bind(this)),
            () => {
                this.colorPicker.destroy();
                this.toolbar.destroy();
            }
        );
    }

    private onDragStart() {
        this.toolbar.ignorePointerEvents();
    }

    private onDragEnd() {
        this.toolbar.capturePointerEvents();
    }

    public destroy() {
        this.cleanup.flush();
    }

    public show() {
        if (!this.enabled) return;
        this.toolbar.show();
    }

    public hide() {
        this.toolbar.hide();
    }

    public updateButtons(datum: AnnotationProperties) {
        if (!this.enabled) return;

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
        this.visibleButtons = this.buttons.filter((button) => visible[button.value]);

        this.toolbar.clearButtons();
        this.toolbar.updateButtons(this.visibleButtons);

        this.refreshButtons(datum);
    }

    public setAnchorScene(scene: AnnotationScene) {
        if (this.toolbar.hasBeenDragged()) return;
        this.toolbar.setAnchor(scene.getAnchor());
    }

    public hideOverlays() {
        this.toolbar.clearActiveButton();
        this.colorPicker.hide({ lastFocus: null });
        this.textSizeMenu.hide();
        this.lineStyleTypeMenu.hide();
        this.lineStrokeWidthMenu.hide();
        this.events.emit('hid-overlays', null);
    }

    public clearActiveButton() {
        this.toolbar.clearActiveButton();
    }

    private updateColors(datum: AnnotationProperties) {
        this.updateColorPickerColor(
            AnnotationOptions.LineColor,
            datum.getDefaultColor(AnnotationOptions.LineColor),
            datum.getDefaultOpacity(AnnotationOptions.LineColor),
            'isMultiColor' in datum && datum?.isMultiColor
        );
        this.updateColorPickerColor(
            AnnotationOptions.FillColor,
            datum.getDefaultColor(AnnotationOptions.FillColor),
            datum.getDefaultOpacity(AnnotationOptions.FillColor),
            'isMultiColor' in datum && datum?.isMultiColor
        );
        this.updateColorPickerColor(
            AnnotationOptions.TextColor,
            datum.getDefaultColor(AnnotationOptions.TextColor),
            datum.getDefaultOpacity(AnnotationOptions.TextColor),
            'isMultiColor' in datum && datum?.isMultiColor
        );
    }

    public updateColorPickerColor(
        colorPickerType: AnnotationOptionsColorPickerType,
        color?: string,
        opacity?: number,
        isMultiColor?: boolean
    ) {
        if (color != null && opacity != null) {
            const { r, g, b } = Color.fromString(color);
            color = Color.fromArray([r, g, b, opacity]).toHexString();
        }
        this.updateButtonByValue(colorPickerType as any, { color, isMultiColor });
    }

    private updateFontSize(fontSize: number | undefined) {
        this.updateButtonByValue(AnnotationOptions.TextSize, {
            label: fontSize == null ? undefined : String(fontSize),
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

    private onButtonPress({
        event,
        button,
        buttonWidget,
    }: _ModuleSupport.ToolbarEventMap<AnnotationOptionsButtonOptions>['button-pressed']) {
        const datum = this.getActiveDatum();
        if (!datum) return;

        this.hideOverlays();

        switch (button.value) {
            case AnnotationOptions.LineStyleType: {
                const lineStyle = hasLineStyle(datum) ? getLineStyle(datum.lineDash, datum.lineStyle) : undefined;
                this.lineStyleTypeMenu.show<AgAnnotationLineStyleType>(buttonWidget, {
                    items: LINE_STYLE_TYPE_ITEMS,
                    ariaLabel: this.ctx.localeManager.t('toolbarAnnotationsLineStyle'),
                    value: lineStyle,
                    onPress: (item) => this.onLineStyleTypeMenuPress(item, datum),
                    class: 'ag-charts-annotations__line-style-type-menu',
                });
                break;
            }

            case AnnotationOptions.LineStrokeWidth: {
                const strokeWidth = hasLineStyle(datum) ? datum.strokeWidth : undefined;
                this.lineStrokeWidthMenu.show<number>(buttonWidget, {
                    items: LINE_STROKE_WIDTH_ITEMS,
                    ariaLabel: this.ctx.localeManager.t('toolbarAnnotationsLineStrokeWidth'),
                    value: strokeWidth,
                    onPress: (item) => this.onLineStrokeWidthMenuPress(item, datum),
                    class: 'ag-charts-annotations__line-stroke-width-menu',
                });
                break;
            }

            case AnnotationOptions.LineColor:
            case AnnotationOptions.FillColor:
            case AnnotationOptions.TextColor: {
                this.toolbar.toggleActiveButtonByIndex(button.index);
                this.colorPicker.show({
                    color: datum?.getDefaultColor(button.value),
                    opacity: datum?.getDefaultOpacity(button.value),
                    sourceEvent: event.sourceEvent,
                    hasMultiColorOption: 'isMultiColor' in datum,
                    isMultiColor: 'isMultiColor' in datum && datum?.isMultiColor,
                    onChange: datum == null ? undefined : this.onColorPickerChange.bind(this, button.value, datum),
                    onChangeHide: ((type: AnnotationOptionsColorPickerType) => {
                        this.events.emit('saved-color', {
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
                this.textSizeMenu.show<number>(buttonWidget, {
                    items: TEXT_SIZE_ITEMS,
                    ariaLabel: this.ctx.localeManager.t('toolbarAnnotationsTextSize'),
                    value: fontSize,
                    onPress: (item) => this.onTextSizeMenuPress(item, datum),
                    class: 'ag-charts-annotations__text-size-menu',
                });
                break;
            }

            case AnnotationOptions.Delete: {
                this.events.emit('pressed-delete', null);
                break;
            }

            case AnnotationOptions.Lock: {
                datum.locked = !datum.locked;
                this.refreshButtons(datum);
                this.events.emit('pressed-lock', { locked: datum.locked });
                break;
            }

            case AnnotationOptions.Settings: {
                this.toolbar.toggleActiveButtonByIndex(button.index);
                this.events.emit('pressed-settings', event);
                break;
            }
        }
    }

    private onToolbarMoved(event: { buttonBounds: BoxBounds[]; popoverBounds: BoxBounds }) {
        const { buttonBounds, popoverBounds } = event;

        const colorPickerAnchor = { x: popoverBounds.x, y: popoverBounds.y + popoverBounds.height + 4 };
        const colorPickerFallbackAnchor = { y: popoverBounds.y - 4 };
        this.colorPicker.setAnchor(colorPickerAnchor, colorPickerFallbackAnchor);

        for (const [index, bounds] of buttonBounds.entries()) {
            const button = this.visibleButtons.at(index);
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
        opacity: number,
        isMultiColor: boolean
    ) {
        this.events.emit('updated-color', {
            type: datum.type,
            colorPickerType,
            colorOpacity,
            color,
            opacity,
            isMultiColor,
        });
        this.updateColorPickerColor(colorPickerType, colorOpacity, opacity, isMultiColor);
    }

    private onTextSizeMenuPress(item: _ModuleSupport.MenuItem<number>, datum?: AnnotationProperties) {
        if (!hasFontSize(datum)) return;

        const fontSize = item.value;
        this.events.emit('updated-font-size', { type: datum.type, fontSize });
        this.textSizeMenu.hide();
        this.updateFontSize(fontSize);
    }

    private onLineStyleTypeMenuPress(
        item: _ModuleSupport.MenuItem<AgAnnotationLineStyleType>,
        datum?: AnnotationProperties
    ) {
        if (!hasLineStyle(datum)) return;

        const type = item.value;
        this.events.emit('updated-line-style', { type: datum.type, lineStyleType: type });
        this.lineStyleTypeMenu.hide();
        this.updateLineStyleType(item);
    }

    private onLineStrokeWidthMenuPress(item: _ModuleSupport.MenuItem<number>, datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) {
            return;
        }

        const strokeWidth = item.value;
        this.events.emit('updated-line-width', { type: datum.type, strokeWidth });
        this.lineStrokeWidthMenu.hide();
        this.updateStrokeWidth(item);
    }

    private refreshButtons(datum: AnnotationProperties) {
        const locked = datum.locked ?? false;

        for (const [index, button] of this.visibleButtons.entries()) {
            if (!button) continue;
            if (button.value === AnnotationOptions.Lock) {
                this.toolbar.toggleSwitchCheckedByIndex(index, locked);
                this.updateButtonByIndex(index, locked ? button.checkedOverrides.toJson() : button.toJson());
            } else {
                this.toolbar.toggleButtonEnabledByIndex(index, !locked);
            }
        }

        if (hasFontSize(datum)) this.updateFontSize(datum.fontSize);
        this.updateColors(datum);
        this.updateLineStyles(datum);
    }

    private updateLineStyles(datum: AnnotationProperties) {
        if (!hasLineStyle(datum)) return;

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
        const index = this.visibleButtons.findIndex((button) => button.value === value);
        if (index === -1) return;
        this.updateButtonByIndex(index, change);
    }

    private updateButtonByIndex(index: number, change: Partial<AnnotationOptionsButtonOptions>) {
        const button = this.visibleButtons.at(index);
        if (!button) return;
        this.toolbar.updateButtonByIndex(index, { ...button.toJson(), ...change, value: change.value ?? button.value });
    }
}
