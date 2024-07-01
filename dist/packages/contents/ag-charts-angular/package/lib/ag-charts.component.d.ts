import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { AgChartsBase } from './ag-charts-base';
import * as i0 from "@angular/core";
export declare class AgCharts extends AgChartsBase<AgChartOptions> {
    protected ngZone: NgZone;
    options: AgChartOptions;
    onChartReady: EventEmitter<AgChartInstance>;
    constructor(elementDef: ElementRef, ngZone: NgZone);
    protected createChart(options: AgChartOptions): AgChartInstance<AgChartOptions>;
    static ɵfac: i0.ɵɵFactoryDeclaration<AgCharts, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AgCharts, "ag-charts", never, { "options": { "alias": "options"; "required": false; }; }, { "onChartReady": "onChartReady"; }, never, never, true, never>;
}
