import type { Framework } from '@ag-grid-types';
import { Snippet } from '@ag-website-shared/components/snippet/Snippet';
import type {
    ColDef,
    GetRowIdParams,
    IRowNode,
    RowSelectedEvent,
    RowSelectionOptions,
    ValueGetterParams,
} from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    ContextMenuModule,
    ModuleRegistry,
    RowSelectionModule,
    TreeDataModule,
} from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ModuleCellRenderer } from './ModuleCellRenderer';
import { ModuleConfiguration } from './ModuleConfiguration';
import styles from './ModuleMappings.module.scss';
import { ModuleNameCellRenderer } from './ModuleNameCellRenderer';
import { ModuleSearch } from './ModuleSearch';
import { ALL_COMMUNITY_MODULE, ALL_ENTERPRISE_MODULE } from './constants';
import { useModuleConfig } from './useModuleConfig';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    TreeDataModule,
    RowSelectionModule,
    ContextMenuModule,
    ClipboardModule,
]);

export function ModuleMappings({
    framework,
    modules,
}: {
    framework: Framework;
    modules: {
        groups: { hideFromSelection: boolean }[];
    };
}) {
    const gridRef = useRef<AgGridReact>(null);
    const moduleConfig = useModuleConfig(gridRef);
    const { selectedDependenciesSnippet, setSelectedModules, bundleOption } = moduleConfig;

    const rowData = useMemo(() => modules.groups.filter((group) => !group.hideFromSelection), [modules.groups]);

    const [defaultColDef] = useState<ColDef>({
        flex: 1,
        sortable: false,
        resizable: false,
        suppressMovable: true,
    });
    const [columnDefs] = useState([
        {
            field: 'moduleName',
            valueGetter: ({ data }: ValueGetterParams) => (data.hide ? null : data.moduleName),
            cellRenderer: ModuleNameCellRenderer,
        },
    ]);
    const [autoGroupColumnDef] = useState({
        headerName: 'Feature',
        cellRendererParams: {
            innerRenderer: ModuleCellRenderer,
        },
    });
    const getRowId = useCallback(
        (params: GetRowIdParams) => (params.data.children ? `${params.data.name} group` : params.data.moduleName),
        []
    );

    const updateSelected = useCallback(() => {
        const api = gridRef.current?.api;
        if (!api) return;

        const selectedCommunity: string[] = [];
        const selectedEnterprise: string[] = [];
        if (bundleOption === ALL_ENTERPRISE_MODULE) {
            setSelectedModules({
                community: [],
                enterprise: [bundleOption],
            });

            return;
        }

        api.forEachLeafNode((leaf) => {
            const { moduleName, isEnterprise, hide } = leaf.data;
            if (!hide && moduleName && leaf.isSelected()) {
                if (isEnterprise) {
                    selectedEnterprise.push(moduleName);
                } else {
                    selectedCommunity.push(moduleName);
                }
            }
        });

        setSelectedModules((curSelectedModules) => {
            let community = selectedCommunity;

            if (bundleOption === ALL_COMMUNITY_MODULE) {
                const communitySet = new Set(curSelectedModules.community);
                communitySet.add(ALL_COMMUNITY_MODULE);
                community = Array.from(communitySet);
            }

            return {
                community,
                enterprise: selectedEnterprise,
            };
        });
    }, [bundleOption, setSelectedModules]);

    const onRowSelected = useCallback(
        (event: RowSelectedEvent) => {
            const {
                node,
                data: { moduleName },
                api,
            } = event;
            if (!moduleName && !node.isSelected() && bundleOption !== '') {
                const nodesToReselect: IRowNode[] = [];
                node.allLeafChildren?.forEach((child) => {
                    if (
                        !child.isSelected() &&
                        !child.group &&
                        (bundleOption === ALL_ENTERPRISE_MODULE || !child.data.isEnterprise)
                    ) {
                        nodesToReselect.push(child);
                    }
                });
                api.setNodesSelected({
                    nodes: nodesToReselect,
                    newValue: true,
                });
            }

            updateSelected();
        },
        [bundleOption, updateSelected]
    );

    const rowSelection = useMemo<RowSelectionOptions>(() => {
        return {
            mode: 'multiRow',
            checkboxes: (params) => {
                if (bundleOption === '') {
                    return true;
                } else if (bundleOption === ALL_COMMUNITY_MODULE) {
                    return params.node.allLeafChildren?.length
                        ? params.node.allLeafChildren.some((child) => child.data.isEnterprise)
                        : params.data.isEnterprise;
                }

                return false;
            },
            groupSelects: 'descendants',
        };
    }, [bundleOption]);

    useEffect(() => {
        updateSelected();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <ModuleConfiguration moduleConfig={moduleConfig} />
            <ModuleSearch gridRef={gridRef} />
            <div style={{ height: '410px' }}>
                <AgGridReact
                    ref={gridRef}
                    treeDataChildrenField="children"
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    autoGroupColumnDef={autoGroupColumnDef}
                    rowData={rowData}
                    treeData
                    getRowId={getRowId}
                    rowSelection={rowSelection}
                    onRowSelected={onRowSelected}
                    loadThemeGoogleFonts
                    suppressContextMenu
                    enableCellTextSelection
                />
            </div>
            {selectedDependenciesSnippet && (
                <div className={styles.moduleSnippet}>
                    <Snippet framework={framework} content={selectedDependenciesSnippet} copyToClipboard />
                </div>
            )}
        </>
    );
}
