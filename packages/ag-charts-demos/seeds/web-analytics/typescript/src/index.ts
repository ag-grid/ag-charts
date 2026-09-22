import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { createWebAnalyticsApp } from './WebAnalyticsApp';
import { type View } from './dom';
import './web-analytics.css';

// Funnel, Sankey and Map series are enterprise features.
ModuleRegistry.registerModules([AllEnterpriseModule]);

export default function createWebAnalytics(): View {
    return createWebAnalyticsApp();
}
