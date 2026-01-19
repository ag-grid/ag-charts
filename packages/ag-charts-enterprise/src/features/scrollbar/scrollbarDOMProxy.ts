import { _ModuleSupport } from 'ag-charts-community';
import { clamp } from 'ag-charts-core';
import type { BoxBounds } from 'ag-charts-core';

const { SliderWidget } = _ModuleSupport;

type ScrollbarDOMProxyCtx = Pick<_ModuleSupport.ModuleContext, 'proxyInteractionService' | 'localeManager'>;

export class ScrollbarDOMProxy {
    private readonly container: _ModuleSupport.GroupWidget;
    private readonly slider: _ModuleSupport.SliderWidget;

    private span = 1;
    private dragStartRatio = 0;
    private dragMoved = false;
    private isDragging = false;

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
            ariaLabel: { id: 'ariaLabelNavigatorRange' },
        });

        this.slider = ctx.proxyInteractionService.createProxyElement({
            type: 'slider',
            domIndex: 0,
            ariaLabel: { id: 'ariaLabelNavigatorRange' },
            role: 'slider',
            parent: this.container,
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
        this.slider.addListener('mouseenter', () => this.handleHoverEvent(true));
        this.slider.addListener('mousemove', () => this.handleHoverEvent(true));
        this.slider.addListener('mouseleave', () => this.handleHoverEvent(false));
    }

    destroy() {
        this.container.destroy();
    }

    updateBounds(bounds: BoxBounds) {
        this.container.setBounds(bounds);
        this.slider.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    }

    updateVisibility(visible: boolean) {
        this.container.setHidden(!visible);
    }

    updateMinMax(min: number, max: number) {
        this.span = Math.max(0, max - min);
        const aria = this.ctx.localeManager.t('ariaValuePanRange', {
            min: Math.round(min * 100) / 100,
            max: Math.round(max * 100) / 100,
        });
        this.slider.setValueRatio(min, { ariaValueText: aria });
    }

    private onSliderChange() {
        let min = this.slider.getValueRatio();
        min = clamp(0, min, 1 - this.span);
        const max = min + this.span;
        this.onChange(min, max);
        this.updateMinMax(min, max);
    }

    private onSliderKeyDown(event: _ModuleSupport.KeyboardWidgetEvent<'keydown'>) {
        if (this.orientation !== 'vertical') return;

        const { code } = event.sourceEvent;
        if (code !== 'ArrowUp' && code !== 'ArrowDown') return;

        event.sourceEvent.preventDefault();

        const element = this.slider.getElement();
        element.step = this.slider.keyboardStep?.attributeValue ?? '1';
        if (code === 'ArrowUp') {
            element.stepDown();
        } else {
            element.stepUp();
        }

        this.onSliderChange();
    }

    private onDragMove(event: _ModuleSupport.DragWidgetEvent<'drag-move'>) {
        const bounds = this.container.getBounds();
        if (!bounds.width || !bounds.height) return;

        event.sourceEvent.preventDefault();
        this.dragMoved ||= event.originDeltaX !== 0 || event.originDeltaY !== 0;

        const isHorizontal = this.slider.orientation === 'horizontal';
        const delta = isHorizontal ? event.originDeltaX / bounds.width : event.originDeltaY / bounds.height;
        const min = clamp(0, this.dragStartRatio + delta, 1 - this.span);
        const max = min + this.span;

        this.onChange(min, max);
        this.updateMinMax(min, max);
    }

    private onDragEnd(event: _ModuleSupport.DragWidgetEvent<'drag-end'>) {
        event.sourceEvent.preventDefault();

        this.isDragging = false;
        this.onHoverChange(false);

        if (!this.dragMoved) {
            this.onTrackClick(event);
        }
        this.dragMoved = false;
    }

    private onDragStart(event: _ModuleSupport.DragWidgetEvent<'drag-start'>) {
        event.sourceEvent.preventDefault();
        this.dragStartRatio = this.slider.getValueRatio();
        this.dragMoved = false;
        this.isDragging = true;
    }

    private onTrackClick(event: _ModuleSupport.MouseWidgetEvent<'click'> | _ModuleSupport.DragWidgetEvent) {
        const bounds = this.container.getElement().getBoundingClientRect();
        const { width, height, left, top } = bounds;
        if (!width || !height) return;

        if (event.device === 'keyboard') return;

        const isHorizontal = this.orientation === 'horizontal';
        const pos = isHorizontal ? event.clientX : event.clientY;
        const rawRatio = isHorizontal ? (pos - left) / width : (pos - top) / height;

        const min = clamp(0, rawRatio - this.span / 2, 1 - this.span);
        const max = min + this.span;
        this.onChange(min, max);
        this.updateMinMax(min, max);
    }

    private handleHoverEvent(hovered: boolean) {
        if (this.isDragging) return;
        this.onHoverChange(hovered);
    }
}
