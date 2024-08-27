import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import { AgChartInstance, AgCharts as AgChartsAPI, AgGaugeOptions } from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-gauge',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgGauge extends AgChartsBase<AgGaugeOptions> {
    @Input()
    public options: AgGaugeOptions = { type: 'radial-gauge', value: 0 };

    @Output()
    public onChartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgGaugeOptions) {
        return AgChartsAPI.createGauge(options);
    }
}
