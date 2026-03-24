import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { type BoxBounds, clamp } from 'ag-charts-core';

const { SliderWidget } = _ModuleSupport;

export type NavigatorButtonType = 'min' | 'max' | 'pan';

type SliderDragHandlers = {
    onDragStart(type: NavigatorButtonType, event: { offsetX: number }): void;
    onDrag(type: NavigatorButtonType, event: { offsetX: number }): void;
};

type NavigatorDOMProxyModuleContext = Pick<
    _ModuleSupport.ModuleContext,
    'zoomManager' | 'proxyInteractionService' | 'localeManager' | 'contextMenuRegistry'
>;

export class NavigatorDOMProxy {
    public _min = 0;
    public _max = 1;

    public readonly minRange = 0.001;

    private dragStartX = 0;

    private readonly toolbar: _ModuleSupport.ToolbarWidget;
    private readonly sliders: [_ModuleSupport.SliderWidget, _ModuleSupport.SliderWidget, _ModuleSupport.SliderWidget];

    constructor(
        private readonly ctx: NavigatorDOMProxyModuleContext,
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
                domIndex: 1,
                ariaLabel: { id: 'ariaLabelNavigatorMinimum' },
                parent: this.toolbar,
                cursor: 'ew-resize',
            }),
            ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                domIndex: -Infinity,
                ariaLabel: { id: 'ariaLabelNavigatorRange' },
                parent: this.toolbar,
                cursor: 'grab',
            }),
            ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                domIndex: 2,
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
            slider.addListener('blur', () => this.clearFocusOverride(slider));
            slider.addListener('focus', () => this.clearFocusOverride(slider));
            slider.addListener('keydown', () => this.onKeyDown(slider));
            slider.addListener('drag-start', (ev) => this.onDragStart(index, ev, key));
            slider.addListener('drag-move', (ev) => this.onDrag(slider, ev, key));
            slider.addListener('drag-end', () => this.updateSliderRatios());
            slider.addListener('contextmenu', (ev) => this.onContextMenu(slider, ev));
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

        this.ctx.zoomManager.updateZoom(
            { source: 'user-interaction', sourceDetail: 'navigatorDOM' },
            { x: { min, max } }
        );
    }

    updateBounds(bounds: BoxBounds): void {
        this.toolbar.setBounds(bounds);
    }

    updateSliderBounds(sliderIndex: number, bounds: BoxBounds): void {
        this.sliders[sliderIndex].setBounds(bounds);
    }

    updateMinMax(min: number, max: number) {
        this._min = min;
        this._max = max;
        this.updateSliderRatios();
    }

    private updateSliderRatios() {
        let { _min: min, _max: max } = this;
        min = Math.round(min * 100) / 100;
        max = Math.round(max * 100) / 100;
        const panAria = this.ctx.localeManager.t('ariaValuePanRange', { min, max });
        this.sliders[0].setValueRatio(min);
        this.sliders[1].setValueRatio(min, { ariaValueText: panAria });
        this.sliders[2].setValueRatio(max);
    }

    private toCanvasOffsets(event: { originDeltaX: number }): { offsetX: number } {
        return { offsetX: this.dragStartX + event.originDeltaX };
    }

    private moveToFront(index: number) {
        if (index === 1) return; // ignore pan-handle

        const frontSlider = this.sliders[index];
        const otherSlider = this.sliders[2 - index];
        this.toolbar.moveChild(otherSlider, frontSlider.domIndex! - 1);
    }

    private clearFocusOverride(slider: _Widget.Widget) {
        slider.setFocusOverride(undefined);
    }

    private onKeyDown(slider: _Widget.Widget) {
        slider.setFocusOverride(true);
    }

    private onDragStart(index: number, event: _ModuleSupport.DragWidgetEvent<'drag-start'>, key: NavigatorButtonType) {
        const slider: _ModuleSupport.SliderWidget = this.sliders[index];
        const toolbarLeft = this.toolbar.cssLeft();
        const sliderLeft = slider.cssLeft();
        this.dragStartX = toolbarLeft + sliderLeft + event.offsetX;
        this.moveToFront(index); // AG-13780
        event.sourceEvent.preventDefault();
        slider.focus();
        slider.setFocusOverride(false);
        this.sliderHandlers.onDragStart(key, this.toCanvasOffsets(event));
    }

    private onDrag(
        _slider: _ModuleSupport.SliderWidget,
        event: _ModuleSupport.DragWidgetEvent<'drag-move'>,
        key: NavigatorButtonType
    ) {
        event.sourceEvent.preventDefault();
        this.sliderHandlers.onDrag(key, this.toCanvasOffsets(event));
    }

    private onContextMenu(
        slider: _ModuleSupport.SliderWidget,
        widgetEvent: _ModuleSupport.MouseWidgetEvent<'contextmenu'>
    ) {
        const { offsetX, offsetY } = widgetEvent;
        const { x: toolbarX, y: toolbarY } = this.toolbar.getBounds();
        const { x: sliderX, y: sliderY } = slider.getBounds();
        const canvasX = offsetX + toolbarX + sliderX;
        const canvasY = offsetY + toolbarY + sliderY;
        this.ctx.contextMenuRegistry.dispatchContext('always', { widgetEvent, canvasX, canvasY }, undefined);
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
}
