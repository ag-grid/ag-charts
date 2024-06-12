import { AfterViewInit, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output } from '@angular/core';

import { AgBaseChartListeners, AgChartInstance, AgChartLegendListeners, AgSeriesListeners } from 'ag-charts-community';

export abstract class AgChartsBase<Options extends {}> implements AfterViewInit, OnChanges, OnDestroy {
    public chart?: AgChartInstance;
    public abstract options: Options;
    public abstract onChartReady: EventEmitter<AgChartInstance>;

    protected _nativeElement: any;
    protected _initialised = false;
    protected ngZone!: NgZone;

    protected abstract createChart(options: Options): any;

    ngAfterViewInit(): void {
        const options = this.patchChartOptions(this.options);

        this.chart = this.runOutsideAngular(() => this.createChart(options));
        this._initialised = true;

        (this.chart as any).chart.waitForUpdate().then(() => {
            this.onChartReady.emit(this.chart);
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
            for (const [listenerName, listener] of Object.entries(config)) {
                if (typeof listener !== 'function') continue;

                config[listenerName] = (...args: any) => {
                    this.runInsideAngular(() => listener(...args));
                };
            }
        };

        patchListeners(propsOptions?.legend?.listeners);
        patchListeners(propsOptions?.listeners);
        propsOptions.series?.forEach((series: any) => {
            patchListeners(series.listeners);
        });

        if (propsOptions.container) {
            return propsOptions;
        }

        return { ...propsOptions, container: this._nativeElement };
    }

    private runOutsideAngular<T>(callback: () => T): T {
        return this.ngZone ? this.ngZone.runOutsideAngular(callback) : callback();
    }

    private runInsideAngular<T>(callback: () => T): T {
        return this.ngZone ? this.ngZone.run(callback) : callback();
    }
}
