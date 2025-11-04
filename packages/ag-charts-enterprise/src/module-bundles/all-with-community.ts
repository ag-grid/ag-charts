import { AllCommunityModules } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { AllEnterpriseModules } from './all';

export const AllCommunityAndEnterpriseModules: ModuleDefinition[] = [...AllCommunityModules, ...AllEnterpriseModules];
