import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import type { FontOptions } from 'ag-charts-types';

import textInputTemplate from './textInputTemplate.html';

const moduleId = 'color-picker';
const canvasOverlay = 'canvas-overlay';

interface LayoutBBox {
    bbox: _Scene.BBox;
    position: 'top' | 'center' | 'bottom';
    alignment: 'left' | 'center' | 'right';
}

export class TextInput extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly element: HTMLElement;
    private layout: LayoutBBox = {
        bbox: _Scene.BBox.zero,
        position: 'center',
        alignment: 'center',
    };

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.element = ctx.domManager.addChild(canvasOverlay, moduleId);
        this.element.classList.add('ag-charts-text-input');

        this.destroyFns.push(() => ctx.domManager.removeChild(canvasOverlay, moduleId));
    }

    public show(opts: {
        anchor?: { x: number; y: number };
        text?: string;
        styles?: FontOptions;
        onChange?: (text: string) => void;
        onClose?: (text: string) => void;
    }) {
        this.element.innerHTML = textInputTemplate;

        const textArea = this.element.firstElementChild! as HTMLTextAreaElement;

        textArea.innerText = opts.text ?? '';

        textArea.style.color = opts.styles?.color ?? 'inherit';
        textArea.style.fontFamily = opts.styles?.fontFamily ?? 'inherit';
        textArea.style.fontSize = opts.styles?.fontSize ? `${opts.styles.fontSize}px` : 'inherit';
        textArea.style.fontStyle = opts.styles?.fontStyle ?? 'inherit';
        textArea.style.fontWeight =
            typeof opts.styles?.fontWeight === 'number'
                ? `${opts.styles.fontWeight}`
                : opts.styles?.fontWeight ?? 'inherit';

        textArea.focus();

        textArea.oninput = () => {
            this.updatePosition();
            opts.onChange?.(textArea.innerText);
        };
    }

    public hide() {
        this.element.innerHTML = '';
        this.layout = {
            bbox: _Scene.BBox.zero,
            position: 'center',
            alignment: 'center',
        };
    }

    public setLayout(layout: LayoutBBox) {
        this.layout = layout;
        this.updatePosition();
    }

    public getValue() {
        if (!this.element.firstElementChild) return;
        return (this.element.firstElementChild as HTMLTextAreaElement).innerText;
    }

    private updatePosition() {
        const { element, layout } = this;
        const { bbox, position, alignment } = layout;

        const textArea = element.firstElementChild as HTMLTextAreaElement | undefined;

        const height = textArea?.offsetHeight ?? bbox.height;
        const width = textArea?.offsetWidth ?? bbox.width;

        switch (position) {
            case 'top':
                element.style.setProperty('top', `${bbox.y}px`);
                break;
            case 'center':
                element.style.setProperty('top', `${bbox.y - height / 2}px`);
                break;
            case 'bottom':
                element.style.setProperty('top', `${bbox.y - height}px`);
                break;
        }

        switch (alignment) {
            case 'left':
                element.style.setProperty('left', `${bbox.x}px`);
                element.style.setProperty('right', 'unset');
                textArea?.style.setProperty('text-align', 'left');
                break;
            case 'center':
                element.style.setProperty('left', `${bbox.x - width / 2}px`);
                element.style.setProperty('right', 'unset');
                textArea?.style.setProperty('text-align', 'center');
                break;
            case 'right':
                element.style.setProperty('left', 'unset');
                element.style.setProperty('right', `${bbox.x}px`);
                textArea?.style.setProperty('text-align', 'right');
                break;
        }
    }
}
