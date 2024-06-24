import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import colorPickerStyles from './colorPickerStyles.css';
import colorPickerTemplate from './colorPickerTemplate.html';

const { createElement } = _ModuleSupport;

const { Color } = _Util;

const moduleId = 'color-picker';
const canvasOverlay = 'canvas-overlay';

const getHsva = (input: string) => {
    try {
        const color = Color.fromString(input);
        const [h, s, v] = color.toHSB();
        return [h, s, v, color.a];
    } catch {
        return;
    }
};

export class ColorPicker extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly element: HTMLElement;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        ctx.domManager.addStyles(moduleId, colorPickerStyles);

        this.element = ctx.domManager.addChild(canvasOverlay, moduleId);

        this.destroyFns.push(() => ctx.domManager.removeChild(canvasOverlay, moduleId));
    }

    show(opts: { anchor?: { x: number; y: number }; color?: string; onChange?: (colorString: string) => void }) {
        let [h, s, v, a] = getHsva(opts.color ?? '#f00') ?? [0, 1, 0.5, 1];

        const colorPickerContainer = createElement('div');
        colorPickerContainer.innerHTML = colorPickerTemplate;
        this.element.replaceChildren(colorPickerContainer);

        const colorPicker = colorPickerContainer.firstElementChild! as HTMLDivElement;

        const paletteInput = colorPicker.querySelector<HTMLDivElement>('.ag-charts-color-picker__palette')!;
        const hueInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__hue-input')!;
        const alphaInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__alpha-input')!;
        const colorInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__color-input')!;

        if (opts.anchor) {
            colorPicker.style.setProperty('left', `${opts.anchor.x}px`);
            colorPicker.style.setProperty('top', `${opts.anchor.y}px`);
        }

        const update = () => {
            const color = Color.fromHSB(h, s, v, a);
            const colorString = color.toHexString();

            colorPicker.style.setProperty('--h', `${h}`);
            colorPicker.style.setProperty('--s', `${s}`);
            colorPicker.style.setProperty('--v', `${v}`);
            colorPicker.style.setProperty('--a', `${a}`);
            colorPicker.style.setProperty('--color', colorString.slice(0, 7));
            colorPicker.style.setProperty('--color-a', colorString);

            hueInput.value = `${h}`;
            alphaInput.value = `${a}`;

            alphaInput.classList.toggle('ag-charts-color-picker__alpha-input--opaque', a === 1);

            if (document.activeElement !== colorInput) {
                colorInput.value = colorString.toUpperCase();
            }

            opts.onChange?.(colorString);
        };

        update();

        const beginPaletteInteraction = (e: MouseEvent) => {
            e.preventDefault();
            const currentTarget = e.currentTarget as HTMLDivElement;
            currentTarget.focus();
            const rect = currentTarget.getBoundingClientRect();

            const mouseMove = ({ pageX, pageY }: MouseEvent) => {
                s = Math.min(Math.max((pageX - rect.left) / rect.width, 0), 1);
                v = 1 - Math.min(Math.max((pageY - rect.top) / rect.height, 0), 1);
                update();
            };

            mouseMove(e);

            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('mouseup', () => window.removeEventListener('mousemove', mouseMove), {
                once: true,
            });
        };

        (['mousedown', 'keydown'] as const).forEach((eventName) => {
            colorPicker.addEventListener(eventName, (e) => {
                e.stopPropagation();
            });
        });
        paletteInput.addEventListener('mousedown', beginPaletteInteraction);
        paletteInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                s = Math.min(Math.max(s - 0.01), 1);
            } else if (e.key === 'ArrowRight') {
                s = Math.min(Math.max(s + 0.01), 1);
            } else if (e.key === 'ArrowUp') {
                v = Math.min(Math.max(v + 0.01), 1);
            } else if (e.key === 'ArrowDown') {
                v = Math.min(Math.max(v - 0.01), 1);
            } else {
                return;
            }
            e.preventDefault();
            update();
        });
        hueInput.addEventListener('input', (e) => {
            h = (e.currentTarget as HTMLInputElement).valueAsNumber ?? 0;
            update();
        });
        alphaInput.addEventListener('input', (e) => {
            a = (e.currentTarget as HTMLInputElement).valueAsNumber ?? 0;
            update();
        });
        colorInput.addEventListener('input', (e) => {
            const hsva = getHsva((e.currentTarget as HTMLInputElement).value);
            if (hsva == null) return;
            [h, s, v, a] = hsva;
            update();
        });
        colorInput.addEventListener('blur', () => update());
        colorInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                (e.currentTarget as HTMLInputElement).blur();
                update();
            }
        });
    }

    setAnchor(anchor: { x: number; y: number }) {
        const colorPicker = this.element.firstElementChild?.firstElementChild as HTMLDivElement | undefined;
        if (colorPicker) {
            colorPicker.style.setProperty('left', `${anchor.x}px`);
            colorPicker.style.setProperty('top', `${anchor.y}px`);
        }
    }

    hide() {
        this.element.replaceChildren();
    }

    isChildElement(element: HTMLElement) {
        return this.ctx.domManager.isManagedChildDOMElement(element, canvasOverlay, moduleId);
    }
}
