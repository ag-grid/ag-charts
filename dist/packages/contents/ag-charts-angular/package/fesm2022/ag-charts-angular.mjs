import * as i0 from '@angular/core';
import { EventEmitter, Component, ViewEncapsulation, Input, Output, NgModule } from '@angular/core';
import { AgCharts as AgCharts$1 } from 'ag-charts-community';

class AgChartsBase {
    chart;
    _nativeElement;
    _initialised = false;
    ngZone;
    ngAfterViewInit() {
        const options = this.patchChartOptions(this.options);
        this.chart = this.runOutsideAngular(() => this.createChart(options));
        this._initialised = true;
        this.chart.chart.waitForUpdate().then(() => {
            this.onChartReady.emit(this.chart);
        });
    }
    // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    ngOnChanges(_changes) {
        this.runOutsideAngular(() => {
            if (!this._initialised || !this.chart) {
                return;
            }
            this.chart.update(this.patchChartOptions(this.options));
        });
    }
    ngOnDestroy() {
        if (this._initialised && this.chart) {
            this.chart.destroy();
            this.chart = undefined;
            this._initialised = false;
        }
    }
    patchChartOptions(propsOptions) {
        const patchListeners = (listenerConfig) => {
            const config = listenerConfig ?? {};
            for (const [listenerName, listener] of Object.entries(config)) {
                if (typeof listener !== 'function')
                    continue;
                config[listenerName] = (...args) => {
                    this.runInsideAngular(() => listener(...args));
                };
            }
        };
        patchListeners(propsOptions?.legend?.listeners);
        patchListeners(propsOptions?.listeners);
        propsOptions.series?.forEach((series) => {
            patchListeners(series.listeners);
        });
        if (propsOptions.container) {
            return propsOptions;
        }
        return { ...propsOptions, container: this._nativeElement };
    }
    runOutsideAngular(callback) {
        return this.ngZone ? this.ngZone.runOutsideAngular(callback) : callback();
    }
    runInsideAngular(callback) {
        return this.ngZone ? this.ngZone.run(callback) : callback();
    }
}

// noinspection AngularIncorrectTemplateDefinition
class AgCharts extends AgChartsBase {
    ngZone;
    options = {};
    onChartReady = new EventEmitter();
    constructor(elementDef, ngZone) {
        super();
        this.ngZone = ngZone;
        this._nativeElement = elementDef.nativeElement;
    }
    createChart(options) {
        return AgCharts$1.create(options);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AgCharts, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.2.12", type: AgCharts, isStandalone: true, selector: "ag-charts", inputs: { options: "options" }, outputs: { onChartReady: "onChartReady" }, usesInheritance: true, ngImport: i0, template: '', isInline: true, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AgCharts, decorators: [{
            type: Component,
            args: [{
                    selector: 'ag-charts',
                    standalone: true,
                    template: '',
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { options: [{
                type: Input
            }], onChartReady: [{
                type: Output
            }] } });

// noinspection AngularIncorrectTemplateDefinition
class AgFinancialCharts extends AgChartsBase {
    ngZone;
    options = {};
    onChartReady = new EventEmitter();
    constructor(elementDef, ngZone) {
        super();
        this.ngZone = ngZone;
        this._nativeElement = elementDef.nativeElement;
    }
    createChart(options) {
        return AgCharts$1.createFinancialChart(options);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AgFinancialCharts, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.2.12", type: AgFinancialCharts, isStandalone: true, selector: "ag-financial-charts", inputs: { options: "options" }, outputs: { onChartReady: "onChartReady" }, usesInheritance: true, ngImport: i0, template: '', isInline: true, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AgFinancialCharts, decorators: [{
            type: Component,
            args: [{
                    selector: 'ag-financial-charts',
                    standalone: true,
                    template: '',
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { options: [{
                type: Input
            }], onChartReady: [{
                type: Output
            }] } });

class AgChartsModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AgChartsModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.2.12", ngImport: i0, type: AgChartsModule, imports: [AgCharts, AgFinancialCharts], exports: [AgCharts, AgFinancialCharts] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AgChartsModule });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AgChartsModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [],
                    imports: [AgCharts, AgFinancialCharts],
                    exports: [AgCharts, AgFinancialCharts],
                }]
        }] });

/**
 * Generated bundle index. Do not edit.
 */

export { AgCharts, AgChartsModule, AgFinancialCharts };
//# sourceMappingURL=ag-charts-angular.mjs.map
