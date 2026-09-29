import { Component } from '@angular/core';

import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { WorkspaceApp } from './workspace-app';

// Sunburst and Map series are enterprise features.
ModuleRegistry.registerModules([AllEnterpriseModule]);

// procurement.css is loaded as a global stylesheet through angular.json `styles`, the Angular
// equivalent of the React demo's `import './procurement.css'`.

/** The demo's root: bootstrapped onto the `<main data-demo-id="procurement">` wrapper main.ts creates. */
@Component({
    selector: 'main[data-demo-id]',
    imports: [WorkspaceApp],
    template: '<div pcWorkspaceApp></div>',
})
export class ProcurementDemo {}
