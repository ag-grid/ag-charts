import * as i0 from '@angular/core';
import { EventEmitter, Component, ViewEncapsulation, Input, Output, NgModule } from '@angular/core';
import { AgCharts } from 'ag-charts-community';

// noinspection AngularIncorrectTemplateDefinition
class AgChartsAngular {
    constructor(elementDef, ngZone) {
        this.ngZone = ngZone;
        this._initialised = false;
        this.options = {};
        this.onChartReady = new EventEmitter();
        this._nativeElement = elementDef.nativeElement;
    }
    ngAfterViewInit() {
        const options = this.patchChartOptions(this.options);
        this.chart = this.runOutsideAngular(() => AgCharts.create(options));
        this._initialised = true;
        this.chart.chart.waitForUpdate().then(() => {
            this.onChartReady.emit(this.chart);
        });
    }
    // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    ngOnChanges(changes) {
        this.runOutsideAngular(() => {
            if (!this._initialised || !this.chart) {
                return;
            }
            AgCharts.update(this.chart, this.patchChartOptions(this.options));
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
        var _a, _b;
        const patchListeners = (listenerConfig) => {
            const config = listenerConfig !== null && listenerConfig !== void 0 ? listenerConfig : {};
            Object.entries(config).forEach(([listenerName, listener]) => {
                if (listener && typeof listener === 'function') {
                    config[listenerName] = (...args) => {
                        this.runInsideAngular(() => listener(...args));
                    };
                }
            });
        };
        patchListeners((_a = propsOptions === null || propsOptions === void 0 ? void 0 : propsOptions.legend) === null || _a === void 0 ? void 0 : _a.listeners);
        patchListeners(propsOptions === null || propsOptions === void 0 ? void 0 : propsOptions.listeners);
        (_b = propsOptions.series) === null || _b === void 0 ? void 0 : _b.forEach((series) => {
            patchListeners(series.listeners);
        });
        if (propsOptions.container) {
            return propsOptions;
        }
        return Object.assign(Object.assign({}, propsOptions), { container: this._nativeElement });
    }
    runOutsideAngular(callback) {
        return this.ngZone ? this.ngZone.runOutsideAngular(callback) : callback();
    }
    runInsideAngular(callback) {
        return this.ngZone ? this.ngZone.run(callback) : callback();
    }
}
AgChartsAngular.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: AgChartsAngular, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
AgChartsAngular.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.3.0", type: AgChartsAngular, isStandalone: true, selector: "ag-charts-angular", inputs: { options: "options" }, outputs: { onChartReady: "onChartReady" }, usesOnChanges: true, ngImport: i0, template: '', isInline: true, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: AgChartsAngular, decorators: [{
            type: Component,
            args: [{
                    selector: 'ag-charts-angular',
                    standalone: true,
                    template: '',
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { options: [{
                type: Input
            }], onChartReady: [{
                type: Output
            }] } });

class AgChartsAngularModule {
}
AgChartsAngularModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: AgChartsAngularModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
AgChartsAngularModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.3.0", ngImport: i0, type: AgChartsAngularModule, imports: [AgChartsAngular], exports: [AgChartsAngular] });
AgChartsAngularModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: AgChartsAngularModule, imports: [AgChartsAngular] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: AgChartsAngularModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [],
                    imports: [AgChartsAngular],
                    exports: [AgChartsAngular],
                }]
        }] });

/**
 * Generated bundle index. Do not edit.
 */

export { AgChartsAngular, AgChartsAngularModule };
//# sourceMappingURL=ag-charts-angular.mjs.map
