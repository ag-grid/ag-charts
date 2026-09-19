import * as i0 from '@angular/core';
import { Component, EventEmitter, Output, Input, ViewEncapsulation, NgModule } from '@angular/core';
import { AgCharts as AgCharts$1 } from 'ag-charts-community';

class AgChartsBase {
    constructor() {
        this._initialised = false;
    }
    ngAfterViewInit() {
        const options = this.patchChartOptions(this.options);
        this.chart = this.runOutsideAngular(() => this.createChart(options, { modules: this.modules }));
        this._initialised = true;
        this.chart.chart.waitForUpdate().then(() => {
            this.chartReady.emit(this.chart);
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
    // Returns a patched copy rather than mutating the consumer's options: event-style callbacks
    // (listeners, context-menu actions) are wrapped to re-enter the Angular zone the chart runs outside.
    patchChartOptions(propsOptions) {
        // Every deref below assumes an options object, so validate first and build from what comes back;
        // otherwise an invalid `[options]` input throws a raw TypeError instead of a chart diagnostic.
        propsOptions = AgCharts$1.__validateOptionsArgument(propsOptions, `<${this.selector}> \`options\` input`);
        const patched = { ...propsOptions };
        if (propsOptions.listeners) {
            patched.listeners = this.patchListeners(propsOptions.listeners);
        }
        if (propsOptions.legend?.listeners) {
            patched.legend = { ...propsOptions.legend, listeners: this.patchListeners(propsOptions.legend.listeners) };
        }
        if (Array.isArray(propsOptions.series)) {
            patched.series = propsOptions.series.map((series) => series?.listeners ? { ...series, listeners: this.patchListeners(series.listeners) } : series);
        }
        if (propsOptions.axes) {
            // `axes` is a dictionary keyed by axis name, not an array.
            patched.axes = Object.fromEntries(Object.entries(propsOptions.axes).map(([axisKey, axis]) => [axisKey, this.patchAxis(axis)]));
        }
        for (const captionKey of ['title', 'subtitle', 'footnote']) {
            const caption = propsOptions[captionKey];
            if (caption?.listeners) {
                patched[captionKey] = { ...caption, listeners: this.patchListeners(caption.listeners) };
            }
        }
        if (propsOptions.contextMenu) {
            patched.contextMenu = this.patchContextMenu(propsOptions.contextMenu);
        }
        if (typeof propsOptions.validations?.issueRaised === 'function') {
            patched.validations = {
                ...propsOptions.validations,
                issueRaised: this.wrapZoneAction(propsOptions.validations.issueRaised),
            };
        }
        patched.container ??= this._nativeElement;
        return patched;
    }
    // An axis carries listeners at two levels: its own, and one per cross line. Both re-enter the zone.
    patchAxis(axis) {
        if (!axis)
            return axis;
        let patched = axis;
        if (axis.listeners) {
            patched = { ...patched, listeners: this.patchListeners(axis.listeners) };
        }
        if (Array.isArray(axis.crossLines)) {
            patched = {
                ...patched,
                crossLines: axis.crossLines.map((crossLine) => crossLine?.listeners
                    ? { ...crossLine, listeners: this.patchListeners(crossLine.listeners) }
                    : crossLine),
            };
        }
        return patched;
    }
    patchListeners(listenerConfig) {
        const config = listenerConfig;
        const patched = {};
        for (const listenerName of Object.keys(config)) {
            const listener = config[listenerName];
            patched[listenerName] =
                typeof listener === 'function'
                    ? (...args) => this.runInsideAngular(() => listener(...args))
                    : listener;
        }
        return patched;
    }
    // Context-menu actions are dispatched from DOM listeners the chart registers outside the Angular
    // zone; without re-entering the zone, options reassignments in actions never trigger change detection.
    patchContextMenu(contextMenu) {
        const patched = { ...contextMenu };
        if (typeof patched.getItems === 'function') {
            patched.getItems = this.wrapGetItems(patched.getItems);
        }
        if (Array.isArray(patched.items)) {
            patched.items = this.wrapContextMenuItems(patched.items);
        }
        return patched;
    }
    wrapGetItems(getItems) {
        return (params) => {
            const items = getItems(params);
            return items ? this.wrapContextMenuItems(items) : undefined;
        };
    }
    wrapContextMenuItems(items) {
        return items.map((item) => {
            if (typeof item === 'string') {
                return item;
            }
            const copy = { ...item };
            if (typeof copy.action === 'function') {
                // The item variants declare incompatible `action` event types; wrapping preserves the runtime signature.
                copy.action = this.wrapZoneAction(copy.action);
            }
            if (Array.isArray(copy.items)) {
                copy.items = this.wrapContextMenuItems(copy.items);
            }
            return copy;
        });
    }
    wrapZoneAction(action) {
        return ((...args) => this.runInsideAngular(() => action(...args)));
    }
    runOutsideAngular(callback) {
        return this.ngZone ? this.ngZone.runOutsideAngular(callback) : callback();
    }
    runInsideAngular(callback) {
        return this.ngZone ? this.ngZone.run(callback) : callback();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgChartsBase, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "20.3.30", type: AgChartsBase, isStandalone: true, selector: "ng-component", usesOnChanges: true, ngImport: i0, template: '', isInline: true }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgChartsBase, decorators: [{
            type: Component,
            args: [{
                    template: '',
                }]
        }] });

// noinspection AngularIncorrectTemplateDefinition
class AgCharts extends AgChartsBase {
    constructor(elementDef, ngZone) {
        super();
        this.ngZone = ngZone;
        this.options = {};
        this.chartReady = new EventEmitter();
        this.selector = 'ag-charts';
        this._nativeElement = elementDef.nativeElement;
    }
    createChart(options, params) {
        return AgCharts$1.create(options, params);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgCharts, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "20.3.30", type: AgCharts, isStandalone: true, selector: "ag-charts", inputs: { options: "options", modules: "modules" }, outputs: { chartReady: "chartReady" }, usesInheritance: true, ngImport: i0, template: '', isInline: true, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgCharts, decorators: [{
            type: Component,
            args: [{
                    selector: 'ag-charts',
                    standalone: true,
                    template: '',
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.NgZone }], propDecorators: { options: [{
                type: Input
            }], modules: [{
                type: Input
            }], chartReady: [{
                type: Output
            }] } });

// noinspection AngularIncorrectTemplateDefinition
class AgFinancialCharts extends AgChartsBase {
    constructor(elementDef, ngZone) {
        super();
        this.ngZone = ngZone;
        this.options = {};
        this.chartReady = new EventEmitter();
        this.selector = 'ag-financial-charts';
        this._nativeElement = elementDef.nativeElement;
    }
    createChart(options, params) {
        return AgCharts$1.createFinancialChart(options, params);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgFinancialCharts, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "20.3.30", type: AgFinancialCharts, isStandalone: true, selector: "ag-financial-charts", inputs: { options: "options", modules: "modules" }, outputs: { chartReady: "chartReady" }, usesInheritance: true, ngImport: i0, template: '', isInline: true, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgFinancialCharts, decorators: [{
            type: Component,
            args: [{
                    selector: 'ag-financial-charts',
                    standalone: true,
                    template: '',
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.NgZone }], propDecorators: { options: [{
                type: Input
            }], modules: [{
                type: Input
            }], chartReady: [{
                type: Output
            }] } });

// noinspection AngularIncorrectTemplateDefinition
class AgGauge extends AgChartsBase {
    constructor(elementDef, ngZone) {
        super();
        this.ngZone = ngZone;
        this.options = { type: 'radial-gauge', value: 0 };
        this.chartReady = new EventEmitter();
        this.selector = 'ag-gauge';
        this._nativeElement = elementDef.nativeElement;
    }
    createChart(options, params) {
        return AgCharts$1.createGauge(options, params);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgGauge, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "20.3.30", type: AgGauge, isStandalone: true, selector: "ag-gauge", inputs: { options: "options", modules: "modules" }, outputs: { chartReady: "chartReady" }, usesInheritance: true, ngImport: i0, template: '', isInline: true, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgGauge, decorators: [{
            type: Component,
            args: [{
                    selector: 'ag-gauge',
                    standalone: true,
                    template: '',
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.NgZone }], propDecorators: { options: [{
                type: Input
            }], modules: [{
                type: Input
            }], chartReady: [{
                type: Output
            }] } });

// noinspection AngularIncorrectTemplateDefinition
class AgQuadrantChart extends AgChartsBase {
    constructor(elementDef, ngZone) {
        super();
        this.ngZone = ngZone;
        this.chartReady = new EventEmitter();
        this.selector = 'ag-quadrant-chart';
        this._nativeElement = elementDef.nativeElement;
    }
    createChart(options, params) {
        return AgCharts$1.createQuadrantChart(options, params);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgQuadrantChart, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "20.3.30", type: AgQuadrantChart, isStandalone: true, selector: "ag-quadrant-chart", inputs: { options: "options", modules: "modules" }, outputs: { chartReady: "chartReady" }, usesInheritance: true, ngImport: i0, template: '', isInline: true, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgQuadrantChart, decorators: [{
            type: Component,
            args: [{
                    selector: 'ag-quadrant-chart',
                    standalone: true,
                    template: '',
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.NgZone }], propDecorators: { options: [{
                type: Input,
                args: [{ required: true }]
            }], modules: [{
                type: Input
            }], chartReady: [{
                type: Output
            }] } });

class AgChartsModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgChartsModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "20.3.30", ngImport: i0, type: AgChartsModule, imports: [AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart], exports: [AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgChartsModule }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.30", ngImport: i0, type: AgChartsModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [],
                    imports: [AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart],
                    exports: [AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart],
                }]
        }] });

/**
 * Generated bundle index. Do not edit.
 */

export { AgCharts, AgChartsModule, AgFinancialCharts, AgGauge, AgQuadrantChart };
//# sourceMappingURL=ag-charts-angular.mjs.map
