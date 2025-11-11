import type { IRowNode } from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';
import { type RefObject, useCallback, useMemo, useState } from 'react';

import {
    ALL_COMMUNITY_AND_ENTERPRISE_MODULE,
    ALL_COMMUNITY_MODULE,
    ALL_ENTERPRISE_MODULE,
    type BundleOptionValue,
    CHART_OPTIONS,
    type ChartModuleName,
    type ChartOptions,
    DEFAULT_CHART_OPTIONS,
} from './constants';
import { type SelectedModules, getModuleMappingsSnippet } from './getModuleMappingsSnippet';

export type ModuleConfig = ReturnType<typeof useModuleConfig>;

export function useModuleConfig(gridRef: RefObject<AgGridReact>) {
    const [bundleOption, setBundleOption] = useState<BundleOptionValue>('');
    const [chartOptions, setChartOptions] = useState<ChartOptions>(DEFAULT_CHART_OPTIONS);
    const [selectedModules, setSelectedModules] = useState<SelectedModules>({
        community: [],
        enterprise: [],
    });

    const allImportModules = useMemo(() => {
        const community = [...selectedModules.community];
        const enterprise = [...selectedModules.enterprise];

        CHART_OPTIONS.forEach(({ name, moduleName, isEnterprise }) => {
            if (!chartOptions[name]) return;

            switch (bundleOption) {
                case ALL_COMMUNITY_MODULE:
                    if (!isEnterprise) {
                        community.push(moduleName);
                    }
                    break;
                case ALL_ENTERPRISE_MODULE:
                    if (isEnterprise) {
                        enterprise.push(moduleName);
                    }
                    break;

                case ALL_COMMUNITY_AND_ENTERPRISE_MODULE:
                default:
                    (isEnterprise ? enterprise : community).push(moduleName);
            }
        });

        return { community, enterprise };
    }, [bundleOption, chartOptions, selectedModules]);

    const selectedDependenciesSnippet = useMemo(() => {
        return getModuleMappingsSnippet({ selectedModules: allImportModules });
    }, [allImportModules]);

    const updateBundleOption = useCallback(
        (moduleName: BundleOptionValue) => {
            const api = gridRef?.current?.api;
            if (!api) {
                return;
            }

            if (moduleName === ALL_COMMUNITY_AND_ENTERPRISE_MODULE) {
                api.selectAll('all');
                setSelectedModules({
                    community: [],
                    enterprise: [moduleName],
                });
            } else if (moduleName === ALL_ENTERPRISE_MODULE) {
                const nodesToToggle: IRowNode[] = [];

                api.deselectAll('all');
                api.forEachLeafNode((child) => {
                    if (child.data.isEnterprise && child.data.moduleName) {
                        nodesToToggle.push(child);
                    }
                });
                api.setNodesSelected({
                    nodes: nodesToToggle,
                    newValue: true,
                });

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

    const updateChartOption = useCallback((name: ChartModuleName) => {
        setChartOptions((prevSelectedCharts) => ({
            ...prevSelectedCharts,
            [name]: !prevSelectedCharts[name],
        }));
    }, []);

    return {
        bundleOption,
        updateBundleOption,
        chartOptions,
        updateChartOption,
        setSelectedModules,
        selectedDependenciesSnippet,
    };
}
