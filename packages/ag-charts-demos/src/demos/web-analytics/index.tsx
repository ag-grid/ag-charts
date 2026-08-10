import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { WebAnalyticsApp } from './WebAnalyticsApp';
import './web-analytics.css';

// Funnel, Sankey and Map series are enterprise features.
ModuleRegistry.registerModules([AllEnterpriseModule]);

export default function WebAnalytics() {
    return <WebAnalyticsApp />;
}
