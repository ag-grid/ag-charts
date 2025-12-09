import {
    CellStyleModule,
    ClientSideRowModelModule,
    ColumnAutoSizeModule,
    ExternalFilterModule,
    QuickFilterModule,
    RowApiModule,
    RowAutoHeightModule,
    TextFilterModule,
    TooltipModule,
} from 'ag-grid-community';
import {
    AdvancedFilterModule,
    ColumnsToolPanelModule,
    MasterDetailModule,
    SetFilterModule,
    StatusBarModule,
} from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { forwardRef } from 'react';

export const Grid = forwardRef((props, ref) => {
    return (
        <div style={{ width: '100%', height: props.gridHeight }}>
            <AgGridReact
                ref={ref}
                {...props}
                modules={[
                    RowAutoHeightModule,
                    RowApiModule,
                    TextFilterModule,
                    CellStyleModule,
                    ColumnAutoSizeModule,
                    QuickFilterModule,
                    ClientSideRowModelModule,
                    TooltipModule,
                    AdvancedFilterModule,
                    MasterDetailModule,
                    SetFilterModule,
                    ColumnsToolPanelModule,
                    StatusBarModule,
                    ExternalFilterModule,
                ]}
                statusBar={{
                    statusPanels: [
                        {
                            statusPanel: 'agTotalAndFilteredRowCountComponent',
                            align: 'left',
                        },
                        {
                            statusPanel: 'agTotalRowCountComponent',
                            align: 'center',
                        },
                        { statusPanel: 'agFilteredRowCountComponent' },
                        { statusPanel: 'agSelectedRowCountComponent' },
                        { statusPanel: 'agAggregationComponent' },
                    ],
                }}
            />
        </div>
    );
});
