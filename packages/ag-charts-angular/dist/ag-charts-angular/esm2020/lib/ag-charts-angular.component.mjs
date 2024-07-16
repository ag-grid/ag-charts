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
            for (const [listenerName, listener] of Object.entries(config)) {
                if (!listener || typeof listener !== 'function')
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWctY2hhcnRzLWFuZ3VsYXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYWctY2hhcnRzLWFuZ3VsYXIvc3JjL2xpYi9hZy1jaGFydHMtYW5ndWxhci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVILFNBQVMsRUFFVCxZQUFZLEVBQ1osS0FBSyxFQUlMLE1BQU0sRUFDTixpQkFBaUIsR0FDcEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUtILFFBQVEsR0FFWCxNQUFNLHFCQUFxQixDQUFDOztBQUU3QixrREFBa0Q7QUFPbEQsTUFBTSxPQUFPLGVBQWU7SUFZeEIsWUFDSSxVQUFzQixFQUNkLE1BQWM7UUFBZCxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBWmxCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBS3RCLFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBRzdCLGlCQUFZLEdBQWtDLElBQUksWUFBWSxFQUFFLENBQUM7UUFNcEUsSUFBSSxDQUFDLGNBQWMsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDO0lBQ25ELENBQUM7SUFFRCxlQUFlO1FBQ1gsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFFeEIsSUFBSSxDQUFDLEtBQWEsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNoRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsMERBQTBEO0lBQzFELFdBQVcsQ0FBQyxPQUFZO1FBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNuQyxPQUFPO2FBQ1Y7WUFDRCxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLFdBQVc7UUFDZCxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNqQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1NBQzdCO0lBQ0wsQ0FBQztJQUVPLGlCQUFpQixDQUFDLFlBQTRCO1FBQ2xELE1BQU0sY0FBYyxHQUFHLENBQ25CLGNBQXVHLEVBQ3pHLEVBQUU7WUFDQSxNQUFNLE1BQU0sR0FBRyxjQUFjLElBQUssRUFBVSxDQUFDO1lBQzdDLEtBQUssTUFBTSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMzRCxJQUFJLENBQUMsUUFBUSxJQUFJLE9BQU8sUUFBUSxLQUFLLFVBQVU7b0JBQUUsU0FBUztnQkFFMUQsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFTLEVBQUUsRUFBRTtvQkFDcEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELENBQUMsQ0FBQzthQUNMO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsY0FBYyxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDaEQsY0FBYyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4QyxZQUFZLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLE1BQVcsRUFBRSxFQUFFO1lBQ3pDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUU7WUFDeEIsT0FBTyxZQUFZLENBQUM7U0FDdkI7UUFFRCxPQUFPLEVBQUUsR0FBRyxZQUFZLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUMvRCxDQUFDO0lBRU8saUJBQWlCLENBQUksUUFBaUI7UUFDMUMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM5RSxDQUFDO0lBQ08sZ0JBQWdCLENBQUksUUFBaUI7UUFDekMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDaEUsQ0FBQzs7NEdBaEZRLGVBQWU7Z0dBQWYsZUFBZSw2S0FIZCxFQUFFOzJGQUdILGVBQWU7a0JBTjNCLFNBQVM7bUJBQUM7b0JBQ1AsUUFBUSxFQUFFLG1CQUFtQjtvQkFDN0IsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFFBQVEsRUFBRSxFQUFFO29CQUNaLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2lCQUN4QztzSEFRVSxPQUFPO3NCQURiLEtBQUs7Z0JBSUMsWUFBWTtzQkFEbEIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgQWZ0ZXJWaWV3SW5pdCxcbiAgICBDb21wb25lbnQsXG4gICAgRWxlbWVudFJlZixcbiAgICBFdmVudEVtaXR0ZXIsXG4gICAgSW5wdXQsXG4gICAgTmdab25lLFxuICAgIE9uQ2hhbmdlcyxcbiAgICBPbkRlc3Ryb3ksXG4gICAgT3V0cHV0LFxuICAgIFZpZXdFbmNhcHN1bGF0aW9uLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtcbiAgICBBZ0Jhc2VDaGFydExpc3RlbmVycyxcbiAgICBBZ0NoYXJ0SW5zdGFuY2UsXG4gICAgQWdDaGFydExlZ2VuZExpc3RlbmVycyxcbiAgICBBZ0NoYXJ0T3B0aW9ucyxcbiAgICBBZ0NoYXJ0cyxcbiAgICBBZ1Nlcmllc0xpc3RlbmVycyxcbn0gZnJvbSAnYWctY2hhcnRzLWNvbW11bml0eSc7XG5cbi8vIG5vaW5zcGVjdGlvbiBBbmd1bGFySW5jb3JyZWN0VGVtcGxhdGVEZWZpbml0aW9uXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2FnLWNoYXJ0cy1hbmd1bGFyJyxcbiAgICBzdGFuZGFsb25lOiB0cnVlLFxuICAgIHRlbXBsYXRlOiAnJyxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxufSlcbmV4cG9ydCBjbGFzcyBBZ0NoYXJ0c0FuZ3VsYXIgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkNoYW5nZXMsIE9uRGVzdHJveSB7XG4gICAgcHJpdmF0ZSBfbmF0aXZlRWxlbWVudDogYW55O1xuICAgIHByaXZhdGUgX2luaXRpYWxpc2VkID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgY2hhcnQ/OiBBZ0NoYXJ0SW5zdGFuY2U7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBvcHRpb25zOiBBZ0NoYXJ0T3B0aW9ucyA9IHt9O1xuXG4gICAgQE91dHB1dCgpXG4gICAgcHVibGljIG9uQ2hhcnRSZWFkeTogRXZlbnRFbWl0dGVyPEFnQ2hhcnRJbnN0YW5jZT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgZWxlbWVudERlZjogRWxlbWVudFJlZixcbiAgICAgICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZVxuICAgICkge1xuICAgICAgICB0aGlzLl9uYXRpdmVFbGVtZW50ID0gZWxlbWVudERlZi5uYXRpdmVFbGVtZW50O1xuICAgIH1cblxuICAgIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMucGF0Y2hDaGFydE9wdGlvbnModGhpcy5vcHRpb25zKTtcblxuICAgICAgICB0aGlzLmNoYXJ0ID0gdGhpcy5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBBZ0NoYXJ0cy5jcmVhdGUob3B0aW9ucykpO1xuICAgICAgICB0aGlzLl9pbml0aWFsaXNlZCA9IHRydWU7XG5cbiAgICAgICAgKHRoaXMuY2hhcnQgYXMgYW55KS5jaGFydC53YWl0Rm9yVXBkYXRlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uQ2hhcnRSZWFkeS5lbWl0KHRoaXMuY2hhcnQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBub2luc3BlY3Rpb24gSlNVbnVzZWRHbG9iYWxTeW1ib2xzLEpTVW51c2VkTG9jYWxTeW1ib2xzXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbml0aWFsaXNlZCB8fCAhdGhpcy5jaGFydCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFnQ2hhcnRzLnVwZGF0ZSh0aGlzLmNoYXJ0LCB0aGlzLnBhdGNoQ2hhcnRPcHRpb25zKHRoaXMub3B0aW9ucykpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXNlZCAmJiB0aGlzLmNoYXJ0KSB7XG4gICAgICAgICAgICB0aGlzLmNoYXJ0LmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuY2hhcnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLl9pbml0aWFsaXNlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwYXRjaENoYXJ0T3B0aW9ucyhwcm9wc09wdGlvbnM6IEFnQ2hhcnRPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IHBhdGNoTGlzdGVuZXJzID0gKFxuICAgICAgICAgICAgbGlzdGVuZXJDb25maWc6IHVuZGVmaW5lZCB8IEFnQ2hhcnRMZWdlbmRMaXN0ZW5lcnMgfCBBZ1Nlcmllc0xpc3RlbmVyczxhbnk+IHwgQWdCYXNlQ2hhcnRMaXN0ZW5lcnM8YW55PlxuICAgICAgICApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IGxpc3RlbmVyQ29uZmlnID8/ICh7fSBhcyBhbnkpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBbbGlzdGVuZXJOYW1lLCBsaXN0ZW5lcl0gb2YgT2JqZWN0LmVudHJpZXMoY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGlmICghbGlzdGVuZXIgfHwgdHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIGNvbmZpZ1tsaXN0ZW5lck5hbWVdID0gKC4uLmFyZ3M6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJ1bkluc2lkZUFuZ3VsYXIoKCkgPT4gbGlzdGVuZXIoLi4uYXJncykpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcGF0Y2hMaXN0ZW5lcnMocHJvcHNPcHRpb25zPy5sZWdlbmQ/Lmxpc3RlbmVycyk7XG4gICAgICAgIHBhdGNoTGlzdGVuZXJzKHByb3BzT3B0aW9ucz8ubGlzdGVuZXJzKTtcbiAgICAgICAgcHJvcHNPcHRpb25zLnNlcmllcz8uZm9yRWFjaCgoc2VyaWVzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHBhdGNoTGlzdGVuZXJzKHNlcmllcy5saXN0ZW5lcnMpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocHJvcHNPcHRpb25zLmNvbnRhaW5lcikge1xuICAgICAgICAgICAgcmV0dXJuIHByb3BzT3B0aW9ucztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IC4uLnByb3BzT3B0aW9ucywgY29udGFpbmVyOiB0aGlzLl9uYXRpdmVFbGVtZW50IH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBydW5PdXRzaWRlQW5ndWxhcjxUPihjYWxsYmFjazogKCkgPT4gVCk6IFQge1xuICAgICAgICByZXR1cm4gdGhpcy5uZ1pvbmUgPyB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcihjYWxsYmFjaykgOiBjYWxsYmFjaygpO1xuICAgIH1cbiAgICBwcml2YXRlIHJ1bkluc2lkZUFuZ3VsYXI8VD4oY2FsbGJhY2s6ICgpID0+IFQpOiBUIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmdab25lID8gdGhpcy5uZ1pvbmUucnVuKGNhbGxiYWNrKSA6IGNhbGxiYWNrKCk7XG4gICAgfVxufVxuIl19