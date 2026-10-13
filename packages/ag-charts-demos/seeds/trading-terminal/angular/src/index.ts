import { Component } from '@angular/core';

import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { TradingTerminalApp } from './trading-terminal-app';

// Candlestick/OHLC series, crosshairs, chart sync, zoom and the navigator are
// all enterprise features, so register the enterprise bundle for this demo.
ModuleRegistry.registerModules([AllEnterpriseModule]);

// trading-terminal.css is loaded as a global stylesheet through angular.json `styles`, the Angular
// equivalent of the React demo's `import './trading-terminal.css'`.

/** The demo's root: bootstrapped onto the `<main data-demo-id="trading-terminal">` wrapper main.ts creates. */
@Component({
    selector: 'main[data-demo-id]',
    imports: [TradingTerminalApp],
    template: '<div finTradingTerminalApp></div>',
})
export class TradingTerminalDemo {}
