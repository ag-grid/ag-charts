import { bootstrapApplication } from '@angular/platform-browser';

import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { FinancialDemo } from './index';

// The demo registers the modules it needs in ./index.ts; the community bundle is
// registered here as well so every demo starts from the same baseline.
ModuleRegistry.registerModules([AllCommunityModule]);

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

// The demo fills the viewport from a fixed-position container of its own, which would leave
// this wrapper with no box; sizing it to the viewport keeps it visible to tooling. In the demos
// app the loading fallback does that while the demo's chunk loads.
const wrapper = document.createElement('main');
wrapper.setAttribute('data-demo-id', 'financial');
wrapper.setAttribute('style', 'position: fixed; inset: 0;');
container.append(wrapper);

// Angular bootstraps onto the element matching FinancialDemo's selector: the wrapper above.
// eslint-disable-next-line no-console
bootstrapApplication(FinancialDemo).catch((error) => console.error(error));
