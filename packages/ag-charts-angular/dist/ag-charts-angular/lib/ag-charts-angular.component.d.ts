import { AfterViewInit, ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy } from '@angular/core';
import { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import * as i0 from "@angular/core";
export declare class AgChartsAngular implements AfterViewInit, OnChanges, OnDestroy {
    private ngZone;
    private _nativeElement;
    private _initialised;
    chart?: AgChartInstance;
    options: AgChartOptions;
    onChartReady: EventEmitter<AgChartInstance>;
    constructor(elementDef: ElementRef, ngZone: NgZone);
    ngAfterViewInit(): void;
    ngOnChanges(changes: any): void;
    ngOnDestroy(): void;
    private patchChartOptions;
    private runOutsideAngular;
    private runInsideAngular;
    static ɵfac: i0.ɵɵFactoryDeclaration<AgChartsAngular, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AgChartsAngular, "ag-charts-angular", never, { "options": "options"; }, { "onChartReady": "onChartReady"; }, never, never, true>;
}
