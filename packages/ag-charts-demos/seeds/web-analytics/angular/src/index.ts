import { Component } from '@angular/core';

import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { WebAnalyticsApp } from './web-analytics-app';

// Funnel, Sankey and Map series are enterprise features.
ModuleRegistry.registerModules([AllEnterpriseModule]);

// web-analytics.css is loaded as a global stylesheet through angular.json `styles`, the Angular
// equivalent of the React demo's `import './web-analytics.css'`.

/** The demo's root: bootstrapped onto the `<main data-demo-id="web-analytics">` wrapper main.ts creates. */
@Component({
    selector: 'main[data-demo-id]',
    imports: [WebAnalyticsApp],
    template: '<div waWebAnalyticsApp></div>',
})
export class WebAnalyticsDemo {}
