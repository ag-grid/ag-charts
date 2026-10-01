import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { h } from './dom';
import createDemo from './index';

// The demo registers the modules it needs in ./index.ts; the community bundle is
// registered here as well so every demo starts from the same baseline.
ModuleRegistry.registerModules([AllCommunityModule]);

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

const demo = createDemo();
// The demo fills the viewport from a fixed-position container of its own, which would leave
// this wrapper with no box; sizing it to the viewport keeps it visible to tooling. In the demos
// app the loading fallback does that while the demo's chunk loads.
container.append(h('main', { 'data-demo-id': 'procurement', style: 'position: fixed; inset: 0;' }, demo.el));
// Charts and grids are created once their elements are in the document, as the React layout
// effects do.
demo.mount();
