import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { WorkspaceApp } from './WorkspaceApp';
import './procurement.css';

// Sunburst and Map series are enterprise features.
ModuleRegistry.registerModules([AllEnterpriseModule]);

export default function Procurement() {
    return <WorkspaceApp />;
}
