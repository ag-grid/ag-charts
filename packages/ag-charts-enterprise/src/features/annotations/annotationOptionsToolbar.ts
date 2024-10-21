import { type AgAnnotationLineStyleType, _ModuleSupport, _Util } from 'ag-charts-community';

import { Menu, type MenuItem } from '../../components/menu/menu';
import { ColorPicker } from '../color-picker/colorPicker';
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

const { ToolbarManager, Vec2 } = _ModuleSupport;

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

export class AnnotationOptionsToolbar
    extends _ModuleSupport.BaseModuleInstance
    implements _ModuleSupport.ModuleInstance
{
    private readonly events = new _ModuleSupport.Listeners<keyof EventMap, any>();

    private readonly colorPicker = new ColorPicker(this.ctx);
    private readonly textSizeMenu = new Menu(this.ctx, 'text-size');
    private readonly lineStyleTypeMenu = new Menu(this.ctx, 'annotations-line-style-type');
    private readonly lineStrokeWidthMenu = new Menu(this.ctx, 'annotations-line-stroke-width');

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly getActiveDatum: () => AnnotationProperties | undefined
    ) {
        super();

        const { toolbarManager } = ctx;

        this.destroyFns.push(
            toolbarManager.addListener('button-pressed', this.onButtonPress.bind(this)),
            toolbarManager.addListener('button-moved', this.onButtonMoved.bind(this)),
            toolbarManager.addListener('group-moved', this.onGroupMoved.bind(this)),

            () => this.colorPicker.destroy()
        );
    }

    public addListener<K extends keyof EventMap>(eventType: K, handler: (event: EventMap[K]) => void) {
        return this.events.addListener(eventType, handler);
    }

    public toggleVisibility(visible: boolean) {
        this.ctx.toolbarManager.toggleGroup('annotations', 'annotationOptions', { visible });
    }

    public toggleAnnotationOptionsButtons() {
        const {
            ctx: { toolbarManager },
        } = this;

        const datum = this.getActiveDatum();
        if (!datum) return;

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

        this.updateFontSize(datum != null && 'fontSize' in datum ? datum.fontSize : undefined);
        this.updateFills();
        this.updateLineStyles(datum);
    }

    public setAnchorScene(scene: AnnotationScene) {
        this.ctx.toolbarManager.changeFloatingAnchor('annotationOptions', scene.getAnchor());
    }

    public hideOverlays() {
        this.colorPicker.hide({ lastFocus: null });
        this.textSizeMenu.hide();
        this.lineStyleTypeMenu.hide();
        this.lineStrokeWidthMenu.hide();
    }

    public updateColorPickerFill(colorPickerType: AnnotationOptionsColorPickerType, color?: string, opacity?: number) {
        if (color != null && opacity != null) {
            const { r, g, b } = _Util.Color.fromString(color);
            color = _Util.Color.fromArray([r, g, b, opacity]).toHexString();
        }
        this.ctx.toolbarManager.updateButton('annotationOptions', colorPickerType, {
            fill: color,
        });
    }

    public updateFills() {
        const datum = this.getActiveDatum();

        this.updateColorPickerFill(
            AnnotationOptions.LineColor,
            datum?.getDefaultColor(AnnotationOptions.LineColor),
            datum?.getDefaultOpacity(AnnotationOptions.LineColor)
        );
        this.updateColorPickerFill(
            AnnotationOptions.FillColor,
            datum?.getDefaultColor(AnnotationOptions.FillColor),
            datum?.getDefaultOpacity(AnnotationOptions.FillColor)
        );
        this.updateColorPickerFill(
            AnnotationOptions.TextColor,
            datum?.getDefaultColor(AnnotationOptions.TextColor),
            datum?.getDefaultOpacity(AnnotationOptions.TextColor)
        );
    }

    public updateFontSize(fontSize: number | undefined) {
        this.ctx.toolbarManager.updateButton('annotationOptions', AnnotationOptions.TextSize, {
            label: fontSize != null ? String(fontSize) : undefined,
        });
    }

    public updateLineStyleType(item: MenuItem<AgAnnotationLineStyleType>) {
        this.ctx.toolbarManager.updateButton('annotationOptions', AnnotationOptions.LineStyleType, {
            icon: item.icon,
        });
    }

    public updateStrokeWidth(item: MenuItem<number>) {
        this.ctx.toolbarManager.updateButton('annotationOptions', AnnotationOptions.LineStrokeWidth, {
            label: item.label,
            strokeWidth: item.value,
        });
    }

    private dispatch<K extends keyof EventMap>(eventType: K, event?: EventMap[K]) {
        this.events.dispatch(eventType, event);
    }

    private onButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('annotationOptions', event)) return;

        const datum = this.getActiveDatum();
        if (!datum) return;

        this.hideOverlays();

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
                        this.dispatch('save-color', {
                            type: datum.type,
                            colorPickerType: event.value as AnnotationOptionsColorPickerType,
                            color: datum.getDefaultColor(type),
                        });
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
                this.dispatch('pressed-delete');
                break;
            }

            case AnnotationOptions.Lock: {
                datum.locked = !datum.locked;
                this.toggleAnnotationOptionsButtons();
                break;
            }

            case AnnotationOptions.Settings: {
                this.dispatch('pressed-settings', { sourceEvent: event.sourceEvent });
                break;
            }
        }
    }

    private onButtonMoved(event: _ModuleSupport.ToolbarButtonMovedEvent) {
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

            case AnnotationOptions.LineStrokeWidth:
                this.lineStrokeWidthMenu.setAnchor(anchor);
                break;

            case AnnotationOptions.LineStyleType:
                this.lineStyleTypeMenu.setAnchor(anchor);
                break;

            case AnnotationOptions.TextSize:
                this.textSizeMenu.setAnchor(anchor);
                break;
        }
    }

    private onGroupMoved(_event: _ModuleSupport.ToolbarGroupMovedEvent) {
        this.hideOverlays();
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

    private onTextSizeMenuPress(item: MenuItem<number>, datum?: AnnotationProperties) {
        if (!hasFontSize(datum)) return;

        const fontSize = item.value;
        this.dispatch('update-font-size', { type: datum.type, fontSize });
        this.textSizeMenu.hide();
        this.updateFontSize(fontSize);
    }

    private onLineStyleTypeMenuPress(item: MenuItem<AgAnnotationLineStyleType>, datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) return;

        const type = item.value;
        this.dispatch('update-line-style', { type: datum.type, lineStyleType: type });
        this.lineStyleTypeMenu.hide();
        this.updateLineStyleType(item);
    }

    private onLineStrokeWidthMenuPress(item: MenuItem<number>, datum?: AnnotationProperties) {
        if (!hasLineStyle(datum)) {
            return;
        }

        const strokeWidth = item.value;
        this.dispatch('update-line-width', { type: datum.type, strokeWidth });
        this.lineStrokeWidthMenu.hide();
        this.updateStrokeWidth(item);
    }

    private updateLineStyles(datum?: AnnotationProperties) {
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
}
