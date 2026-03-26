import type { IRowNode } from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';
import { type RefObject, useCallback, useMemo, useState } from 'react';

import { ALL_COMMUNITY_MODULE, ALL_ENTERPRISE_MODULE, type BundleOptionValue } from './constants';
import { type SelectedModules, getModuleMappingsSnippet } from './getModuleMappingsSnippet';

export type ModuleConfig = ReturnType<typeof useModuleConfig>;

export function useModuleConfig(gridRef: RefObject<AgGridReact>) {
    const [bundleOption, setBundleOption] = useState<BundleOptionValue>('');
    const [selectedModules, setSelectedModules] = useState<SelectedModules>({
        community: [],
        enterprise: [],
    });

    const selectedDependenciesSnippet = useMemo(() => getModuleMappingsSnippet({ selectedModules }), [selectedModules]);

    const updateBundleOption = useCallback(
        (moduleName: BundleOptionValue) => {
            const api = gridRef?.current?.api;
            if (!api) return;

            if (moduleName === ALL_ENTERPRISE_MODULE) {
                api.selectAll('all');
                setSelectedModules({
                    community: [],
                    enterprise: [ALL_ENTERPRISE_MODULE],
                });
            } else if (moduleName === ALL_COMMUNITY_MODULE) {
                const nodesToToggle: IRowNode[] = [];

                api.deselectAll('all');
                api.forEachLeafNode((child) => {
                    if (!child.data.isEnterprise && child.data.moduleName) {
                        nodesToToggle.push(child);
                    }
                });
                api.setNodesSelected({
                    nodes: nodesToToggle,
                    newValue: true,
                });

                setSelectedModules({
                    community: [ALL_COMMUNITY_MODULE],
                    enterprise: [],
                });
            } else {
                api.deselectAll('all');

                setSelectedModules({
                    community: [],
                    enterprise: [],
                });
            }

            setBundleOption(moduleName);
        },
        [gridRef]
    );

    return {
        bundleOption,
        updateBundleOption,
        setSelectedModules,
        selectedDependenciesSnippet,
    };
}
