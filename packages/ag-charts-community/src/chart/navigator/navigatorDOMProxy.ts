import type { ProxyDragHandlerEvent } from '../../dom/proxyInteractionService';
import type { ModuleContext } from '../../module/moduleContext';
import { setAttribute } from '../../util/attributeUtil';
import type { BBoxValues } from '../../util/bboxinterface';
import { DestroyFns } from '../../util/destroy';
import { setElementBBox } from '../../util/dom';
import { formatPercent } from '../../util/format.util';
import { initToolbarKeyNav } from '../../util/keynavUtil';
import { clamp } from '../../util/number';

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

    private readonly toolbar: HTMLElement;
    private readonly sliders: [HTMLInputElement, HTMLInputElement, HTMLInputElement];

    private readonly destroyFns = new DestroyFns();

    private destroyDragListeners?: () => void;

    constructor(
        private readonly ctx: Pick<ModuleContext, 'zoomManager' | 'proxyInteractionService' | 'localeManager'>,
        private readonly sliderHandlers: SliderDragHandlers
    ) {
        this.ctx = ctx;
        this.toolbar = ctx.proxyInteractionService.createProxyContainer({
            type: 'toolbar',
            domManagerId: `navigator-toolbar`,
            classList: ['ag-charts-proxy-navigator-toolbar'],
            ariaOrientation: 'vertical',
            ariaLabel: { id: 'ariaLabelNavigator' },
        });

        this.sliders = [
            ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                ariaLabel: { id: 'ariaLabelNavigatorMinimum' },
                ariaOrientation: 'horizontal',
                parent: this.toolbar,
                cursor: 'ew-resize',
                onchange: (ev) => this.onMinSliderChange(ev),
            }),
            ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                ariaLabel: { id: 'ariaLabelNavigatorRange' },
                ariaOrientation: 'horizontal',
                parent: this.toolbar,
                cursor: 'grab',
                onchange: (ev) => this.onPanSliderChange(ev),
            }),
            ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                ariaLabel: { id: 'ariaLabelNavigatorMaximum' },
                ariaOrientation: 'horizontal',
                parent: this.toolbar,
                cursor: 'ew-resize',
                onchange: (ev) => this.onMaxSliderChange(ev),
            }),
        ];
        this.setSliderRatio(this.sliders[0], this._min);
        this.setSliderRatio(this.sliders[2], this._max);
        this.setPanSliderValue(this._min, this._max);
        initToolbarKeyNav({
            orientation: 'vertical',
            toolbar: this.toolbar,
            buttons: this.sliders,
        });
        this.destroyFns.push(() => {
            this.sliders.forEach((e) => e.remove());
            this.toolbar.remove();
        });
        this.updateVisibility(false);
    }

    destroy() {
        this.destroyFns.destroy();
    }

    private initDragListeners() {
        if (this.destroyDragListeners != null) return;

        for (const [index, key] of (['min', 'pan', 'max'] as const).entries()) {
            const slider = this.sliders[index];
            slider.step = '0.01';
            setAttribute(slider, 'data-preventdefault', false);
            this.destroyDragListeners = this.ctx.proxyInteractionService.createDragListeners({
                element: slider,
                onDragStart: (ev) => this.onDragStart(ev, key, slider),
                onDrag: (ev) => this.onDrag(ev, key),
                onDragEnd: () => this.updateSliderRatios(),
            });
        }
    }

    updateVisibility(visible: boolean): void {
        if (visible) {
            this.toolbar.style.removeProperty('display');
            this.initDragListeners();
        } else {
            this.toolbar.style.display = 'none';
            this.destroyDragListeners?.();
            this.destroyDragListeners = undefined;
        }
    }

    updateZoom(): void {
        const { _min: min, _max: max } = this;
        if (min == null || max == null) return;

        return this.ctx.zoomManager.updateZoom('navigator', { x: { min, max } });
    }

    updateBounds(bounds: BBoxValues): void {
        setElementBBox(this.toolbar, bounds);
    }

    updateSliderBounds(sliderIndex: number, bounds: BBoxValues): void {
        setElementBBox(this.sliders[sliderIndex], bounds);
    }

    updateMinMax(min: number, max: number) {
        this._min = min;
        this._max = max;
        this.updateSliderRatios();
    }

    private updateSliderRatios() {
        this.setPanSliderValue(this._min, this._max);
        this.setSliderRatio(this.sliders[0], this._min);
        this.setSliderRatio(this.sliders[2], this._max);
    }

    private toCanvasOffsets(event: ProxyDragHandlerEvent): { offsetX: number } {
        return { offsetX: this.dragStartX + event.originDeltaX };
    }

    private onDragStart(event: ProxyDragHandlerEvent, key: NavigatorButtonType, slider: HTMLInputElement) {
        const toolbarLeft = parseFloat(this.toolbar.style.left);
        const sliderLeft = parseFloat(slider.style.left);
        this.dragStartX = toolbarLeft + sliderLeft + event.offsetX;
        this.sliderHandlers.onDragStart(key, this.toCanvasOffsets(event));
    }

    private onDrag(event: ProxyDragHandlerEvent, key: NavigatorButtonType) {
        this.sliderHandlers.onDrag(key, this.toCanvasOffsets(event));
    }

    private onPanSliderChange(_event: Event) {
        const ratio = this.getSliderRatio(this.sliders[1]);
        const span = this._max - this._min;
        this._min = clamp(0, ratio, 1 - span);
        this._max = this._min + span;
        this.updateZoom();
    }

    private onMinSliderChange(_event: Event) {
        const slider = this.sliders[0];
        this._min = this.setSliderRatioClamped(slider, 0, this._max - this.minRange);
        this.updateZoom();
    }

    private onMaxSliderChange(_event: Event) {
        const slider = this.sliders[2];
        this._max = this.setSliderRatioClamped(slider, this._min + this.minRange, 1);
        this.updateZoom();
    }

    private setPanSliderValue(min: number, max: number) {
        const value = Math.round(min * 10000) / 100;
        this.sliders[1].value = `${value}`;
        this.sliders[1].ariaValueText = this.ctx.localeManager.t('ariaValuePanRange', { min, max });
    }

    private setSliderRatioClamped(slider: HTMLInputElement, clampMin: number, clampMax: number) {
        const ratio = this.getSliderRatio(slider);
        const clampedRatio = clamp(clampMin, ratio, clampMax);
        if (clampedRatio !== ratio) {
            this.setSliderRatio(slider, clampedRatio);
        }
        return clampedRatio;
    }

    private setSliderRatio(slider: HTMLInputElement, ratio: number) {
        const value = Math.round(ratio * 10000) / 100;
        slider.value = `${value}`;
        slider.ariaValueText = formatPercent(value / 100);
    }

    private getSliderRatio(slider: HTMLInputElement) {
        return parseFloat(slider.value) / 100;
    }

    testFindTarget(
        type: NavigatorButtonType,
        canvasX: number,
        canvasY: number
    ): { target: HTMLElement; x: number; y: number } {
        const target = this.sliders[{ min: 0, pan: 1, max: 2 }[type]];
        const x = canvasX - parseFloat(target.style.left) - parseFloat(this.toolbar.style.left);
        const y = canvasY - parseFloat(target.style.top) - parseFloat(this.toolbar.style.top);
        return { target, x, y };
    }
}
