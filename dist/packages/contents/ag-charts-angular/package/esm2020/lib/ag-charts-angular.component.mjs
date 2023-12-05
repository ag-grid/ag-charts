import { Component, EventEmitter, Input, Output, ViewEncapsulation, } from '@angular/core';
import { AgCharts } from 'ag-charts-community';
import * as i0 from "@angular/core";
// noinspection AngularIncorrectTemplateDefinition
export class AgChartsAngular {
    constructor(elementDef) {
        this._initialised = false;
        this.options = {};
        this.onChartReady = new EventEmitter();
        this._nativeElement = elementDef.nativeElement;
    }
    ngAfterViewInit() {
        const options = this.applyContainerIfNotSet(this.options);
        this.chart = AgCharts.create(options);
        this._initialised = true;
        this.chart.chart.waitForUpdate().then(() => {
            this.onChartReady.emit(this.chart);
        });
    }
    // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    ngOnChanges(changes) {
        if (!this._initialised || !this.chart) {
            return;
        }
        AgCharts.update(this.chart, this.applyContainerIfNotSet(this.options));
    }
    ngOnDestroy() {
        if (this._initialised && this.chart) {
            this.chart.destroy();
            this.chart = undefined;
            this._initialised = false;
        }
    }
    applyContainerIfNotSet(propsOptions) {
        if (propsOptions.container) {
            return propsOptions;
        }
        return { ...propsOptions, container: this._nativeElement };
    }
}
AgChartsAngular.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: AgChartsAngular, deps: [{ token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Component });
AgChartsAngular.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.3.0", type: AgChartsAngular, selector: "ag-charts-angular", inputs: { options: "options" }, outputs: { onChartReady: "onChartReady" }, usesOnChanges: true, ngImport: i0, template: '', isInline: true, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: AgChartsAngular, decorators: [{
            type: Component,
            args: [{
                    selector: 'ag-charts-angular',
                    template: '',
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }]; }, propDecorators: { options: [{
                type: Input
            }], onChartReady: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWctY2hhcnRzLWFuZ3VsYXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYWctY2hhcnRzLWFuZ3VsYXIvc3JjL2xpYi9hZy1jaGFydHMtYW5ndWxhci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVILFNBQVMsRUFFVCxZQUFZLEVBQ1osS0FBSyxFQUdMLE1BQU0sRUFDTixpQkFBaUIsR0FDcEIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFtQyxRQUFRLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQzs7QUFFaEYsa0RBQWtEO0FBTWxELE1BQU0sT0FBTyxlQUFlO0lBWXhCLFlBQVksVUFBc0I7UUFWMUIsaUJBQVksR0FBRyxLQUFLLENBQUM7UUFLdEIsWUFBTyxHQUFtQixFQUFFLENBQUM7UUFHN0IsaUJBQVksR0FBa0MsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUdwRSxJQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUM7SUFDbkQsQ0FBQztJQUVELGVBQWU7UUFDWCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTFELElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUV4QixJQUFJLENBQUMsS0FBYSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCwwREFBMEQ7SUFDMUQsV0FBVyxDQUFDLE9BQVk7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ25DLE9BQU87U0FDVjtRQUVELFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVNLFdBQVc7UUFDZCxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNqQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1NBQzdCO0lBQ0wsQ0FBQztJQUVPLHNCQUFzQixDQUFDLFlBQTRCO1FBQ3ZELElBQUksWUFBWSxDQUFDLFNBQVMsRUFBRTtZQUN4QixPQUFPLFlBQVksQ0FBQztTQUN2QjtRQUVELE9BQU8sRUFBRSxHQUFHLFlBQVksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQy9ELENBQUM7OzRHQWxEUSxlQUFlO2dHQUFmLGVBQWUseUpBSGQsRUFBRTsyRkFHSCxlQUFlO2tCQUwzQixTQUFTO21CQUFDO29CQUNQLFFBQVEsRUFBRSxtQkFBbUI7b0JBQzdCLFFBQVEsRUFBRSxFQUFFO29CQUNaLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2lCQUN4QztpR0FRVSxPQUFPO3NCQURiLEtBQUs7Z0JBSUMsWUFBWTtzQkFEbEIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgQWZ0ZXJWaWV3SW5pdCxcbiAgICBDb21wb25lbnQsXG4gICAgRWxlbWVudFJlZixcbiAgICBFdmVudEVtaXR0ZXIsXG4gICAgSW5wdXQsXG4gICAgT25DaGFuZ2VzLFxuICAgIE9uRGVzdHJveSxcbiAgICBPdXRwdXQsXG4gICAgVmlld0VuY2Fwc3VsYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQgeyBBZ0NoYXJ0SW5zdGFuY2UsIEFnQ2hhcnRPcHRpb25zLCBBZ0NoYXJ0cyB9IGZyb20gJ2FnLWNoYXJ0cy1jb21tdW5pdHknO1xuXG4vLyBub2luc3BlY3Rpb24gQW5ndWxhckluY29ycmVjdFRlbXBsYXRlRGVmaW5pdGlvblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdhZy1jaGFydHMtYW5ndWxhcicsXG4gICAgdGVtcGxhdGU6ICcnLFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG59KVxuZXhwb3J0IGNsYXNzIEFnQ2hhcnRzQW5ndWxhciBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95IHtcbiAgICBwcml2YXRlIF9uYXRpdmVFbGVtZW50OiBhbnk7XG4gICAgcHJpdmF0ZSBfaW5pdGlhbGlzZWQgPSBmYWxzZTtcblxuICAgIHB1YmxpYyBjaGFydD86IEFnQ2hhcnRJbnN0YW5jZTtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIG9wdGlvbnM6IEFnQ2hhcnRPcHRpb25zID0ge307XG5cbiAgICBAT3V0cHV0KClcbiAgICBwdWJsaWMgb25DaGFydFJlYWR5OiBFdmVudEVtaXR0ZXI8QWdDaGFydEluc3RhbmNlPiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnREZWY6IEVsZW1lbnRSZWYpIHtcbiAgICAgICAgdGhpcy5fbmF0aXZlRWxlbWVudCA9IGVsZW1lbnREZWYubmF0aXZlRWxlbWVudDtcbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLmFwcGx5Q29udGFpbmVySWZOb3RTZXQodGhpcy5vcHRpb25zKTtcblxuICAgICAgICB0aGlzLmNoYXJ0ID0gQWdDaGFydHMuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9pbml0aWFsaXNlZCA9IHRydWU7XG5cbiAgICAgICAgKHRoaXMuY2hhcnQgYXMgYW55KS5jaGFydC53YWl0Rm9yVXBkYXRlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uQ2hhcnRSZWFkeS5lbWl0KHRoaXMuY2hhcnQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBub2luc3BlY3Rpb24gSlNVbnVzZWRHbG9iYWxTeW1ib2xzLEpTVW51c2VkTG9jYWxTeW1ib2xzXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogYW55KTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5faW5pdGlhbGlzZWQgfHwgIXRoaXMuY2hhcnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIEFnQ2hhcnRzLnVwZGF0ZSh0aGlzLmNoYXJ0LCB0aGlzLmFwcGx5Q29udGFpbmVySWZOb3RTZXQodGhpcy5vcHRpb25zKSk7XG4gICAgfVxuXG4gICAgcHVibGljIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGlzZWQgJiYgdGhpcy5jaGFydCkge1xuICAgICAgICAgICAgdGhpcy5jaGFydC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmNoYXJ0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5faW5pdGlhbGlzZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXBwbHlDb250YWluZXJJZk5vdFNldChwcm9wc09wdGlvbnM6IEFnQ2hhcnRPcHRpb25zKSB7XG4gICAgICAgIGlmIChwcm9wc09wdGlvbnMuY29udGFpbmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvcHNPcHRpb25zO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgLi4ucHJvcHNPcHRpb25zLCBjb250YWluZXI6IHRoaXMuX25hdGl2ZUVsZW1lbnQgfTtcbiAgICB9XG59XG4iXX0=