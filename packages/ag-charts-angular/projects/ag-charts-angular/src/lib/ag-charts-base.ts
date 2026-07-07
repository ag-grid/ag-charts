import { AfterViewInit, Component, EventEmitter, NgZone, OnChanges, OnDestroy } from '@angular/core';

import {
    AgBaseChartListeners,
    AgChartInstance,
    AgChartLegendListeners,
    AgContextMenuGetItemsCallback,
    AgContextMenuItem,
    AgContextMenuOptions,
    AgSeriesListeners,
} from 'ag-charts-community';

// Marks functions already wrapped by patchChartOptions, which re-runs on every ngOnChanges.
const ZONE_WRAPPED = Symbol('agChartsAngularZoneWrapped');

@Component({
    template: '',
})
export abstract class AgChartsBase<Options extends {}> implements AfterViewInit, OnChanges, OnDestroy {
    public chart?: AgChartInstance;
    public abstract options: Options;
    public abstract chartReady: EventEmitter<AgChartInstance>;

    protected _nativeElement: any;
    protected _initialised = false;
    protected ngZone!: NgZone;

    protected abstract createChart(options: Options): any;

    ngAfterViewInit(): void {
        const options = this.patchChartOptions(this.options);

        this.chart = this.runOutsideAngular(() => this.createChart(options));
        this._initialised = true;

        (this.chart as any).chart.waitForUpdate().then(() => {
            this.chartReady.emit(this.chart);
        });
    }

    // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    ngOnChanges(_changes: any): void {
        this.runOutsideAngular(() => {
            if (!this._initialised || !this.chart) {
                return;
            }
            this.chart.update(this.patchChartOptions(this.options));
        });
    }

    public ngOnDestroy(): void {
        if (this._initialised && this.chart) {
            this.chart.destroy();
            this.chart = undefined;
            this._initialised = false;
        }
    }

    private patchChartOptions(propsOptions: any): any {
        const patchListeners = (
            listenerConfig: undefined | AgChartLegendListeners | AgSeriesListeners<any> | AgBaseChartListeners<any>
        ) => {
            const config = listenerConfig ?? ({} as any);
            for (const listenerName of Object.keys(config)) {
                const listener = config[listenerName];
                if (typeof listener !== 'function') continue;

                config[listenerName] = (...args: any) => {
                    this.runInsideAngular(() => listener(...args));
                };
            }
        };

        patchListeners(propsOptions?.legend?.listeners);
        patchListeners(propsOptions?.listeners);
        if (propsOptions.series) {
            for (const series of propsOptions.series) {
                patchListeners(series.listeners);
            }
        }
        this.patchContextMenu(propsOptions?.contextMenu);

        if (propsOptions.container) {
            return propsOptions;
        }

        return { ...propsOptions, container: this._nativeElement };
    }

    // Context-menu actions are dispatched from DOM listeners the chart registers outside the Angular
    // zone; without re-entering the zone, options reassignments in actions never trigger change detection.
    private patchContextMenu(contextMenu: AgContextMenuOptions | undefined): void {
        if (!contextMenu) {
            return;
        }
        if (typeof contextMenu.getItems === 'function') {
            contextMenu.getItems = this.wrapGetItems(contextMenu.getItems);
        }
        if (Array.isArray(contextMenu.items)) {
            contextMenu.items = this.wrapContextMenuItems(contextMenu.items);
        }
    }

    private wrapGetItems(getItems: AgContextMenuGetItemsCallback): AgContextMenuGetItemsCallback {
        if ((getItems as any)[ZONE_WRAPPED]) {
            return getItems;
        }
        const wrapped: AgContextMenuGetItemsCallback = (params) => {
            const items = getItems(params);
            return items && this.wrapContextMenuItems(items);
        };
        (wrapped as any)[ZONE_WRAPPED] = true;
        return wrapped;
    }

    private wrapContextMenuItems(items: AgContextMenuItem[]): AgContextMenuItem[] {
        return items.map((item) => {
            if (typeof item === 'string') {
                return item;
            }
            const copy = { ...item };
            if (typeof copy.action === 'function') {
                // The item variants declare incompatible `action` event types; wrapping preserves the runtime signature.
                copy.action = this.wrapZoneAction(copy.action as (...args: any[]) => void) as typeof copy.action;
            }
            if (Array.isArray(copy.items)) {
                copy.items = this.wrapContextMenuItems(copy.items);
            }
            return copy;
        });
    }

    private wrapZoneAction<T extends (...args: any[]) => void>(action: T): T {
        if ((action as any)[ZONE_WRAPPED]) {
            return action;
        }
        const wrapped = ((...args: any[]) => this.runInsideAngular(() => action(...args))) as T;
        (wrapped as any)[ZONE_WRAPPED] = true;
        return wrapped;
    }

    private runOutsideAngular<T>(callback: () => T): T {
        return this.ngZone ? this.ngZone.runOutsideAngular(callback) : callback();
    }

    private runInsideAngular<T>(callback: () => T): T {
        return this.ngZone ? this.ngZone.run(callback) : callback();
    }
}
