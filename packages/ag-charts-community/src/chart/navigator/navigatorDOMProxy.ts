import type { ModuleContext } from '../../module/moduleContext';
import type { BBoxValues } from '../../util/bboxinterface';
import { clamp } from '../../util/number';
import { SliderWidget } from '../../widget/sliderWidget';
import type { ToolbarWidget } from '../../widget/toolbarWidget';
import type { DragMoveWidgetEvent, DragStartWidgetEvent } from '../../widget/widgetEvents';

export type NavigatorButtonType = 'min' | 'max' | 'pan';

type SliderDragHandlers = {
    onDragStart(type: NavigatorButtonType, event: { offsetX: number }): void;
    onDrag(type: NavigatorButtonType, event: { offsetX: number }): void;
};

export class NavigatorDOMProxy {
    public _min = 0;
    public _max = 1;

    public readonly minRange = 0.001;

    private dragStartX = 0;

    private readonly toolbar: ToolbarWidget;
    private readonly sliders: [SliderWidget, SliderWidget, SliderWidget];

    constructor(
        private readonly ctx: Pick<ModuleContext, 'zoomManager' | 'proxyInteractionService' | 'localeManager'>,
        private readonly sliderHandlers: SliderDragHandlers
    ) {
        this.ctx = ctx;
        this.toolbar = ctx.proxyInteractionService.createProxyContainer({
            type: 'toolbar',
            domManagerId: `navigator-toolbar`,
            classList: ['ag-charts-proxy-navigator-toolbar'],
            orientation: 'vertical',
            ariaLabel: { id: 'ariaLabelNavigator' },
        });

        this.sliders = [
            ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                ariaLabel: { id: 'ariaLabelNavigatorMinimum' },
                parent: this.toolbar,
                cursor: 'ew-resize',
            }),
            ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                ariaLabel: { id: 'ariaLabelNavigatorRange' },
                parent: this.toolbar,
                cursor: 'grab',
            }),
            ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                ariaLabel: { id: 'ariaLabelNavigatorMaximum' },
                parent: this.toolbar,
                cursor: 'ew-resize',
            }),
        ];

        for (const [index, key] of (['min', 'pan', 'max'] as const).entries()) {
            const slider = this.sliders[index];
            slider.step = SliderWidget.STEP_HUNDRETH;
            slider.keyboardStep = SliderWidget.STEP_ONE;
            slider.orientation = 'horizontal';
            slider.setPreventsDefault(false);
            slider.addListener('drag-start', (target, ev) => this.onDragStart(target, ev, key));
            slider.addListener('drag-move', (target, ev) => this.onDrag(target, ev, key));
            slider.addListener('drag-end', () => this.updateSliderRatios());
        }
        this.sliders[0].addListener('change', () => this.onMinSliderChange());
        this.sliders[1].addListener('change', () => this.onPanSliderChange());
        this.sliders[2].addListener('change', () => this.onMaxSliderChange());
        this.updateSliderRatios();
        this.updateVisibility(false);
    }

    destroy() {
        this.toolbar.destroy();
    }

    updateVisibility(visible: boolean): void {
        this.toolbar.setHidden(!visible);
    }

    updateZoom(): void {
        const { _min: min, _max: max } = this;
        if (min == null || max == null) return;

        return this.ctx.zoomManager.updateZoom('navigator', { x: { min, max } });
    }

    updateBounds(bounds: BBoxValues): void {
        this.toolbar.setBounds(bounds);
    }

    updateSliderBounds(sliderIndex: number, bounds: BBoxValues): void {
        this.sliders[sliderIndex].setBounds(bounds);
    }

    updateMinMax(min: number, max: number) {
        this._min = min;
        this._max = max;
        this.updateSliderRatios();
    }

    private updateSliderRatios() {
        const { _min: min, _max: max } = this;
        const panAria = this.ctx.localeManager.t('ariaValuePanRange', { min, max });
        this.sliders[0].setValueRatio(min);
        this.sliders[1].setValueRatio(min, { ariaValueText: panAria });
        this.sliders[2].setValueRatio(max);
    }

    private toCanvasOffsets(event: { originDeltaX: number }): { offsetX: number } {
        return { offsetX: this.dragStartX + event.originDeltaX };
    }

    private onDragStart(slider: SliderWidget, event: DragStartWidgetEvent, key: NavigatorButtonType) {
        const toolbarLeft = this.toolbar.cssLeft();
        const sliderLeft = slider.cssLeft();
        this.dragStartX = toolbarLeft + sliderLeft + event.offsetX;
        this.sliderHandlers.onDragStart(key, this.toCanvasOffsets(event));
    }

    private onDrag(_slider: SliderWidget, event: DragMoveWidgetEvent, key: NavigatorButtonType) {
        this.sliderHandlers.onDrag(key, this.toCanvasOffsets(event));
    }

    private onPanSliderChange() {
        const ratio = this.sliders[1].getValueRatio();
        const span = this._max - this._min;
        this._min = clamp(0, ratio, 1 - span);
        this._max = this._min + span;
        this.updateZoom();
    }

    private onMinSliderChange() {
        this._min = this.sliders[0].clampValueRatio(0, this._max - this.minRange);
        this.updateZoom();
    }

    private onMaxSliderChange() {
        this._max = this.sliders[2].clampValueRatio(this._min + this.minRange, 1);
        this.updateZoom();
    }

    testFindTarget(
        type: NavigatorButtonType,
        canvasX: number,
        canvasY: number
    ): { target: HTMLElement; x: number; y: number } {
        const targetWidth = this.sliders[{ min: 0, pan: 1, max: 2 }[type]];
        const x = canvasX - targetWidth.cssLeft() - this.toolbar.cssLeft();
        const y = canvasY - targetWidth.cssTop() - this.toolbar.cssTop();
        const target = targetWidth.getElement();
        return { target, x, y };
    }
}
