import { _ModuleSupport } from 'ag-charts-community';
import {
    BaseProperties,
    CleanupRegistry,
    Property,
    createElement,
    setAttribute,
    setElementBBox,
    setElementStyle,
} from 'ag-charts-core';
import type { BoxBounds, ModuleInstance } from 'ag-charts-core';
import type { AgFlashOnUpdateItem, AgFlashOnUpdateOptions, CssColor, DurationMs, Opacity } from 'ag-charts-types';

type AxisContext = ReturnType<_ModuleSupport.ModuleContext['axisManager']['getAxisContext']>[number];

function findPrimaryCategoryAxisContext(ctx: _ModuleSupport.ModuleContext): AxisContext | undefined {
    return ctx.axisManager.getAxisContext(_ModuleSupport.ChartAxisDirection.X)[0];
}

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
        const axisCtx = findPrimaryCategoryAxisContext(this.ctx);
        if (!axisCtx) return;

        this.clearFlash();

        const flashBounds: BoxBounds[] = this.computeCategoryFlashBounds(axisCtx, diff);
        for (const bounds of flashBounds) {
            const e = createElement('div');
            setAttribute(e, 'role', 'presentation');
            setElementStyle(e, 'position', 'absolute');
            setElementBBox(e, bounds);
            this.element.appendChild(e);
            this.flashElem(e);
        }

        const duration = this.flashDuration + this.fadeDuration;
        this.animationTimeout = setTimeout(() => this.clearFlash(), duration);
    }

    private computeCategories(diff: _ModuleSupport.DataModelDiff): Set<string> {
        const result = new Set<string>();
        for (const seriesId of Object.keys(diff)) {
            for (const key of ['updated', 'added', 'moved'] as const) {
                for (const value of diff[seriesId][key]) {
                    result.add(value);
                }
            }
        }
        return result;
    }

    private computeCategoryFlashBounds(axisCtx: AxisContext, diff: _ModuleSupport.DataModelDiff): BoxBounds[] {
        const seriesBounds = this.ctx.widgets.seriesWidget.getBounds();

        const makeBox: (band: [number, number]) => BoxBounds =
            axisCtx.direction === _ModuleSupport.ChartAxisDirection.X
                ? ([start, end]) => {
                      return {
                          x: seriesBounds.x + start,
                          y: seriesBounds.y,
                          width: end - start,
                          height: seriesBounds.height,
                      };
                  }
                : ([start, end]) => {
                      return {
                          x: seriesBounds.x,
                          y: seriesBounds.y + start,
                          width: seriesBounds.width,
                          height: end - start,
                      };
                  };

        const result: BoxBounds[] = [];
        const categories: Set<string> = this.computeCategories(diff);
        for (const c of categories) {
            const measurements = axisCtx.measureBand(c);
            if (measurements?.band) {
                result.push(makeBox(measurements.band));
            }
        }
        return result;
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
