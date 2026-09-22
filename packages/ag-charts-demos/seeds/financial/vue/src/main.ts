import { createApp, h } from 'vue';

import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import Financial from './Financial.vue';

// The demo registers the modules it needs in ./Financial.vue; the community bundle is
// registered here as well so every demo starts from the same baseline.
ModuleRegistry.registerModules([AllCommunityModule]);

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

createApp({
    render: () => h('main', { 'data-demo-id': 'financial' }, h(Financial)),
}).mount(container);
