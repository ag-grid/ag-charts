import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, CleanupRegistry, Property } from 'ag-charts-core';
import type { ModuleInstance } from 'ag-charts-core';
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

    constructor(protected ctx: _ModuleSupport.ModuleContext) {
        super();
        const onFirstDraw = () => {
            ctx.eventsHub.off('layout:complete', onFirstDraw);
            this.cleanup.register(ctx.eventsHub.on('data:update', () => this.onDataChange()));
        };
        this.cleanup.register(ctx.eventsHub.on('layout:complete', onFirstDraw));
    }

    destroy() {
        this.cleanup.flush();
    }

    private onDataChange(): void {
        if (!this.enabled) return;

        const containerEl = this.ctx.widgets.containerWidget.getElement();

        const { flashDuration, fadeDuration } = this;
        const duration = flashDuration + fadeDuration;
        containerEl.animate(
            [
                { background: this.color, offset: 0 },
                { background: this.color, offset: flashDuration / duration },
                { background: 'transparent', offset: 1 },
            ],
            { duration, easing: 'ease-out' }
        );
    }
}
