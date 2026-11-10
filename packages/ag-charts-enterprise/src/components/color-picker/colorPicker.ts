import { _ModuleSupport } from 'ag-charts-community';
import {
    Color,
    ContainerWidget,
    type DragWidgetEvent,
    type DynamicContext,
    type KeyboardWidgetEvent,
    LabelWidget,
    RangeInputWidget,
    Slider2DWidget,
    SwitchWidget,
    TextFieldWidget,
    TextSpanWidget,
    clamp,
} from 'ag-charts-core';

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

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>, options?: _ModuleSupport.PopoverConstructorOptions) {
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

        const { content, initialFocus } = this.createColorPicker(options);
        const popover = this.showWithChildren([content], { initialFocus, ...options });
        popover.addClass('ag-charts-color-picker');
        popover.setAriaRole('dialog');
    }

    private createColorPicker(opts: ColorPickerOptions) {
        const { localeManager } = this.ctx;
        let isMultiColor = opts.isMultiColor ?? false;
        let [h, s, v, a] = getHsva(opts.color ?? '#f00') ?? [0, 1, 0.5, 1];
        a = opts.opacity ?? a;

        const doc = this.ctx.agDocument.document;
        const colorPicker = new ContainerWidget(doc, 'ag-charts-color-picker__content');
        colorPicker.setAriaLabel(localeManager.t('ariaLabelColorPicker'));

        const paletteInput = new Slider2DWidget(doc, 'ag-charts-color-picker__palette');

        const colorRow = new ContainerWidget(doc, 'ag-charts-color-picker__color-row');
        colorRow.setAriaRole('presentation');
        const multiColorButton = new SwitchWidget(doc);
        multiColorButton.setType('button');
        multiColorButton.addClass('ag-charts-color-picker__multi-color-button');
        multiColorButton.setTabIndex(0);
        const hueInput = new RangeInputWidget(doc, 'ag-charts-color-picker__hue-input');
        hueInput.setRange(0, 360);
        hueInput.setTabIndex(0);
        colorRow.addChild(multiColorButton);
        colorRow.addChild(hueInput);

        const alphaInput = new RangeInputWidget(doc, 'ag-charts-color-picker__alpha-input');
        alphaInput.setRange(0, 1, 0.01);
        alphaInput.setTabIndex(0);

        // The <label> wraps the input, so pointer presses on the swatch focus the input.
        const colorField = new LabelWidget(doc, '', 'ag-charts-color-picker__color-field');
        colorField.setAriaRole('presentation');
        const colorInputLabel = new TextSpanWidget(doc, undefined, 'ag-charts-color-picker__color-label');
        colorInputLabel.setAriaHidden(true);
        const colorInput = new TextFieldWidget(doc, 'ag-charts-color-picker__color-input');
        colorInput.setTabIndex(0);
        colorField.addChild(colorInputLabel);
        colorField.addChild(colorInput);

        colorPicker.addChild(paletteInput);
        colorPicker.addChild(colorRow);
        colorPicker.addChild(alphaInput);
        colorPicker.addChild(colorField);

        // Update the 2D-slider to with the new S and V values. By default, announce S first followed by V. If the user
        // is arrowing up or down, then announce V first because it's more relevant.
        const updatePaletteInputAriaValue = (first: 's' | 'v') => {
            const key = ({ s: 'ariaValueColorPalette', v: 'ariaValueColorPaletteFirstV' } as const)[first];
            paletteInput.setAriaValueText(localeManager.t(key, { s, v }));
        };

        this.i18nUpdater = () => {
            paletteInput.setAriaRoleDescription(localeManager.t('ariaRoleDescription2DSlider'));
            paletteInput.setAriaLabel(localeManager.t('ariaLabelColorPickerPalette'));
            hueInput.setAriaLabel(localeManager.t('ariaLabelColorPickerHue'));
            multiColorButton.setAriaLabel(localeManager.t('ariaLabelColorPickerMultiColor'));
            alphaInput.setAriaLabel(localeManager.t('ariaLabelColorPickerAlpha'));
            colorInput.setAriaLabel(localeManager.t('ariaLabelColor'));
            updatePaletteInputAriaValue('s');
        };
        this.i18nUpdater();

        multiColorButton.toggleClass('ag-charts-color-picker__multi-color-button--hidden', !opts.hasMultiColorOption);

        const update = (trackChange = true) => {
            const color = Color.fromHSB(h, s, v, a);
            const colorString = color.toHexString();

            colorPicker.setCSSVariable('--h', `${h}`);
            colorPicker.setCSSVariable('--s', `${s}`);
            colorPicker.setCSSVariable('--v', `${v}`);
            colorPicker.setCSSVariable('--a', `${a}`);
            colorPicker.setCSSVariable('--color', colorString.slice(0, 7));
            colorPicker.setCSSVariable('--color-a', colorString);

            hueInput.value = h;
            alphaInput.value = a;

            alphaInput.toggleClass('ag-charts-color-picker__alpha-input--opaque', a === 1);

            multiColorButton.toggleClass('ag-charts-color-picker__multi-color-button--active', isMultiColor);

            colorInputLabel.toggleClass('ag-charts-color-picker__color-label--multi-color', isMultiColor);

            if (!colorInput.isFocused()) {
                multiColorButton.setChecked(isMultiColor);
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

        const preventDefault = (event: { sourceEvent: Event }) => event.sourceEvent.preventDefault();
        let paletteRect: DOMRect | undefined;
        const pickFromPalette = ({ clientX, clientY }: DragWidgetEvent) => {
            if (paletteRect == null) return;
            isMultiColor = false;
            s = Math.min(Math.max((clientX - paletteRect.left) / paletteRect.width, 0), 1);
            v = 1 - Math.min(Math.max((clientY - paletteRect.top) / paletteRect.height, 0), 1);
            update();
            updatePaletteInputAriaValue('s');
        };

        colorPicker.addListener('keydown', ({ sourceEvent }: KeyboardWidgetEvent) => {
            switch (sourceEvent.key) {
                case 'Enter':
                case 'Escape':
                    this.hide();
                    break;
                default:
                    return;
            }
            sourceEvent.preventDefault();
        });
        paletteInput.addListener('drag-start', (event) => {
            paletteInput.focus();
            paletteRect = paletteInput.getBoundingClientRect();
            pickFromPalette(event);
        });
        paletteInput.addListener('drag-move', pickFromPalette);
        paletteInput.addListener('mousedown', preventDefault);
        paletteInput.addListener('touchstart', preventDefault);
        paletteInput.addListener('touchmove', preventDefault);
        paletteInput.addListener('keydown', ({ sourceEvent }) => {
            if (sourceEvent.key === 'ArrowLeft') {
                s = clamp(0, s - 0.01, 1);
                updatePaletteInputAriaValue('s');
            } else if (sourceEvent.key === 'ArrowRight') {
                s = clamp(0, s + 0.01, 1);
                updatePaletteInputAriaValue('s');
            } else if (sourceEvent.key === 'ArrowUp') {
                v = clamp(0, v + 0.01, 1);
                updatePaletteInputAriaValue('v');
            } else if (sourceEvent.key === 'ArrowDown') {
                v = clamp(0, v - 0.01, 1);
                updatePaletteInputAriaValue('v');
            } else {
                return;
            }
            sourceEvent.preventDefault();
            update();
        });
        paletteInput.addListener('focus', () => {
            updatePaletteInputAriaValue('s');
        });
        multiColorButton.addListener('click', (event) => {
            // Enter closes the picker instead (see the keydown listener above), as it did on the native button.
            if (event.device === 'keyboard' && event.sourceEvent.key === 'Enter') return;
            isMultiColor = !isMultiColor;
            update();
        });
        hueInput.addListener('input', () => {
            isMultiColor = false;
            h = hueInput.value;
            update();
        });
        alphaInput.addListener('input', () => {
            isMultiColor = false;
            a = alphaInput.value;
            update();
        });
        colorInput.addListener('input', () => {
            isMultiColor = false;
            const hsva = getHsva(colorInput.value);
            if (hsva == null) return;
            [h, s, v, a] = hsva;
            update();
        });
        colorInput.addListener('blur', () => update());
        colorInput.addListener('keydown', ({ sourceEvent }) => {
            if (sourceEvent.key === 'Enter') {
                colorInput.blur();
                update();
            }
        });

        return { content: colorPicker, initialFocus: paletteInput };
    }
}
