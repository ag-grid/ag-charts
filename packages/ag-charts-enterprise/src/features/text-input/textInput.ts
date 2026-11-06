import { _ModuleSupport } from 'ag-charts-community';
import {
    BBox,
    CleanupRegistry,
    ContentEditableWidget,
    type DynamicContext,
    type KeyboardWidgetEvent,
    NativeWidget,
    type NormalisedTextOptions,
    type Point,
    ceilTo,
} from 'ag-charts-core';
import type { TextAlign } from 'ag-charts-types';

import type { AnnotationTextPosition } from '../annotations/text/util';

const moduleId = 'text-input';
const canvasOverlay = 'canvas-overlay';

export interface TextInputLayout {
    getTextInputCoords: (height: number) => Point;
    getTextPosition: () => AnnotationTextPosition;
    alignment: 'left' | 'center' | 'right';
    textAlign: TextAlign;
    width?: number;
}

export class TextInput {
    private readonly cleanup = new CleanupRegistry();
    private readonly container: NativeWidget;
    private textArea?: ContentEditableWidget;
    private layout: TextInputLayout = {
        getTextInputCoords: () => ({ x: 0, y: 0 }),
        getTextPosition: () => 'center',
        alignment: 'center',
        textAlign: 'center',
    };
    private visible = false;

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        // TODO: Phase 3 "Common Widget Ancestor" - DOMManager hands out this container as an element, not a Widget
        this.container = new NativeWidget(ctx.domManager.addChild(canvasOverlay, moduleId));
        this.container.addClass('ag-charts-text-input');

        this.cleanup.register(() => ctx.domManager.removeChild(canvasOverlay, moduleId));
    }

    public setKeyDownHandler(handler: (e: KeyboardEvent) => unknown) {
        this.cleanup.register(
            this.container.addListener('keydown', ({ sourceEvent }: KeyboardWidgetEvent) => handler(sourceEvent))
        );
    }

    public show(opts: {
        anchor?: { x: number; y: number };
        text?: string;
        placeholderText?: string;
        styles?: NormalisedTextOptions & { placeholderColor?: string };
        layout?: TextInputLayout;
        onChange?: (text: string, bbox: BBox) => void;
        onClose?: (text: string) => void;
    }) {
        // A fresh text area per edit, so no inline style or listener carries over from the previous one.
        this.textArea?.destroy();
        const textArea = new ContentEditableWidget(this.ctx.agDocument.document, 'ag-charts-text-input__textarea');
        this.textArea = textArea;
        this.container.addChild(textArea);

        textArea.setPlaceholder(this.ctx.localeManager.t(opts.placeholderText ?? 'inputTextareaPlaceholder'));

        if (opts.styles?.placeholderColor != null) {
            textArea.setCSSVariable('--placeholder-text-color', opts.styles?.placeholderColor);
        }

        textArea.text = opts.text ?? '';
        textArea.setTextStyle({
            color: opts.styles?.color ?? 'inherit',
            fontFamily: opts.styles?.fontFamily ?? 'inherit',
            fontSize: opts.styles?.fontSize == null ? 'inherit' : `${opts.styles.fontSize}px`,
            fontStyle: opts.styles?.fontStyle ?? 'inherit',
            lineHeight: opts.styles?.lineHeight == null ? '' : `${opts.styles.lineHeight}px`,
            fontWeight:
                typeof opts.styles?.fontWeight === 'number'
                    ? `${opts.styles.fontWeight}`
                    : (opts.styles?.fontWeight ?? 'inherit'),
        });

        textArea.focusCursorAtEnd();

        textArea.addListener('input', () => {
            this.updatePosition();
            opts.onChange?.(this.getValue()!, this.getBBox());
        });

        if (opts.layout) {
            this.layout = opts.layout;
            this.updatePosition();
        }

        opts.onChange?.(this.getValue()!, this.getBBox());
        this.visible = true;
    }

    public hide() {
        this.textArea?.destroy();
        this.textArea = undefined;
        this.layout = {
            getTextInputCoords: () => ({ x: 0, y: 0 }),
            getTextPosition: () => 'center',
            alignment: 'center',
            textAlign: 'center',
        };
        this.visible = false;
    }

    public isVisible() {
        return this.visible;
    }

    public updateColor(color: string) {
        this.textArea?.setTextStyle({ color });
    }

    public updateFontSize(fontSize: number, lineHeight: number | undefined) {
        const { textArea } = this;
        if (!textArea) return;
        textArea.setTextStyle({
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight == null ? '' : `${lineHeight}px`,
        });
        this.updatePosition();
        return this.getBBox();
    }

    public getValue() {
        return this.textArea?.text.trim();
    }

    private updatePosition() {
        const { container, textArea } = this;

        if (!textArea) return;

        const sceneRect = this.ctx.domManager.getBoundingClientRect();
        const { width, getTextInputCoords, getTextPosition, alignment, textAlign } = this.layout;

        // must be set before getting `textArea` bounding rect
        container.setWidth(width == null || width === 0 ? undefined : width);

        const textRect = textArea.getBoundingClientRect();

        const point = getTextInputCoords(textRect.height);
        let horizontalPosition = point.x;
        if (alignment === 'center') {
            horizontalPosition -= (width ?? textRect.width) / 2;
        } else if (alignment === 'right') {
            horizontalPosition -= width ?? textRect.width;
        }

        const position = getTextPosition();
        let verticalPosition = point.y;
        if (position === 'center') {
            verticalPosition -= textRect.height / 2;
        } else if (position === 'bottom') {
            verticalPosition -= textRect.height;
        }

        container.setCssOffset({ x: horizontalPosition, y: verticalPosition });
        container.setMaxWidth(sceneRect.width - horizontalPosition);
        container.setTextAlign(alignment);
        textArea.setTextAlign(textAlign);
    }

    public getBBox() {
        const { left, top, width, height } = this.container.getBoundingClientRect();
        // Ceil the width to 2dp to fix floating point issues with dropping last character onto next line after
        // converting text to canvas.
        return new BBox(left, top, ceilTo(width, 2), height);
    }

    public destroy() {
        this.cleanup.flush();
    }
}
