import { AfterViewInit, EventEmitter, NgZone, OnChanges, OnDestroy } from '@angular/core';
import { AgChartInstance } from 'ag-charts-community';
export declare abstract class AgChartsBase<Options extends {}> implements AfterViewInit, OnChanges, OnDestroy {
    chart?: AgChartInstance;
    abstract options: Options;
    abstract onChartReady: EventEmitter<AgChartInstance>;
    protected _nativeElement: any;
    protected _initialised: boolean;
    protected ngZone: NgZone;
    protected abstract createChart(options: Options): any;
    ngAfterViewInit(): void;
    ngOnChanges(_changes: any): void;
    ngOnDestroy(): void;
    private patchChartOptions;
    private runOutsideAngular;
    private runInsideAngular;
}
