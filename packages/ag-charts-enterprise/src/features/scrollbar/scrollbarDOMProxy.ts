import { _ModuleSupport } from 'ag-charts-community';
import { clamp } from 'ag-charts-core';
import type { BoxBounds } from 'ag-charts-core';

const { SliderWidget } = _ModuleSupport;

type ScrollbarDOMProxyCtx = Pick<_ModuleSupport.ModuleContext, 'proxyInteractionService' | 'localeManager'>;

const STEP_REPEAT_DELAY_MS = 400;
const STEP_REPEAT_INTERVAL_MS = 50;

type ScrollbarRange = {
    min: number;
    max: number;
};

type InteractionMode = 'none' | 'drag' | 'step';

type InteractionBounds = {
    isHorizontal: boolean;
    start: number;
    size: number;
    crossStart: number;
    crossSize: number;
};

class StepRepeater {
    private target?: number;
    private timer?: ReturnType<typeof setTimeout>;

    constructor(private readonly applyStep: (target: number) => boolean) {}

    start(target: number) {
        this.setTarget(target);
        this.run(STEP_REPEAT_DELAY_MS);
    }

    updateTarget(target: number) {
        this.setTarget(target);
        if (!this.isActive()) {
            this.run(STEP_REPEAT_DELAY_MS);
        }
    }

    stop(resetTarget = true) {
        this.clearTimer();
        if (resetTarget) {
            this.target = undefined;
        }
    }

    private setTarget(target: number) {
        this.target = clamp(0, target, 1);
    }

    private run(delay: number) {
        if (this.target == null) {
            this.stop();
            return;
        }

        const finished = this.applyStep(this.target);
        if (finished) {
            this.stop();
            return;
        }

        this.schedule(delay);
    }

    private schedule(delay: number) {
        if (this.isActive()) return;

        this.timer = setTimeout(() => {
            this.timer = undefined;
            this.run(STEP_REPEAT_INTERVAL_MS);
        }, delay);
    }

    private clearTimer() {
        if (this.timer != null) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    private isActive() {
        return this.timer != null;
    }
}

class ScrollbarState {
    public min = 0;
    public span = 1;
    public thumbSpan = 1;

    update(min: number, max: number, thumbSpan = this.thumbSpan) {
        const span = clamp(0, max - min, 1);
        this.span = span;
        this.thumbSpan = clamp(0, thumbSpan, 1);
        this.min = this.clampMin(min, span);
    }

    clampMin(min: number, span = this.span) {
        return clamp(0, min, 1 - span);
    }

    getThumbBounds(min = this.min, span = this.thumbSpan): { start: number; end: number } {
        const start = this.clampMin(min, span);
        return { start, end: start + span };
    }

    isWithinThumb(ratio: number) {
        const { start, end } = this.getThumbBounds();
        return ratio >= start && ratio <= end;
    }

    getJumpRange(ratio: number): ScrollbarRange | undefined {
        if (!this.canScroll()) return;

        let min = this.clampMin(ratio - this.thumbSpan / 2, this.thumbSpan);
        min = this.clampMin(min);
        return { min, max: min + this.span };
    }

    getStepRange(ratio: number): ScrollbarRange | undefined {
        if (!this.canScroll()) return;

        const cursor = clamp(0, ratio, 1);
        const { start, end } = this.getThumbBounds();
        if (cursor >= start && cursor <= end) return;

        const movingLeft = cursor < start;
        const distance = movingLeft ? start - cursor : cursor - end;
        const step = Math.min(this.span, distance);
        const nextMin = this.clampMin(this.min + (movingLeft ? -step : step));

        return { min: nextMin, max: nextMin + this.span };
    }

    private canScroll() {
        return this.span > 0 && this.span < 1;
    }
}

export class ScrollbarDOMProxy {
    private readonly container: _ModuleSupport.GroupWidget;
    private readonly slider: _ModuleSupport.SliderWidget;
    private readonly thumbFocus: _ModuleSupport.NativeWidget<HTMLDivElement>;

    private dragStartRatio = 0;
    private interactionMode: InteractionMode = 'none';
    private interactionBounds?: InteractionBounds;

    private readonly state = new ScrollbarState();
    private readonly repeater = new StepRepeater((target) => this.applyStepToward(target));

    constructor(
        private readonly ctx: ScrollbarDOMProxyCtx,
        private readonly orientation: 'horizontal' | 'vertical',
        private readonly onChange: (min: number, max: number) => void,
        private readonly onHoverChange: (hovered: boolean) => void
    ) {
        this.container = ctx.proxyInteractionService.createProxyContainer({
            type: 'group',
            domManagerId: `scrollbar-${orientation}`,
            classList: ['ag-charts-proxy-scrollbar', `ag-charts-proxy-scrollbar-${orientation}`],
            role: 'presentation',
        });

        const ariaLabelId =
            orientation === 'horizontal' ? 'ariaLabelScrollbarHorizontal' : 'ariaLabelScrollbarVertical';
        this.slider = ctx.proxyInteractionService.createProxyElement({
            type: 'slider',
            domIndex: 0,
            tabIndex: 0,
            ariaLabel: { id: ariaLabelId },
            role: 'slider',
            parent: this.container,
            classList: ['ag-charts-proxy-scrollbar-slider'],
        });
        const element = this.slider.getElement();
        element.ariaValueMin = '0';
        element.ariaValueMax = '100';

        this.slider.step = SliderWidget.STEP_HUNDRETH;
        this.slider.keyboardStep = SliderWidget.STEP_ONE;
        this.slider.orientation = orientation;
        this.slider.setPreventsDefault(false);
        this.slider.addListener('change', () => this.onSliderChange());
        this.slider.addListener('keydown', (ev) => this.onSliderKeyDown(ev));
        this.slider.addListener('drag-start', (ev) => this.onDragStart(ev));
        this.slider.addListener('drag-move', (ev) => this.onDragMove(ev));
        this.slider.addListener('drag-end', (ev) => this.onDragEnd(ev));
        this.slider.addListener('mouseenter', (event) => this.handleHoverEvent(event));
        this.slider.addListener('mousemove', (event) => this.handleHoverEvent(event));
        this.slider.addListener('mouseleave', () => this.onMouseLeave());

        this.thumbFocus = ctx.proxyInteractionService.createProxyElement({
            type: 'region',
            parent: this.container,
            classList: ['ag-charts-proxy-scrollbar-thumb-focus'],
            role: 'presentation',
        });
        this.thumbFocus.setAriaHidden(true);
        this.thumbFocus.setPointerEvents('none');
    }

    destroy() {
        this.interactionBounds = undefined;

        this.repeater.stop();
        this.container.destroy();
    }

    updateBounds(bounds: BoxBounds) {
        this.interactionBounds = undefined;

        this.container.setBounds(bounds);
        this.slider.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    }

    updateVisibility(visible: boolean) {
        this.container.setHidden(!visible);
    }

    updateMinMax(min: number, max: number, thumbSpan = this.state.thumbSpan, options?: { skipSliderUpdate?: boolean }) {
        this.state.update(min, max, thumbSpan);
        const aria = this.ctx.localeManager.t('ariaValuePanRange', {
            min: Math.round(min * 100) / 100,
            max: Math.round(max * 100) / 100,
        });

        const element = this.slider.getElement();
        element.ariaValueText = aria;

        const shouldUpdateSlider = !options?.skipSliderUpdate || Math.abs(this.slider.getValueRatio() - min) > 1e-9;
        if (shouldUpdateSlider) {
            this.slider.setValueRatio(min, { ariaValueText: aria });
        }
    }

    updateThumbBounds(thumb: BoxBounds, track: BoxBounds, cornerRadius?: number) {
        const radius = Math.max(0, cornerRadius ?? 0);
        this.thumbFocus.getElement().style.borderRadius = `${radius}px`;
        this.thumbFocus.setBounds({
            x: thumb.x - track.x,
            y: thumb.y - track.y,
            width: thumb.width,
            height: thumb.height,
        });
    }

    private update(min: number, max: number, options?: { skipSliderUpdate?: boolean }) {
        this.onChange(min, max);
        this.updateMinMax(min, max, undefined, options);
    }

    private onSliderChange() {
        const min = this.state.clampMin(this.slider.getValueRatio());
        const max = min + this.state.span;
        this.update(min, max, { skipSliderUpdate: true });
    }

    private onSliderKeyDown(event: _ModuleSupport.KeyboardWidgetEvent<'keydown'>) {
        const { code } = event.sourceEvent;
        const isVertical = this.orientation === 'vertical';
        const decrement = (isVertical && code === 'ArrowUp') || (!isVertical && code === 'ArrowLeft');
        const increment = (isVertical && code === 'ArrowDown') || (!isVertical && code === 'ArrowRight');
        if (!decrement && !increment) return;

        event.sourceEvent.preventDefault();

        const element = this.slider.getElement();
        element.step = this.slider.keyboardStep?.attributeValue ?? '1';
        if (decrement) {
            element.stepDown();
        } else if (increment) {
            element.stepUp();
        }

        this.onSliderChange();
    }

    private onDragMove(event: _ModuleSupport.DragWidgetEvent<'drag-move'>) {
        event.sourceEvent.preventDefault();

        if (this.interactionMode === 'drag') {
            const { isHorizontal, size, start } = this.getInteractionBounds() ?? {};
            if (start == null || size == null) return;

            const delta = (isHorizontal ? event.originDeltaX : event.originDeltaY) / size;
            const min = this.state.clampMin(this.dragStartRatio + delta);
            const max = min + this.state.span;

            this.update(min, max);
            return;
        }

        if (this.interactionMode !== 'step') return;

        const pointer = this.getPointerInfo(event);
        if (pointer == null || !Number.isFinite(pointer.ratio)) return;

        const { ratio, inCrossBounds } = pointer;
        if (!inCrossBounds) {
            this.repeater.stop();
            return;
        }

        this.repeater.updateTarget(ratio);
    }

    private onDragEnd(event: _ModuleSupport.DragWidgetEvent<'drag-end'>) {
        event.sourceEvent.preventDefault();

        this.interactionBounds = undefined;
        this.setInteraction('none');
        this.onHoverChange(false);
    }

    private onDragStart(event: _ModuleSupport.DragWidgetEvent<'drag-start'>) {
        event.sourceEvent.preventDefault();
        this.interactionBounds = undefined;

        const click = this.getClickInfo(event);

        if (!click?.inBounds) return;

        if (click.inThumb) {
            this.dragStartRatio = this.slider.getValueRatio();
            this.setInteraction('drag');

            return;
        }

        if (event.sourceEvent.shiftKey) {
            this.jumpTo(click.ratio);
            this.setInteraction('none');
            return;
        }

        this.beginStepRepeat(click.ratio);
    }

    private onMouseLeave() {
        this.onHoverChange(false);
    }

    private getClickInfo(
        event: _ModuleSupport.MouseWidgetEvent<'click'> | _ModuleSupport.DragWidgetEvent
    ): { ratio: number; inBounds: boolean; inThumb: boolean } | undefined {
        const ratio = this.getPointerRatio(event);
        if (ratio == null) return;

        const inBounds = ratio >= 0 && ratio <= 1;
        if (!inBounds) return { ratio: 0, inBounds: false, inThumb: false };

        return { ratio, inBounds: true, inThumb: this.isWithinThumb(ratio) };
    }

    private getPointerRatio(
        event: _ModuleSupport.MouseWidgetEvent<'click' | 'mouseenter' | 'mousemove'> | _ModuleSupport.DragWidgetEvent
    ): number | undefined {
        return this.getPointerInfo(event)?.ratio;
    }

    private getPointerInfo(
        event: _ModuleSupport.MouseWidgetEvent<'click' | 'mouseenter' | 'mousemove'> | _ModuleSupport.DragWidgetEvent
    ): { ratio: number; inCrossBounds: boolean } | undefined {
        if (event.device === 'keyboard') return;
        const { isHorizontal, size, start, crossStart, crossSize } = this.getInteractionBounds();

        const pos = isHorizontal ? event.clientX : event.clientY;
        const crossPos = isHorizontal ? event.clientY : event.clientX;
        const ratio = (pos - start) / size;
        const inCrossBounds = crossPos >= crossStart && crossPos <= crossStart + crossSize;

        return { ratio, inCrossBounds };
    }

    private jumpTo(ratio: number) {
        const next = this.state.getJumpRange(ratio);
        if (!next) return;

        this.update(next.min, next.max);
    }

    private applyStepToward(target: number) {
        const next = this.state.getStepRange(target);
        if (!next) return true;
        this.update(next.min, next.max);
        return false;
    }

    private beginStepRepeat(ratio: number) {
        this.setInteraction('step');
        this.repeater.start(ratio);
    }

    private setInteraction(mode: InteractionMode) {
        this.interactionMode = mode;
        if (mode !== 'step') {
            this.repeater.stop();
        }
    }

    private getInteractionBounds() {
        if (this.interactionBounds) {
            return this.interactionBounds;
        }

        const { width, height, left, top } = this.container.getBoundingClientRect();
        const isHorizontal = this.orientation === 'horizontal';
        const size = isHorizontal ? width : height;
        const start = isHorizontal ? left : top;
        const crossStart = isHorizontal ? top : left;
        const crossSize = isHorizontal ? height : width;
        this.interactionBounds = { isHorizontal, size, start, crossStart, crossSize };

        return this.interactionBounds;
    }

    private isWithinThumb(ratio: number) {
        return this.state.isWithinThumb(ratio);
    }

    private handleHoverEvent(event: _ModuleSupport.MouseWidgetEvent<'mouseenter' | 'mousemove'>) {
        if (this.interactionMode === 'drag') return;

        const pointer = this.getPointerInfo(event);
        if (!pointer) {
            this.onHoverChange(false);
            return;
        }

        const hovered = this.isWithinThumb(pointer.ratio);
        this.onHoverChange(hovered);
    }
}
