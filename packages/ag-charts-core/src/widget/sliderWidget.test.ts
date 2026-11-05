import { describe, expect, it } from 'vitest';

import { SliderWidget } from './sliderWidget';

function makeSlider() {
    const slider = new SliderWidget();
    // The input `type` is set by the community ProxyInteractionService, not the widget.
    slider.getElement().type = 'range';
    return slider;
}

describe('SliderWidget', () => {
    describe('setAriaValueBounds', () => {
        it('sets aria-valuemin and aria-valuemax, including zero', () => {
            const slider = makeSlider();
            slider.setAriaValueBounds(0, 100);
            expect(slider.getElement().getAttribute('aria-valuemin')).toBe('0');
            expect(slider.getElement().getAttribute('aria-valuemax')).toBe('100');
        });
    });

    describe('setAriaValueText', () => {
        it('sets and removes aria-valuetext', () => {
            const slider = makeSlider();
            slider.setAriaValueText('20% to 40%');
            expect(slider.getElement().getAttribute('aria-valuetext')).toBe('20% to 40%');
            slider.setAriaValueText(undefined);
            expect(slider.getElement().hasAttribute('aria-valuetext')).toBe(false);
        });
    });

    describe('stepUp and stepDown', () => {
        it('step by the keyboard step by default and restore the step attribute', () => {
            const slider = makeSlider();
            slider.step = SliderWidget.STEP_HUNDRETH;
            slider.keyboardStep = SliderWidget.STEP_ONE;
            slider.setValueRatio(0.25);
            const elem = slider.getElement();
            expect(elem.value).toBe('25');

            slider.stepUp();
            expect(elem.value).toBe('26');
            expect(elem.step).toBe('0.01');

            slider.stepDown();
            slider.stepDown();
            expect(elem.value).toBe('24');
            expect(elem.step).toBe('0.01');
        });

        it('step by an explicit step', () => {
            const slider = makeSlider();
            slider.step = SliderWidget.STEP_HUNDRETH;
            slider.setValueRatio(0.25);

            slider.stepUp(SliderWidget.STEP_HUNDRETH);
            expect(slider.getElement().value).toBe('25.01');
            slider.stepDown(SliderWidget.STEP_HUNDRETH);
            expect(slider.getElement().value).toBe('25');
        });

        it('clamp to the input range', () => {
            const slider = makeSlider();
            slider.step = SliderWidget.STEP_HUNDRETH;
            slider.setValueRatio(1);
            slider.stepUp();
            expect(slider.getElement().value).toBe('100');
            slider.setValueRatio(0);
            slider.stepDown();
            expect(slider.getElement().value).toBe('0');
        });
    });
});
