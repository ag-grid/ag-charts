import { Component, ElementRef, EventEmitter, Input, NgZone, Output, ViewEncapsulation } from '@angular/core';

import { AgChartInstance, AgCharts as AgChartsAPI, AgQuadrantChartOptions } from 'ag-charts-community';

import { AgChartsBase } from './ag-charts-base';

// noinspection AngularIncorrectTemplateDefinition
@Component({
    selector: 'ag-quadrant-chart',
    standalone: true,
    template: '',
    encapsulation: ViewEncapsulation.None,
})
export class AgQuadrantChart extends AgChartsBase<AgQuadrantChartOptions> {
    // Required rather than defaulted: `xKey`/`yKey` have no meaningful placeholder value.
    @Input({ required: true })
    public options!: AgQuadrantChartOptions;

    @Output()
    public chartReady: EventEmitter<AgChartInstance> = new EventEmitter();

    constructor(
        elementDef: ElementRef,
        protected ngZone: NgZone
    ) {
        super();
        this._nativeElement = elementDef.nativeElement;
    }

    protected createChart(options: AgQuadrantChartOptions) {
        return AgChartsAPI.createQuadrantChart(options);
    }
}
