import { bootstrapApplication } from '@angular/platform-browser';

import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { ProcurementDemo } from './index';

ModuleRegistry.registerModules([AllCommunityModule]);

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

// The demo fills the viewport from a fixed-position container of its own, which would leave
// this wrapper with no box; sizing it to the viewport keeps it visible to tooling. In the demos
// app the loading fallback does that while the demo's chunk loads.
const wrapper = document.createElement('main');
wrapper.setAttribute('data-demo-id', 'procurement');
wrapper.setAttribute('style', 'position: fixed; inset: 0;');
container.append(wrapper);

// Angular bootstraps onto the element matching ProcurementDemo's selector: the wrapper above.
// eslint-disable-next-line no-console
bootstrapApplication(ProcurementDemo).catch((error) => console.error(error));
