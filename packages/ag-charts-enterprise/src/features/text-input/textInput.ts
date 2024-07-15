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

        const textArea = this.element.firstElementChild! as HTMLDivElement;

        // FireFox does not yet support `contenteditable="plaintext-only", so it defaults to false and has to be
        // added back on to the element as the normal richtext version. The plaintext version is preferred as
        // it handles newlines better without requiring any custom text processing.
        // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1291467
        if (!textArea.isContentEditable) {
            textArea.contentEditable = 'true';
        }

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

        // Set the cursor to the end of the text
        if (textArea.lastChild?.textContent != null) {
            const range = document.createRange();
            range.setStart(textArea.lastChild, textArea.lastChild.textContent.length);
            range.setEnd(textArea.lastChild, textArea.lastChild.textContent.length);

            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        }

        textArea.oninput = () => {
            this.updatePosition();
            opts.onChange?.(this.getValue()!);
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
        return (this.element.firstElementChild as HTMLDivElement).innerText.trim();
    }

    private updatePosition() {
        const { element, layout } = this;
        const { bbox, position, alignment } = layout;

        const textArea = element.firstElementChild as HTMLDivElement | undefined;

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

        // TODO: shush sonarqube
        const textAlign = 'text-align';

        switch (alignment) {
            case 'left':
                element.style.setProperty('left', `${bbox.x}px`);
                textArea?.style.setProperty(textAlign, 'left');
                break;
            case 'center':
                element.style.setProperty('left', `${bbox.x - width / 2}px`);
                textArea?.style.setProperty(textAlign, 'center');
                break;
            case 'right':
                element.style.setProperty('left', `${bbox.x - width}px`);
                textArea?.style.setProperty(textAlign, 'right');
                break;
        }
    }
}
