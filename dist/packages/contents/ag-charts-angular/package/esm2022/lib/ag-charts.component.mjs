import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { AgCharts as AgChartsAPI } from 'ag-charts-community';
import { AgChartsBase } from './ag-charts-base';
import * as i0 from "@angular/core";
// noinspection AngularIncorrectTemplateDefinition
export class AgCharts extends AgChartsBase {
    ngZone;
    options = {};
    onChartReady = new EventEmitter();
    constructor(elementDef, ngZone) {
        super();
        this.ngZone = ngZone;
        this._nativeElement = elementDef.nativeElement;
    }
    createChart(options) {
        return AgChartsAPI.create(options);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWctY2hhcnRzLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FnLWNoYXJ0cy1hbmd1bGFyL3NyYy9saWIvYWctY2hhcnRzLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFjLFlBQVksRUFBRSxLQUFLLEVBQVUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTlHLE9BQU8sRUFBbUMsUUFBUSxJQUFJLFdBQVcsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBRS9GLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQzs7QUFFaEQsa0RBQWtEO0FBT2xELE1BQU0sT0FBTyxRQUFTLFNBQVEsWUFBNEI7SUFTeEM7SUFQUCxPQUFPLEdBQW1CLEVBQUUsQ0FBQztJQUc3QixZQUFZLEdBQWtDLElBQUksWUFBWSxFQUFFLENBQUM7SUFFeEUsWUFDSSxVQUFzQixFQUNaLE1BQWM7UUFFeEIsS0FBSyxFQUFFLENBQUM7UUFGRSxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBR3hCLElBQUksQ0FBQyxjQUFjLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQztJQUNuRCxDQUFDO0lBRVMsV0FBVyxDQUFDLE9BQXVCO1FBQ3pDLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2QyxDQUFDO3dHQWpCUSxRQUFROzRGQUFSLFFBQVEsdUtBSFAsRUFBRTs7NEZBR0gsUUFBUTtrQkFOcEIsU0FBUzttQkFBQztvQkFDUCxRQUFRLEVBQUUsV0FBVztvQkFDckIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFFBQVEsRUFBRSxFQUFFO29CQUNaLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2lCQUN4QztzSEFHVSxPQUFPO3NCQURiLEtBQUs7Z0JBSUMsWUFBWTtzQkFEbEIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgRWxlbWVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbnB1dCwgTmdab25lLCBPdXRwdXQsIFZpZXdFbmNhcHN1bGF0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7IEFnQ2hhcnRJbnN0YW5jZSwgQWdDaGFydE9wdGlvbnMsIEFnQ2hhcnRzIGFzIEFnQ2hhcnRzQVBJIH0gZnJvbSAnYWctY2hhcnRzLWNvbW11bml0eSc7XG5cbmltcG9ydCB7IEFnQ2hhcnRzQmFzZSB9IGZyb20gJy4vYWctY2hhcnRzLWJhc2UnO1xuXG4vLyBub2luc3BlY3Rpb24gQW5ndWxhckluY29ycmVjdFRlbXBsYXRlRGVmaW5pdGlvblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdhZy1jaGFydHMnLFxuICAgIHN0YW5kYWxvbmU6IHRydWUsXG4gICAgdGVtcGxhdGU6ICcnLFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG59KVxuZXhwb3J0IGNsYXNzIEFnQ2hhcnRzIGV4dGVuZHMgQWdDaGFydHNCYXNlPEFnQ2hhcnRPcHRpb25zPiB7XG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgb3B0aW9uczogQWdDaGFydE9wdGlvbnMgPSB7fTtcblxuICAgIEBPdXRwdXQoKVxuICAgIHB1YmxpYyBvbkNoYXJ0UmVhZHk6IEV2ZW50RW1pdHRlcjxBZ0NoYXJ0SW5zdGFuY2U+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGVsZW1lbnREZWY6IEVsZW1lbnRSZWYsXG4gICAgICAgIHByb3RlY3RlZCBuZ1pvbmU6IE5nWm9uZVxuICAgICkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9uYXRpdmVFbGVtZW50ID0gZWxlbWVudERlZi5uYXRpdmVFbGVtZW50O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjcmVhdGVDaGFydChvcHRpb25zOiBBZ0NoYXJ0T3B0aW9ucykge1xuICAgICAgICByZXR1cm4gQWdDaGFydHNBUEkuY3JlYXRlKG9wdGlvbnMpO1xuICAgIH1cbn1cbiJdfQ==