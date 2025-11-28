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

    private cleanup = new CleanupRegistry();

    constructor(protected moduleContext: _ModuleSupport.ModuleContext) {
        super();
        this.cleanup.register(
            this.moduleContext.eventsHub.on('data:update', () => console.log('flashOnUpdate - placeholder'))
        );
    }

    destroy() {
        this.cleanup.flush();
    }
}
