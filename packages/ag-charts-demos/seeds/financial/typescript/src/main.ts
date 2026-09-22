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
// The demo pins itself to the viewport (`.fin-container` is `position: fixed`), which would leave
// this landmark with no box of its own. Sizing it to the viewport too keeps it visible to
// assistive tech and to the functional specs without moving anything on screen.
container.append(h('main', { 'data-demo-id': 'financial', style: 'position: fixed; inset: 0;' }, demo.el));
// Charts and grids are created once their elements are in the document, as the React layout
// effects do.
demo.mount();
