import { type FunctionComponent, useCallback, useRef } from 'react';
import { useMemo, useState } from 'react';

import { AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import {
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    SideBarModule,
    StatusBarModule,
} from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import styles from './DocsExamples.module.scss';
import { ChartsHeaderComponent } from './cell-renderers/ChartsHeaderComponent';
import { EnterpriseHeaderComponent } from './cell-renderers/EnterpriseHeaderComponent';
import { ExampleCountComponent } from './cell-renderers/ExampleCountComponent';
import { LinkCellRenderer } from './cell-renderers/LinkCellRenderer';
import { PageCountComponent } from './cell-renderers/PageCountComponent';

export type ExampleProperty = 'isEnterprise' | 'isIntegratedCharts' | 'isLocale' | 'hasExampleConsoleLog';

export interface Props {
    properties?: ExampleProperty[];
    exampleContents: any[];
}

const ALL_PROPERTIES: (ColDef & {
    field: ExampleProperty;
})[] = [
    {
        field: 'isEnterprise',
        headerName: 'Enterprise',
        headerComponentParams: {
            innerHeaderComponent: EnterpriseHeaderComponent,
        },
        enableRowGroup: true,
        minWidth: 80,
    },
    {
        field: 'isIntegratedCharts',
        headerName: 'Charts',
        headerComponentParams: {
            innerHeaderComponent: ChartsHeaderComponent,
        },
        enableRowGroup: true,
        minWidth: 80,
    },
    {
        field: 'isLocale',
        headerName: 'Locale',
        enableRowGroup: true,
        minWidth: 110,
    },
    {
        field: 'hasExampleConsoleLog',
        headerName: 'Log',
        enableRowGroup: true,
        minWidth: 90,
    },
];

export const DocsExamples: FunctionComponent<Props> = ({ properties = [], exampleContents }) => {
    const gridRef = useRef<AgGridReact>(null);
    const [colDefs] = useState<ColDef[]>([
        {
            field: 'pageName',
            rowGroup: true,
            hide: true,
            enableRowGroup: true,
        },
        {
            field: 'exampleName',
            hide: true,
        },
        ...ALL_PROPERTIES.filter((property) => properties.includes(property.field)),

        {
            headerName: 'React',
            cellRenderer: LinkCellRenderer,
            filter: false,
            minWidth: 200,
        },
        {
            headerName: 'React TS',
            cellRenderer: LinkCellRenderer,
            filter: false,
            minWidth: 200,
        },
        {
            headerName: 'Angular',
            cellRenderer: LinkCellRenderer,
            filter: false,
            minWidth: 200,
        },
        {
            headerName: 'Vue',
            cellRenderer: LinkCellRenderer,
            filter: false,
            minWidth: 200,
        },
        {
            headerName: 'JavaScript',
            cellRenderer: LinkCellRenderer,
            filter: false,
            minWidth: 200,
        },
        {
            headerName: 'Typescript',
            cellRenderer: LinkCellRenderer,
            filter: false,
            minWidth: 200,
        },
    ]);

    const defaultColDef: ColDef = {
        flex: 1,
        minWidth: 100,
        filter: true,
    };
    const autoGroupColumnDef = useMemo(() => {
        return {
            headerName: 'Page Examples',
            field: 'exampleName',
            minWidth: 300,
        };
    }, []);
    const rowGroupPanelShow = 'always';
    const groupDisplayType = 'singleColumn';
    const sideBar = useMemo(() => {
        return {
            toolPanels: ['filters', 'columns'],
        };
    }, []);

    const [statusBar] = useState({
        statusPanels: [
            {
                statusPanel: PageCountComponent,
            },
            {
                statusPanel: ExampleCountComponent,
            },
        ],
    });

    const onFilterTextBoxChanged = useCallback(() => {
        gridRef.current!.api.setGridOption(
            'quickFilterText',
            (document.getElementById('filter-text-box') as HTMLInputElement).value
        );
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <span>Quick Filter:</span>
                <input type="text" id="filter-text-box" placeholder="Filter..." onInput={onFilterTextBoxChanged} />
            </div>
            <AgGridReact
                ref={gridRef}
                modules={[
                    AllCommunityModule,
                    StatusBarModule,
                    RowGroupingModule,
                    SideBarModule,
                    FiltersToolPanelModule,
                    ColumnsToolPanelModule,
                    RowGroupingPanelModule,
                ]}
                rowData={exampleContents}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                statusBar={statusBar}
                sideBar={sideBar}
                autoGroupColumnDef={autoGroupColumnDef}
                groupDisplayType={groupDisplayType}
                rowGroupPanelShow={rowGroupPanelShow}
                groupDefaultExpanded={1}
            />
        </div>
    );
};
