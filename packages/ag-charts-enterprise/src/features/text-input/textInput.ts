import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import type { FontOptions, TextAlign } from 'ag-charts-types';

import type { AnnotationTextPosition } from '../annotations/text/util';
import textInputTemplate from './textInputTemplate.html';

const { focusCursorAtEnd } = _ModuleSupport;

const moduleId = 'text-input';
const canvasOverlay = 'canvas-overlay';

interface Layout {
    getTextInputCoords: () => _Util.Vec2;
    position: AnnotationTextPosition;
    alignment: 'left' | 'center' | 'right';
    textAlign: TextAlign;
    width?: number;
}

export class TextInput extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly element: HTMLElement;
    private layout: Layout = {
        getTextInputCoords: () => ({ x: 0, y: 0 }),
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
        styles?: FontOptions & { placeholderColor?: string };
        layout?: Layout;
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

        textArea.setAttribute('placeholder', 'Add Text');

        if (opts.styles?.placeholderColor) {
            textArea.style.setProperty('--ag-charts-input-placeholder', opts.styles?.placeholderColor);
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

        focusCursorAtEnd(textArea);

        textArea.addEventListener('input', () => {
            this.updatePosition();
            opts.onChange?.(this.getValue()!, this.getBBox());
        });

        textArea.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        if (opts.layout) {
            this.layout = opts.layout;
            this.updatePosition();
        }

        opts.onChange?.(this.getValue()!, this.getBBox());
    }

    public hide() {
        this.element.innerHTML = '';
        this.layout = {
            getTextInputCoords: () => ({ x: 0, y: 0 }),
            position: 'center',
            alignment: 'center',
            textAlign: 'center',
        };
    }

    public updateColor(color: string) {
        if (!this.element.firstElementChild) return;
        (this.element.firstElementChild as HTMLDivElement).style.color = color;
    }

    public updateFontSize(fontSize: number) {
        if (!this.element.firstElementChild) return;
        (this.element.firstElementChild as HTMLDivElement).style.fontSize = `${fontSize}px`;
        this.updatePosition();
        return this.getBBox();
    }

    public getValue() {
        if (!this.element.firstElementChild) return;
        return (this.element.firstElementChild as HTMLDivElement).innerText.trim();
    }

    private updatePosition() {
        const { element } = this;
        const textArea = element.firstElementChild as HTMLDivElement | undefined;

        if (!textArea) return;

        const sceneRect = this.ctx.domManager.getBoundingClientRect();
        const { width, getTextInputCoords, position, alignment, textAlign } = this.layout;

        // must be set before getting `textArea` bounding rect
        element.style.setProperty('width', width ? `${width}px` : 'unset');

        const textRect = textArea.getBoundingClientRect();

        const point = getTextInputCoords();
        let horizontalPosition = point.x;
        if (alignment === 'center') {
            horizontalPosition -= (width ?? textRect.width) / 2;
        } else if (alignment === 'right') {
            horizontalPosition -= width ?? textRect.width;
        }

        let verticalPosition = point.y;
        if (position === 'center') {
            verticalPosition -= textRect.height / 2;
        } else if (position === 'bottom') {
            verticalPosition -= textRect.height;
        }

        element.style.setProperty('top', `${verticalPosition}px`);
        element.style.setProperty('left', `${horizontalPosition}px`);
        element.style.setProperty('max-width', `${sceneRect.width - horizontalPosition}px`);
        element.style.setProperty('text-align', alignment);
        textArea.style.setProperty('text-align', textAlign);
    }

    private getBBox() {
        const { left, top, width, height } = this.element.getBoundingClientRect();
        return new _Scene.BBox(left, top, width, height);
    }
}
