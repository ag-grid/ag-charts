import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, CleanupRegistry, Property, createElement, setAttribute, setElementBBox } from 'ag-charts-core';
import type { BoxBounds, ModuleInstance } from 'ag-charts-core';
import type { AgFlashOnUpdateItem, AgFlashOnUpdateOptions, CssColor, DurationMs, Opacity } from 'ag-charts-types';

export class FlashOnUpdate extends BaseProperties implements ModuleInstance, AgFlashOnUpdateOptions {
    static readonly className = 'FlashOnUpdate';

    @Property
    enabled: boolean = false;

    @Property
    item: AgFlashOnUpdateItem = 'chart';

    @Property
    color: CssColor = '#cfeeff';

    @Property
    opacity: Opacity = 1;

    @Property
    flashDuration: DurationMs = 100;

    @Property
    fadeDuration: DurationMs = 900;

    private readonly cleanup = new CleanupRegistry();
    private readonly element: Element;
    private animationTimeout?: ReturnType<typeof setTimeout>;

    constructor(protected ctx: _ModuleSupport.ModuleContext) {
        super();
        this.element = this.ctx.domManager.addChild('canvas-background', 'flashOnUpdate');
        this.element.role = 'presentation';

        let firstUpdate = true;
        const onDataUpdate = (ev: _ModuleSupport.DataSet<unknown> | undefined): void => {
            if (firstUpdate) {
                firstUpdate = false;
            } else {
                this.onDataUpdate(ev);
            }
        };
        this.cleanup.register(
            this.ctx.eventsHub.on('data:update', onDataUpdate),
            this.ctx.eventsHub.on('datamodel:diff', (e) => this.onDataModelDiff(e))
        );
    }

    destroy() {
        this.ctx.domManager.removeChild('canvas-background', 'flashOnUpdate');
        this.cleanup.flush();
    }

    private clearFlash(): void {
        this.element.innerHTML = '';
        clearTimeout(this.animationTimeout);
        this.animationTimeout = undefined;
    }

    private flashElem(el: Animatable): void {
        const { flashDuration, fadeDuration } = this;
        const duration = flashDuration + fadeDuration;
        el.animate(
            [
                { background: this.color, offset: 0 },
                { background: this.color, offset: flashDuration / duration },
                { background: 'transparent', offset: 1 },
            ],
            { duration, easing: 'ease-out' }
        );
    }

    private flashCategoryBands(diff: _ModuleSupport.DataModelDiff): void {
        this.clearFlash();

        const flashBounds: BoxBounds[] = this.computeCategoryFlashBounds(diff);
        for (const bounds of flashBounds) {
            const e = createElement('div');
            setAttribute(e, 'role', 'presentation');
            setElementBBox(e, bounds);
            this.element.appendChild(e);
            this.flashElem(e);
        }

        const duration = this.flashDuration + this.fadeDuration;
        this.animationTimeout = setTimeout(() => this.clearFlash(), duration);
    }

    private computeCategoryFlashBounds(diff: _ModuleSupport.DataModelDiff): BoxBounds[] {
        console.log(diff);
        return [{ x: 20, y: 30, height: 100, width: 140 }];
    }

    private onDataUpdate(ev: _ModuleSupport.DataSet<unknown> | undefined): void {
        if (!this.enabled || this.item !== 'chart' || !ev) return;
        this.flashElem(this.ctx.widgets.containerWidget.getElement());
    }

    private onDataModelDiff(ev: _ModuleSupport.DataModelDiffEvent): void {
        if (!this.enabled || this.item !== 'category') return;
        this.flashCategoryBands(ev.diff);
    }
}
