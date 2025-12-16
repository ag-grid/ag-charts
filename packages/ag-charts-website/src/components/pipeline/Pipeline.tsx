import { Alert } from '@ag-website-shared/components/alert/Alert';
import ChevronButtonCellRenderer from '@ag-website-shared/components/grid/ChevronButtonRenderer';
import DetailCellRenderer from '@ag-website-shared/components/grid/DetailCellRendererComponent';
import { Grid } from '@ag-website-shared/components/grid/Grid';
import IssueTypeCellRenderer from '@ag-website-shared/components/grid/IssueTypeRenderer';
import PaddingCellRenderer from '@ag-website-shared/components/grid/PaddingCellRenderer';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import styles from '@pages-styles/pipelineChangelog.module.scss';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';

const issueTypeValueFormatter = (params: any) => (params.value === 'Bug' ? 'Defect' : 'Feature Request');

const gridToChartVersion = (gridVersion: string) => {
    const versionParts = gridVersion.split('.');

    // the first charts release was on grid version 22 - we'll keep in lock step release wise going forward so this
    // works
    const chartMajorVersion = parseInt(versionParts[0]) - 22;
    return `${chartMajorVersion}.${versionParts[1]}.${versionParts[2]}`;
};

const COLUMN_DEFS = [
    {
        field: 'key',
        headerName: 'Issue',
        width: 140,
        filter: 'agTextColumnFilter',
        cellRendererSelector: (params: any) => {
            if (isRowMaster(params.node.data)) {
                return {
                    component: 'chevronButtonRenderer',
                };
            }
            return {
                component: 'paddingCellRenderer',
            };
        },
    },
    {
        field: 'summary',
        tooltipField: 'summary',
        width: 300,
        minWidth: 200,
        flex: 1,
        filter: 'agTextColumnFilter',
    },
    {
        field: 'issueType',
        width: 180,
        cellRenderer: 'issueTypeCellRenderer',
        valueFormatter: issueTypeValueFormatter,
        filterParams: {
            valueFormatter: issueTypeValueFormatter,
        },
    },
    {
        field: 'status',
        width: 135,
        minWidth: 180,
        valueGetter: (params) => {
            const fixVersionsArr = params.data.versions;
            const hasFixVersion = fixVersionsArr.length > 0;
            if (hasFixVersion) {
                const latestFixVersion = fixVersionsArr.length - 1;
                const fixVersion = fixVersionsArr[latestFixVersion];
                if (fixVersion.toUpperCase() === 'NEXT') {
                    return 'Scheduled';
                } else {
                    return `Scheduled for ${gridToChartVersion(fixVersion)}`;
                }
            }
            return 'Backlog';
        },
    },
];

const defaultColDef = {
    filter: true,
    floatingFilter: true,
    resizable: true,
    sortable: true,
    suppressHeaderMenuButton: true,
    autoHeight: true,
    cellClass: styles.fontClass,
    headerClass: styles.fontClass,
    suppressKeyboardEvent: (params: any) => {
        if (params.event.key === 'Enter' && params.node.master && params.event.type === 'keydown') {
            params.api.getCellRendererInstances({ rowNodes: [params.node] })[0].clickHandlerFunc();
            return true;
        }
        return false;
    },
    cellDataType: false,
};

const IS_SSR = typeof window === 'undefined';

const isRowMaster = (row: any) => row.moreInformation ?? row.deprecationNotes ?? row.breakingChangesNotes;

const newLinesToBreaks = (message: string) =>
    message.replaceAll('\n\r', '<br>').replaceAll('\n', '<br>').replaceAll('\r', '<br>');

const detailCellRendererParams = (params: any) => {
    const combinedMessages = [
        params.data.moreInformation,
        params.data.deprecationNotes,
        params.data.breakingChangesNotes,
    ]
        .filter(Boolean)
        .join('\n\n');

    return {
        message: newLinesToBreaks(combinedMessages),
    };
};

const extractFilterTerm = (location: any) =>
    location?.search ? new URLSearchParams(location.search).get('searchQuery') : '';

export const Pipeline = ({ location }: { location: string }) => {
    const [rowData, setRowData] = useState<any>(null);
    const [gridApi, setGridApi] = useState<any>(null);
    const URLFilterSearchQuery = useState(extractFilterTerm(location))[0];
    const searchBarEl = useRef(null);

    useEffect(() => {
        void fetch(urlWithBaseUrl('/pipeline/pipeline.json'))
            .then((response) => response.json())
            .then((data) => {
                setRowData(data);
            });
    }, []);

    const gridReady = (params: any) => {
        setGridApi(params.api);
        params.api.updateGridOptions({ quickFilterText: URLFilterSearchQuery });
    };

    const onQuickFilterChange = useCallback(
        (event: any) => {
            gridApi.updateGridOptions({ quickFilterText: event.target.value });
        },
        [gridApi]
    );

    return (
        <>
            {!IS_SSR && (
                <div>
                    <section className={styles.header}>
                        <Alert type="idea">
                            <p>
                                The AG Charts pipeline lists the feature requests and active bugs in our product
                                backlog. Use it to see the items scheduled for our next release or to look up the status
                                of a specific item. If you can’t find the item you’re looking for, check the{' '}
                                <a href={urlWithBaseUrl('/changelog')}>Changelog</a> containing the list of completed
                                items.
                            </p>
                        </Alert>
                    </section>

                    <div className={styles.searchBarOuter}>
                        <Icon name="search" />
                        <input
                            type="search"
                            className={styles.searchBar}
                            placeholder={'Search pipeline...'}
                            ref={searchBarEl}
                            onChange={onQuickFilterChange}
                        />
                        <span className={classnames(styles.searchExplainer, 'text-secondary')}>
                            Find pipeline items by issue number, summary content, or version
                        </span>
                    </div>

                    <Grid
                        gridHeight={'78vh'}
                        columnDefs={COLUMN_DEFS}
                        isRowMaster={isRowMaster}
                        detailRowAutoHeight={true}
                        components={{
                            myDetailCellRenderer: DetailCellRenderer,
                            paddingCellRenderer: PaddingCellRenderer,
                            chevronButtonRenderer: ChevronButtonCellRenderer,
                            issueTypeCellRenderer: IssueTypeCellRenderer,
                        }}
                        defaultColDef={defaultColDef}
                        enableCellTextSelection={true}
                        detailCellRendererParams={detailCellRendererParams}
                        detailCellRenderer={'myDetailCellRenderer'}
                        masterDetail={true}
                        rowData={rowData}
                        onGridReady={gridReady}
                    />
                </div>
            )}
        </>
    );
};
