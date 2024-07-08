import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import { AgChartInstance, AgChartOptions, AgCharts as AgChartsAPI } from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-charts',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgCharts extends AgChartsBase<AgChartOptions> {
    @Input()
    public options: AgChartOptions = {};

    @Output()
    public onChartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgChartOptions) {
        return AgChartsAPI.create(options);
    }
}
