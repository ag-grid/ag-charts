import { _ModuleSupport } from 'ag-charts-community';
import { Color, clamp } from 'ag-charts-core';

import colorPickerTemplate from './colorPickerTemplate.html';

export interface ColorPickerOptions extends _ModuleSupport.AnchoredPopoverOptions {
    color?: string;
    opacity?: number;
    isMultiColor?: boolean;
    hasMultiColorOption: boolean;
    sourceEvent: Event;
    onChange?: (colorOpacity: string, color: string, opacity: number, isMultiColor: boolean) => void;
    onChangeHide?: () => void;
}

const getHsva = (input: string) => {
    try {
        const color = Color.fromString(input);
        const [h, s, v] = color.toHSB();
        return [h, s, v, color.a];
    } catch {
        return;
    }
};

export class ColorPicker extends _ModuleSupport.AnchoredPopover<ColorPickerOptions> {
    private hasChanged = false;
    private onChangeHide?: () => void;
    private i18nUpdater?: () => void;

    constructor(ctx: _ModuleSupport.ModuleContext, options?: _ModuleSupport.PopoverConstructorOptions) {
        super(ctx, 'color-picker', options);
        this.hideFns.push(() => {
            this.i18nUpdater = undefined;
            if (this.hasChanged) this.onChangeHide?.();
        });
        this.cleanup.register(this.ctx.eventsHub.on('locale:change', () => this.i18nUpdater?.()));
    }

    public show(options: ColorPickerOptions) {
        this.hasChanged = false;
        this.onChangeHide = options.onChangeHide;

        const { element, initialFocus } = this.createColorPicker(options);
        const popover = this.showWithChildren([element], { initialFocus, ...options });
        popover.classList.add('ag-charts-color-picker');
        popover.setAttribute('role', 'dialog');
    }

    private createColorPicker(opts: ColorPickerOptions) {
        const { localeManager } = this.ctx;
        let isMultiColor = opts.isMultiColor ?? false;
        let [h, s, v, a] = getHsva(opts.color ?? '#f00') ?? [0, 1, 0.5, 1];
        a = opts.opacity ?? a;

        const doc = this.ctx.agDocument;
        const colorPicker = doc.createElement('div', 'ag-charts-color-picker__content');
        colorPicker.innerHTML = colorPickerTemplate;
        colorPicker.ariaLabel = this.ctx.localeManager.t('ariaLabelColorPicker');

        const paletteInput = colorPicker.querySelector<HTMLDivElement>('.ag-charts-color-picker__palette')!;
        const hueInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__hue-input')!;
        const multiColorButton = colorPicker.querySelector<HTMLButtonElement>(
            '.ag-charts-color-picker__multi-color-button'
        )!;
        const alphaInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__alpha-input')!;
        const colorInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__color-input')!;
        const colorInputLabel = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__color-label')!;

        // Update the 2D-slider to with the new S and V values. By default, announce S first followed by V. If the user
        // is arrowing up or down, then announce V first because it's more relevant.
        const updatePaletteInputAriaValue = (first: 's' | 'v') => {
            const key = ({ s: 'ariaValueColorPalette', v: 'ariaValueColorPaletteFirstV' } as const)[first];
            paletteInput.ariaValueText = localeManager.t(key, { s, v });
        };

        this.i18nUpdater = () => {
            paletteInput.ariaRoleDescription = localeManager.t('ariaRoleDescription2DSlider');
            paletteInput.ariaLabel = localeManager.t('ariaLabelColorPickerPalette');
            hueInput.ariaLabel = localeManager.t('ariaLabelColorPickerHue');
            multiColorButton.ariaLabel = localeManager.t('ariaLabelColorPickerMultiColor');
            alphaInput.ariaLabel = localeManager.t('ariaLabelColorPickerAlpha');
            colorInput.ariaLabel = localeManager.t('ariaLabelColor');
            updatePaletteInputAriaValue('s');
        };
        this.i18nUpdater();

        multiColorButton.classList.toggle(
            'ag-charts-color-picker__multi-color-button--hidden',
            !opts.hasMultiColorOption
        );

        const update = (trackChange = true) => {
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

            multiColorButton.classList.toggle('ag-charts-color-picker__multi-color-button--active', isMultiColor);

            colorInputLabel.classList.toggle('ag-charts-color-picker__color-label--multi-color', isMultiColor);

            if (document.activeElement !== colorInput) {
                multiColorButton.ariaChecked = isMultiColor.toString();
                colorInput.value = isMultiColor
                    ? localeManager.t('ariaLabelColorPickerMultiColor')
                    : colorString.toUpperCase();
            }

            if (trackChange || opts.color == null) {
                const plainColor = Color.fromHSB(h, s, v, 1).toHexString();
                opts.onChange?.(colorString, plainColor, a, isMultiColor);
            }

            if (trackChange) this.hasChanged = true;
        };

        update(false);

        const preventDefault = (event: Event) => event.preventDefault();
        const beginPaletteInteraction = (e: PointerEvent) => {
            const currentTarget = e.currentTarget as HTMLDivElement;
            currentTarget.focus();
            const rect = currentTarget.getBoundingClientRect();

            const pointerMove = ({ clientX, clientY }: PointerEvent) => {
                isMultiColor = false;
                s = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
                v = 1 - Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
                update();
                updatePaletteInputAriaValue('s');
            };
            pointerMove(e);

            const removeListener = doc.attachListener('pointermove', pointerMove);
            doc.attachListener('pointerup', () => removeListener(), { once: true });
        };

        colorPicker.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                case 'Escape':
                    this.hide();
                    break;
                default:
                    return;
            }
            e.preventDefault();
        });
        paletteInput.addEventListener('pointerdown', beginPaletteInteraction);
        paletteInput.addEventListener('touchstart', preventDefault, { passive: false });
        paletteInput.addEventListener('touchmove', preventDefault, { passive: false });
        paletteInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                s = clamp(0, s - 0.01, 1);
                updatePaletteInputAriaValue('s');
            } else if (e.key === 'ArrowRight') {
                s = clamp(0, s + 0.01, 1);
                updatePaletteInputAriaValue('s');
            } else if (e.key === 'ArrowUp') {
                v = clamp(0, v + 0.01, 1);
                updatePaletteInputAriaValue('v');
            } else if (e.key === 'ArrowDown') {
                v = clamp(0, v - 0.01, 1);
                updatePaletteInputAriaValue('v');
            } else {
                return;
            }
            e.preventDefault();
            update();
        });
        paletteInput.addEventListener('focus', () => {
            updatePaletteInputAriaValue('s');
        });
        multiColorButton.addEventListener('click', () => {
            isMultiColor = !isMultiColor;
            update();
        });
        hueInput.addEventListener('input', (e) => {
            isMultiColor = false;
            h = (e.currentTarget as HTMLInputElement).valueAsNumber ?? 0;
            update();
        });
        alphaInput.addEventListener('input', (e) => {
            isMultiColor = false;
            a = (e.currentTarget as HTMLInputElement).valueAsNumber ?? 0;
            update();
        });
        colorInput.addEventListener('input', (e) => {
            isMultiColor = false;
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

        return { element: colorPicker, initialFocus: paletteInput };
    }
}
