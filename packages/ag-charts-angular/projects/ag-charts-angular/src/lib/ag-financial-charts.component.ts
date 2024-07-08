import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import { AgChartInstance, AgCharts as AgChartsAPI, AgFinancialChartOptions } from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-financial-charts',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgFinancialCharts extends AgChartsBase<AgFinancialChartOptions> {
    @Input()
    public options: AgFinancialChartOptions = {};

    @Output()
    public onChartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgFinancialChartOptions) {
        return AgChartsAPI.createFinancialChart(options);
    }
}
