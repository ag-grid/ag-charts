import { registerInbuiltModules } from './chart/factory/registerInbuiltModules';

export function setupCommunityModules() {
    registerInbuiltModules();
}

export { AgCharts } from './api/agCharts';
