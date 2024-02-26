import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    Output,
    ViewEncapsulation,
} from '@angular/core';

import {
    AgBaseChartListeners,
    AgChartInstance,
    AgChartLegendListeners,
    AgChartOptions,
    AgCharts,
    AgSeriesListeners,
} from 'ag-charts-community';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-charts-angular',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgChartsAngular implements AfterViewInit, OnChanges, OnDestroy {
    private _nativeElement: any;
    private _initialised = false;

    public chart?: AgChartInstance;

    @Input()
    public options: AgChartOptions = {};

    @Output()
    public onChartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    constructor(
        elementDef: ElementRef,
        private ngZone: NgZone
    ) {
        this._nativeElement = elementDef.nativeElement;
    }

    ngAfterViewInit(): void {
        const options = this.patchChartOptions(this.options);

        this.chart = this.runOutsideAngular(() => AgCharts.create(options));
        this._initialised = true;

        (this.chart as any).chart.waitForUpdate().then(() => {
            this.onChartReady.emit(this.chart);
        });
    }

    // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    ngOnChanges(changes: any): void {
        this.runOutsideAngular(() => {
            if (!this._initialised || !this.chart) {
                return;
            }
            AgCharts.update(this.chart, this.patchChartOptions(this.options));
        });
    }

    public ngOnDestroy(): void {
        if (this._initialised && this.chart) {
            this.chart.destroy();
            this.chart = undefined;
            this._initialised = false;
        }
    }

    private patchChartOptions(propsOptions: AgChartOptions) {
        const patchListeners = (
            listenerConfig: undefined | AgChartLegendListeners | AgSeriesListeners<any> | AgBaseChartListeners<any>
        ) => {
            const config = listenerConfig ?? ({} as any);
            for (const [listenerName, listener] of Object.entries(config)) {
                if (!listener || typeof listener !== 'function') continue;

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
