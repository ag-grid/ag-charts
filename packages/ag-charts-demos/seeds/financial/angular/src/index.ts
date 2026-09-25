import { Component } from '@angular/core';

import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { FinancialApp } from './financial-app';

// Candlestick/OHLC series, crosshairs, chart sync, zoom and the navigator are
// all enterprise features, so register the enterprise bundle for this demo.
ModuleRegistry.registerModules([AllEnterpriseModule]);

// financial.css is loaded as a global stylesheet through angular.json `styles`, the Angular
// equivalent of the React demo's `import './financial.css'`.

/** The demo's root: bootstrapped onto the `<main data-demo-id="financial">` wrapper main.ts creates. */
@Component({
    selector: 'main[data-demo-id]',
    imports: [FinancialApp],
    template: '<div finFinancialApp></div>',
})
export class FinancialDemo {}
