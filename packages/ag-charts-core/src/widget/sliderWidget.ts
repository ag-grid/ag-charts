import { clamp } from '../data/numbers';
import { getAttribute, setAttribute } from '../dom/attributeUtil';
import { createElement } from '../dom/domElements';
import { formatPercent } from '../format/formatUtil';
import type { RovingDirection } from './rovingDirection';
import { Widget } from './widget';
import type { FocusWidgetEvent, KeyboardWidgetEvent } from './widgetEvents';

type SliderStep = typeof SliderWidget.STEP_ONE | typeof SliderWidget.STEP_HUNDRETH;
export class SliderWidget extends Widget<HTMLInputElement> {
    public static readonly STEP_ONE = { attributeValue: '1', divider: 1 } as const;
    public static readonly STEP_HUNDRETH = { attributeValue: '0.01', divider: 100 } as const;
    private _step: Readonly<SliderStep> = SliderWidget.STEP_ONE;
    private _keyboardStep?: {
        step: Readonly<SliderStep>;
        onKeyDown: (ev: KeyboardWidgetEvent, current: SliderWidget) => void;
        onKeyUp: (ev: KeyboardWidgetEvent, current: SliderWidget) => void;
        onBlur: (ev: FocusWidgetEvent, current: SliderWidget) => void;
    };

    public get step() {
        return this._step;
    }
    public set step(step: Readonly<SliderStep>) {
        this._step = step;
        this.getElement().step = step.attributeValue;
    }

    public get keyboardStep() {
        return this._keyboardStep?.step ?? this._step;
    }
    public set keyboardStep(step: Readonly<SliderStep> | undefined) {
        if (step === this._keyboardStep?.step) return;

        if (this._keyboardStep !== undefined) {
            this.removeListener('keydown', this._keyboardStep.onKeyDown);
            this.removeListener('keyup', this._keyboardStep.onKeyUp);
            this.removeListener('blur', this._keyboardStep.onBlur);
            this._keyboardStep = undefined;
        }

        if (step !== undefined) {
            const onKeyDown = () => (this.getElement().step = step.attributeValue);
            const resetStep = () => (this.getElement().step = this._step.attributeValue);
            this._keyboardStep = { step, onKeyDown, onKeyUp: resetStep, onBlur: resetStep };
            this.addListener('keydown', this._keyboardStep.onKeyDown);
            this.addListener('keyup', this._keyboardStep.onKeyUp);
            this.addListener('blur', this._keyboardStep.onBlur);
        }
    }

    public get orientation(): RovingDirection {
        return getAttribute(this.elem, 'aria-orientation') ?? 'both';
    }
    public set orientation(orientation: RovingDirection) {
        setAttribute(this.elem, 'aria-orientation', orientation === 'both' ? undefined : orientation);
        SliderWidget.registerDefaultPreventers(this, orientation);
    }

    constructor() {
        super(createElement('input'));
        this.elem.type = 'range';
        this.elem.style.margin = '0px';
        this.orientation = 'both';
    }

    protected override destructor() {
        // Nothing to destroy.
    }

    clampValueRatio(clampMin: number, clampMax: number) {
        const ratio = this.getValueRatio();
        const clampedRatio = clamp(clampMin, ratio, clampMax);
        if (clampedRatio !== ratio) {
            this.setValueRatio(clampedRatio);
        }
        return clampedRatio;
    }

    setValueRatio(ratio: number, opts?: { ariaValueText?: string }) {
        const { divider } = this.step;
        const value = Math.round(ratio * 10000) / divider;
        const { ariaValueText = formatPercent(value / divider) } = opts ?? {};
        const elem = this.getElement();
        elem.value = `${value}`;
        elem.ariaValueText = ariaValueText;
        elem.ariaValueNow = `${value}`;
    }

    getValueRatio() {
        return this.getElement().valueAsNumber / this.step.divider;
    }

    setAriaValueBounds(min: number, max: number) {
        setAttribute(this.elem, 'aria-valuemin', min);
        setAttribute(this.elem, 'aria-valuemax', max);
    }

    /** Sets `aria-valuetext` without changing the value. `setValueRatio` also sets it. */
    setAriaValueText(ariaValueText: string | undefined) {
        setAttribute(this.elem, 'aria-valuetext', ariaValueText);
    }

    /**
     * Increments the value by one `step` with the native `stepUp()`, so the result snaps to the step grid and is
     * clamped to the input's range. The input's `step` attribute is restored afterwards.
     * @param step - The step to use, defaulting to `keyboardStep`.
     */
    stepUp(step?: Readonly<SliderStep>) {
        this.stepBy(step, 1);
    }

    /** As `stepUp`, but decrements. */
    stepDown(step?: Readonly<SliderStep>) {
        this.stepBy(step, -1);
    }

    private stepBy(step: Readonly<SliderStep> | undefined, direction: 1 | -1) {
        const elem = this.getElement();
        const previous = elem.step;
        elem.step = (step ?? this.keyboardStep ?? this.step).attributeValue;
        if (direction === 1) {
            elem.stepUp();
        } else {
            elem.stepDown();
        }
        elem.step = previous;
    }

    private static registerDefaultPreventers(target: SliderWidget, orientation: RovingDirection) {
        if (orientation === 'both') {
            target.removeListener('keydown', SliderWidget.onKeyDown);
        } else {
            target.addListener('keydown', SliderWidget.onKeyDown);
        }
    }

    private static onKeyDown(this: void, ev: KeyboardWidgetEvent, current: SliderWidget) {
        let ignoredKeys: string[] = [];
        const { orientation } = current;
        if (orientation === 'horizontal') {
            ignoredKeys = ['ArrowUp', 'ArrowDown'];
        } else if (orientation === 'vertical') {
            ignoredKeys = ['ArrowLeft', 'ArrowRight'];
        }

        if (ignoredKeys.includes(ev.sourceEvent.code)) {
            ev.sourceEvent.preventDefault();
        }
    }
}
