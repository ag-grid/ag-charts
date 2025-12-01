import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, CleanupRegistry, Property, createElement, setAttribute, setElementBBox } from 'ag-charts-core';
import type { BoxBounds, ModuleInstance } from 'ag-charts-core';
import type { AgFlashOnUpdateItem, AgFlashOnUpdateOptions, CssColor, DurationMs, Opacity } from 'ag-charts-types';

type DataSet<T> = _ModuleSupport.DataSet<T>;

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
    private data: unknown[] = [];
    private animationTimeout?: ReturnType<typeof setTimeout>;

    constructor(protected ctx: _ModuleSupport.ModuleContext) {
        super();
        this.element = this.ctx.domManager.addChild('canvas-background', 'flashOnUpdate');
        this.element.role = 'presentation';

        let firstUpdate = true;
        const onFirstDataUpdate = (e: DataSet<unknown> | undefined): void => {
            if (firstUpdate && e?.data) {
                this.data = e?.data;
                firstUpdate = false;
            } else {
                this.onDataChange(e);
            }
        };
        this.cleanup.register(ctx.eventsHub.on('data:update', onFirstDataUpdate));
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

    private flashCategoryBands(e: DataSet<unknown> | undefined): void {
        this.clearFlash();

        const flashBounds: BoxBounds[] = this.computeCategoryFlashBounds(e);
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

    private computeCategoryFlashBounds(e: DataSet<unknown> | undefined): BoxBounds[] {
        e satisfies any;
        this.data satisfies any;
        return [{ x: 20, y: 30, height: 100, width: 140 }];
    }

    private onDataChange(e: DataSet<unknown> | undefined): void {
        if (!this.enabled) return;

        switch (this.item) {
            case 'chart':
                return this.flashElem(this.ctx.widgets.containerWidget.getElement());
            case 'category':
                return this.flashCategoryBands(e);
            default:
                const unreachable = (a: never): never => a;
                return unreachable(this.item);
        }
    }
}
