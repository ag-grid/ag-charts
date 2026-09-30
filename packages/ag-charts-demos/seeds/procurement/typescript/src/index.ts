import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { createWorkspaceApp } from './WorkspaceApp';
import type { View } from './dom';
import './procurement.css';

// Sunburst and Map series are enterprise features.
ModuleRegistry.registerModules([AllEnterpriseModule]);

export default function createProcurement(): View {
    return createWorkspaceApp();
}
