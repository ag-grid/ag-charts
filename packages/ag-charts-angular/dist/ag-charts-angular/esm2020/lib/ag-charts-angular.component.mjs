import { Component, EventEmitter, Input, Output, ViewEncapsulation, } from '@angular/core';
import { AgCharts, } from 'ag-charts-community';
import * as i0 from "@angular/core";
// noinspection AngularIncorrectTemplateDefinition
export class AgChartsAngular {
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
        const patchListeners = (listenerConfig) => {
            const config = listenerConfig ?? {};
            Object.entries(config).forEach(([listenerName, listener]) => {
                if (listener && typeof listener === 'function') {
                    config[listenerName] = (...args) => {
                        this.runInsideAngular(() => listener(...args));
                    };
                }
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWctY2hhcnRzLWFuZ3VsYXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYWctY2hhcnRzLWFuZ3VsYXIvc3JjL2xpYi9hZy1jaGFydHMtYW5ndWxhci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVILFNBQVMsRUFFVCxZQUFZLEVBQ1osS0FBSyxFQUlMLE1BQU0sRUFDTixpQkFBaUIsR0FDcEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUtILFFBQVEsR0FFWCxNQUFNLHFCQUFxQixDQUFDOztBQUU3QixrREFBa0Q7QUFPbEQsTUFBTSxPQUFPLGVBQWU7SUFZeEIsWUFDSSxVQUFzQixFQUNkLE1BQWM7UUFBZCxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBWmxCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBS3RCLFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBRzdCLGlCQUFZLEdBQWtDLElBQUksWUFBWSxFQUFFLENBQUM7UUFNcEUsSUFBSSxDQUFDLGNBQWMsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDO0lBQ25ELENBQUM7SUFFRCxlQUFlO1FBQ1gsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFFeEIsSUFBSSxDQUFDLEtBQWEsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNoRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMs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aW1wb3J0IHtcbiAgICBBZnRlclZpZXdJbml0LFxuICAgIENvbXBvbmVudCxcbiAgICBFbGVtZW50UmVmLFxuICAgIEV2ZW50RW1pdHRlcixcbiAgICBJbnB1dCxcbiAgICBOZ1pvbmUsXG4gICAgT25DaGFuZ2VzLFxuICAgIE9uRGVzdHJveSxcbiAgICBPdXRwdXQsXG4gICAgVmlld0VuY2Fwc3VsYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1xuICAgIEFnQmFzZUNoYXJ0TGlzdGVuZXJzLFxuICAgIEFnQ2hhcnRJbnN0YW5jZSxcbiAgICBBZ0NoYXJ0TGVnZW5kTGlzdGVuZXJzLFxuICAgIEFnQ2hhcnRPcHRpb25zLFxuICAgIEFnQ2hhcnRzLFxuICAgIEFnU2VyaWVzTGlzdGVuZXJzLFxufSBmcm9tICdhZy1jaGFydHMtY29tbXVuaXR5JztcblxuLy8gbm9pbnNwZWN0aW9uIEFuZ3VsYXJJbmNvcnJlY3RUZW1wbGF0ZURlZmluaXRpb25cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAnYWctY2hhcnRzLWFuZ3VsYXInLFxuICAgIHN0YW5kYWxvbmU6IHRydWUsXG4gICAgdGVtcGxhdGU6ICcnLFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG59KVxuZXhwb3J0IGNsYXNzIEFnQ2hhcnRzQW5ndWxhciBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95IHtcbiAgICBwcml2YXRlIF9uYXRpdmVFbGVtZW50OiBhbnk7XG4gICAgcHJpdmF0ZSBfaW5pdGlhbGlzZWQgPSBmYWxzZTtcblxuICAgIHB1YmxpYyBjaGFydD86IEFnQ2hhcnRJbnN0YW5jZTtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIG9wdGlvbnM6IEFnQ2hhcnRPcHRpb25zID0ge307XG5cbiAgICBAT3V0cHV0KClcbiAgICBwdWJsaWMgb25DaGFydFJlYWR5OiBFdmVudEVtaXR0ZXI8QWdDaGFydEluc3RhbmNlPiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBlbGVtZW50RGVmOiBFbGVtZW50UmVmLFxuICAgICAgICBwcml2YXRlIG5nWm9uZTogTmdab25lXG4gICAgKSB7XG4gICAgICAgIHRoaXMuX25hdGl2ZUVsZW1lbnQgPSBlbGVtZW50RGVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgfVxuXG4gICAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvcHRpb25zID0gdGhpcy5wYXRjaENoYXJ0T3B0aW9ucyh0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuY2hhcnQgPSB0aGlzLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IEFnQ2hhcnRzLmNyZWF0ZShvcHRpb25zKSk7XG4gICAgICAgIHRoaXMuX2luaXRpYWxpc2VkID0gdHJ1ZTtcblxuICAgICAgICAodGhpcy5jaGFydCBhcyBhbnkpLmNoYXJ0LndhaXRGb3JVcGRhdGUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25DaGFydFJlYWR5LmVtaXQodGhpcy5jaGFydCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIG5vaW5zcGVjdGlvbiBKU1VudXNlZEdsb2JhbFN5bWJvbHMsSlNVbnVzZWRMb2NhbFN5bWJvbHNcbiAgICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2luaXRpYWxpc2VkIHx8ICF0aGlzLmNoYXJ0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQWdDaGFydHMudXBkYXRlKHRoaXMuY2hhcnQsIHRoaXMucGF0Y2hDaGFydE9wdGlvbnModGhpcy5vcHRpb25zKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxpc2VkICYmIHRoaXMuY2hhcnQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhcnQuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5jaGFydCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuX2luaXRpYWxpc2VkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHBhdGNoQ2hhcnRPcHRpb25zKHByb3BzT3B0aW9uczogQWdDaGFydE9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgcGF0Y2hMaXN0ZW5lcnMgPSAoXG4gICAgICAgICAgICBsaXN0ZW5lckNvbmZpZzogdW5kZWZpbmVkIHwgQWdDaGFydExlZ2VuZExpc3RlbmVycyB8IEFnU2VyaWVzTGlzdGVuZXJzPGFueT4gfCBBZ0Jhc2VDaGFydExpc3RlbmVyczxhbnk+XG4gICAgICAgICkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gbGlzdGVuZXJDb25maWcgPz8gKHt9IGFzIGFueSk7XG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhjb25maWcpLmZvckVhY2goKFtsaXN0ZW5lck5hbWUsIGxpc3RlbmVyXSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciAmJiB0eXBlb2YgbGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnW2xpc3RlbmVyTmFtZV0gPSAoLi4uYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJ1bkluc2lkZUFuZ3VsYXIoKCkgPT4gbGlzdGVuZXIoLi4uYXJncykpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHBhdGNoTGlzdGVuZXJzKHByb3BzT3B0aW9ucz8ubGVnZW5kPy5saXN0ZW5lcnMpO1xuICAgICAgICBwYXRjaExpc3RlbmVycyhwcm9wc09wdGlvbnM/Lmxpc3RlbmVycyk7XG4gICAgICAgIHByb3BzT3B0aW9ucy5zZXJpZXM/LmZvckVhY2goKHNlcmllczogYW55KSA9PiB7XG4gICAgICAgICAgICBwYXRjaExpc3RlbmVycyhzZXJpZXMubGlzdGVuZXJzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHByb3BzT3B0aW9ucy5jb250YWluZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9wc09wdGlvbnM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyAuLi5wcm9wc09wdGlvbnMsIGNvbnRhaW5lcjogdGhpcy5fbmF0aXZlRWxlbWVudCB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgcnVuT3V0c2lkZUFuZ3VsYXI8VD4oY2FsbGJhY2s6ICgpID0+IFQpOiBUIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmdab25lID8gdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoY2FsbGJhY2spIDogY2FsbGJhY2soKTtcbiAgICB9XG4gICAgcHJpdmF0ZSBydW5JbnNpZGVBbmd1bGFyPFQ+KGNhbGxiYWNrOiAoKSA9PiBUKTogVCB7XG4gICAgICAgIHJldHVybiB0aGlzLm5nWm9uZSA/IHRoaXMubmdab25lLnJ1bihjYWxsYmFjaykgOiBjYWxsYmFjaygpO1xuICAgIH1cbn1cbiJdfQ==