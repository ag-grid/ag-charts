import { Icon } from '@ag-website-shared/components/icon/Icon';
import { Alert } from '@components/alert/Alert';
// @ts-expect-error
import ChevronButtonCellRenderer from '@components/grid/ChevronButtonRenderer';
// @ts-expect-error
import DetailCellRenderer from '@components/grid/DetailCellRendererComponent';
// @ts-expect-error
import { Grid } from '@components/grid/Grid';
// @ts-expect-error
import IssueTypeCellRenderer from '@components/grid/IssueTypeRenderer';
// @ts-expect-error
import PaddingCellRenderer from '@components/grid/PaddingCellRenderer';
import { SITE_BASE_URL, SITE_URL } from '@constants';
import styles from '@legacy-design-system/modules/pipelineChangelog.module.scss';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';

const COLUMN_DEFS = [
    {
        field: 'key',
        headerName: 'Issue',
        width: 140,
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
    },
    {
        field: 'issueType',
        width: 180,
        valueFormatter: (params: any) => (params.value === 'Bug' ? 'Defect' : 'Feature Request'),
        cellRenderer: 'issueTypeCellRenderer',
    },
    {
        field: 'status',
        width: 135,
        valueGetter: (params: any) => {
            const fixVersionsArr: any = params.data.versions;
            const hasFixVersion: any = fixVersionsArr.length > 0;
            if (hasFixVersion) {
                const latestFixVersion: any = fixVersionsArr.length - 1;
                const fixVersion: any = fixVersionsArr[latestFixVersion];
                if (fixVersion === 'Next' && (params.data.status === 'Backlog' || params.data.status === 'Done')) {
                    return 'Next Release';
                }
            }
            if (params.data.status === 'Done' && params.data.resolution !== 'Done') {
                return params.data.resolution;
            }

            if (params.data.status !== 'Done' && params.data.status !== 'Backlog') {
                return 'Scheduled';
            } else {
                return 'Backlog';
            }
        },
    },
];

const defaultColDef = {
    resizable: true,
    sortable: true,
    suppressMenu: true,
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

const isRowMaster = (row: any) => row.moreInformation || row.deprecationNotes || row.breakingChangesNotes;

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
    let message = newLinesToBreaks(combinedMessages);

    function makeLinksFunctional(message: any) {
        let msgArr = message.split(' ');
        const linkStrIdx = msgArr.findIndex((word: any) => word.includes('https://'));
        if (linkStrIdx > 0) {
            msgArr = msgArr.map((element: any) => {
                if (element.includes('https://')) {
                    const beginningIndex = element.indexOf('http');
                    const endIndex = element.indexOf('<', beginningIndex);
                    const isEndIndex = endIndex >= 0;
                    let length = 0;
                    if (isEndIndex) {
                        length = endIndex - beginningIndex;
                    }

                    const link = length
                        ? element.substr(element.indexOf('http'), length)
                        : element.substr(element.indexOf('http'));
                    const htmlLink = isEndIndex
                        ? `<a class=${styles.link} href="${link}" target="_blank">${link}</a>${element.substr(
                              endIndex
                          )}`
                        : `<a class=${styles.link} target="_blank" href="${link}">${link}</a>`;
                    return element.substr(0, beginningIndex) + htmlLink;
                }
                return element;
            });
            message = msgArr.join(' ');
        }
        return message;
    }

    message = makeLinksFunctional(message);
    const res: any = {};
    res.message = message;

    return res;
};

const extractFilterTerm = (location: any) =>
    location?.search ? new URLSearchParams(location.search).get('searchQuery') : '';

// @ts-expect-error
export const Pipeline = ({ location, currentFramework }) => {
    const [rowData, setRowData] = useState<any>(null);
    const [gridApi, setGridApi] = useState<any>(null);
    const URLFilterSearchQuery = useState(extractFilterTerm(location))[0];
    const searchBarEl = useRef(null);

    const [darkMode] = useDarkmode();

    useEffect(() => {
        fetch(urlWithBaseUrl('/pipeline/pipeline.json'))
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
                <div className={styles.container}>
                    <h1>AG Charts Pipeline</h1>
                    <section className={styles.header}>
                        <Alert type="idea">
                            <p>
                                The AG Charts pipeline lists the feature requests and active bugs in our product
                                backlog. Use it to see the items scheduled for our next release or to look up the status
                                of a specific item. If you can’t find the item you’re looking for, check the{' '}
                                <a href={`${SITE_URL}${SITE_BASE_URL ?? ''}changelog/`}>Changelog</a> containing the
                                list of completed items.
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
                        theme={darkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}
                    />
                </div>
            )}
        </>
    );
};
