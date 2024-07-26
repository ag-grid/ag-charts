import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import type { FontOptions, TextAlign } from 'ag-charts-types';

import textInputTemplate from './textInputTemplate.html';

const moduleId = 'text-input';
const canvasOverlay = 'canvas-overlay';

interface Layout {
    point: { x: number; y: number };
    position: 'top' | 'center' | 'bottom';
    alignment: 'left' | 'center' | 'right';
    textAlign: TextAlign;
}

export class TextInput extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly element: HTMLElement;
    private layout: Layout = {
        point: { x: 0, y: 0 },
        position: 'center',
        alignment: 'center',
        textAlign: 'center',
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
        onChange?: (text: string, bbox: _Scene.BBox) => void;
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
            opts.onChange?.(this.getValue()!, this.getBBox());
        };
    }

    public hide() {
        this.element.innerHTML = '';
        this.layout = {
            point: { x: 0, y: 0 },
            position: 'center',
            alignment: 'center',
            textAlign: 'center',
        };
    }

    public setLayout(layout: Layout) {
        this.layout = layout;
        this.updatePosition();
    }

    public getValue() {
        if (!this.element.firstElementChild) return;
        return (this.element.firstElementChild as HTMLDivElement).innerText.trim();
    }

    private updatePosition() {
        const {
            element,
            layout,
            ctx: { domManager },
        } = this;
        const { point, position, alignment, textAlign } = layout;

        const textArea = element.firstElementChild as HTMLDivElement | undefined;
        if (!textArea) return;

        const height = textArea?.offsetHeight;
        const width = textArea?.offsetWidth;

        const boundingRect = domManager.getBoundingClientRect();

        switch (position) {
            case 'top':
                element.style.setProperty('top', `${point.y}px`);
                break;
            case 'center':
                element.style.setProperty('top', `${point.y - height / 2}px`);
                break;
            case 'bottom':
                element.style.setProperty('top', `${point.y - height}px`);
                break;
        }

        function setProperties(position: number) {
            element.style.setProperty('left', `${position}px`);

            element.style.setProperty('text-align', alignment);
            textArea?.style.setProperty('text-align', textAlign);

            element.style.setProperty('max-width', `${boundingRect.width - position}px`);
        }

        switch (alignment) {
            case 'left':
                setProperties(point.x);
                break;
            case 'center':
                setProperties(point.x - width / 2);
                break;
            case 'right':
                setProperties(point.x - width);
                break;
        }
    }

    private getBBox() {
        const { element } = this;
        return new _Scene.BBox(element.offsetLeft, element.offsetTop, element.offsetWidth, element.offsetHeight);
    }
}
