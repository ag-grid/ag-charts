import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { AgCharts as AgChartsAPI } from 'ag-charts-community';
import { AgChartsBase } from './ag-charts-base';
import * as i0 from "@angular/core";
// noinspection AngularIncorrectTemplateDefinition
export class AgFinancialCharts extends AgChartsBase {
    ngZone;
    options = {};
    onChartReady = new EventEmitter();
    constructor(elementDef, ngZone) {
        super();
        this.ngZone = ngZone;
        this._nativeElement = elementDef.nativeElement;
    }
    createChart(options) {
        return AgChartsAPI.createFinancialChart(options);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWctZmluYW5jaWFsLWNoYXJ0cy5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9hZy1jaGFydHMtYW5ndWxhci9zcmMvbGliL2FnLWZpbmFuY2lhbC1jaGFydHMuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQWMsWUFBWSxFQUFFLEtBQUssRUFBVSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFOUcsT0FBTyxFQUFtQixRQUFRLElBQUksV0FBVyxFQUEyQixNQUFNLHFCQUFxQixDQUFDO0FBRXhHLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQzs7QUFFaEQsa0RBQWtEO0FBT2xELE1BQU0sT0FBTyxpQkFBa0IsU0FBUSxZQUFxQztJQVMxRDtJQVBQLE9BQU8sR0FBNEIsRUFBRSxDQUFDO0lBR3RDLFlBQVksR0FBa0MsSUFBSSxZQUFZLEVBQUUsQ0FBQztJQUV4RSxZQUNJLFVBQXNCLEVBQ1osTUFBYztRQUV4QixLQUFLLEVBQUUsQ0FBQztRQUZFLFdBQU0sR0FBTixNQUFNLENBQVE7UUFHeEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDO0lBQ25ELENBQUM7SUFFUyxXQUFXLENBQUMsT0FBZ0M7UUFDbEQsT0FBTyxXQUFXLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckQsQ0FBQzt3R0FqQlEsaUJBQWlCOzRGQUFqQixpQkFBaUIsaUxBSGhCLEVBQUU7OzRGQUdILGlCQUFpQjtrQkFON0IsU0FBUzttQkFBQztvQkFDUCxRQUFRLEVBQUUscUJBQXFCO29CQUMvQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsUUFBUSxFQUFFLEVBQUU7b0JBQ1osYUFBYSxFQUFFLGlCQUFpQixDQUFDLElBQUk7aUJBQ3hDO3NIQUdVLE9BQU87c0JBRGIsS0FBSztnQkFJQyxZQUFZO3NCQURsQixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIElucHV0LCBOZ1pvbmUsIE91dHB1dCwgVmlld0VuY2Fwc3VsYXRpb24gfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHsgQWdDaGFydEluc3RhbmNlLCBBZ0NoYXJ0cyBhcyBBZ0NoYXJ0c0FQSSwgQWdGaW5hbmNpYWxDaGFydE9wdGlvbnMgfSBmcm9tICdhZy1jaGFydHMtY29tbXVuaXR5JztcblxuaW1wb3J0IHsgQWdDaGFydHNCYXNlIH0gZnJvbSAnLi9hZy1jaGFydHMtYmFzZSc7XG5cbi8vIG5vaW5zcGVjdGlvbiBBbmd1bGFySW5jb3JyZWN0VGVtcGxhdGVEZWZpbml0aW9uXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2FnLWZpbmFuY2lhbC1jaGFydHMnLFxuICAgIHN0YW5kYWxvbmU6IHRydWUsXG4gICAgdGVtcGxhdGU6ICcnLFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG59KVxuZXhwb3J0IGNsYXNzIEFnRmluYW5jaWFsQ2hhcnRzIGV4dGVuZHMgQWdDaGFydHNCYXNlPEFnRmluYW5jaWFsQ2hhcnRPcHRpb25zPiB7XG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgb3B0aW9uczogQWdGaW5hbmNpYWxDaGFydE9wdGlvbnMgPSB7fTtcblxuICAgIEBPdXRwdXQoKVxuICAgIHB1YmxpYyBvbkNoYXJ0UmVhZHk6IEV2ZW50RW1pdHRlcjxBZ0NoYXJ0SW5zdGFuY2U+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGVsZW1lbnREZWY6IEVsZW1lbnRSZWYsXG4gICAgICAgIHByb3RlY3RlZCBuZ1pvbmU6IE5nWm9uZVxuICAgICkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9uYXRpdmVFbGVtZW50ID0gZWxlbWVudERlZi5uYXRpdmVFbGVtZW50O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjcmVhdGVDaGFydChvcHRpb25zOiBBZ0ZpbmFuY2lhbENoYXJ0T3B0aW9ucykge1xuICAgICAgICByZXR1cm4gQWdDaGFydHNBUEkuY3JlYXRlRmluYW5jaWFsQ2hhcnQob3B0aW9ucyk7XG4gICAgfVxufVxuIl19