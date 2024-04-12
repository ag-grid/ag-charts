import { Alert } from '@ag-website-shared/components/alert/Alert';
import { Icon } from '@ag-website-shared/components/icon/Icon';
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
import ReleaseVersionNotes from '@components/release-notes/ReleaseVersionNotes';
import styles from '@legacy-design-system/modules/pipelineChangelog.module.scss';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import { createBrowserHistory } from 'history';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const IS_SSR = typeof window === 'undefined';
const ALL_FIX_VERSIONS = 'All Versions';

const browserHistory = import.meta.env.SSR ? null : createBrowserHistory();

export function useLocation() {
    const [location, setLocation] = useState<any>(browserHistory?.location ?? null);
    return location;
}

const gridToChartVersion = (gridVersion: string) => {
    const versionParts = gridVersion.split('.');

    // the first charts release was on grid version 22 - we'll keep in lock step release wise going forward so this
    // works
    const chartMajorVersion = parseInt(versionParts[0]) - 22;
    return `${chartMajorVersion}.${versionParts[1]}.${versionParts[2]}`;
};

// @ts-expect-error
export const Changelog = () => {
    const extractFixVersionParameter = (location: any) => {
        const fixVersionParam = new URLSearchParams(location.search).get('fixVersion');
        return location?.search && fixVersionParam ? fixVersionParam : undefined;
    };

    const extractFilterTerm = useCallback(
        (location: any) => (location?.search ? new URLSearchParams(location.search).get('searchQuery') : ''),
        []
    );

    const location = useLocation();
    const [rowData, setRowData] = useState(null);
    const [gridApi, setGridApi] = useState<any>(null);
    const [versions, setVersions] = useState<any>([]);
    const [allReleaseNotes, setAllReleaseNotes] = useState<any>(null);
    const [currentReleaseNotes, setCurrentReleaseNotes] = useState<any>(null);
    const [markdownContent, setMarkdownContent] = useState<any>(undefined);
    const [fixVersion, setFixVersion] = useState(extractFixVersionParameter(location) || ALL_FIX_VERSIONS);
    const URLFilterItemKey = useState(extractFilterTerm(location))[0];
    const searchBarEl = useRef<any>(null);
    const autoSizeStrategy = useMemo(() => ({ type: 'fitGridWidth' }), []);

    const components = useMemo(() => {
        return {
            myDetailCellRenderer: DetailCellRenderer,
            paddingCellRenderer: PaddingCellRenderer,
            chevronButtonCellRenderer: ChevronButtonCellRenderer,
            issueTypeCellRenderer: IssueTypeCellRenderer,
        };
    }, []);

    const applyFixVersionFilter = useCallback(() => {
        if (gridApi && fixVersion) {
            const versionsFilterComponent = gridApi.getFilterInstance('versions');
            const newModel = { values: fixVersion === ALL_FIX_VERSIONS ? versions : [fixVersion], filterType: 'set' };
            versionsFilterComponent.setModel(newModel);
            gridApi.onFilterChanged();
        }
    }, [gridApi, fixVersion, versions]);

    const [darkMode] = useDarkmode();

    useEffect(() => {
        fetch(urlWithBaseUrl(`/changelog/changelog.json`))
            .then((response) => response.json())
            .then((data) => {
                const chartVersions = [
                    ALL_FIX_VERSIONS,
                    ...data.map((row: any) => row.versions[0]).map(gridToChartVersion),
                ];
                setVersions([...new Set(chartVersions)]);
                setRowData(data);
            });
        fetch(urlWithBaseUrl(`/changelog/releaseVersionNotes.json`))
            .then((response) => response.json())
            .then((data) => {
                setAllReleaseNotes(data);
            });
    }, []);

    useEffect(() => {
        applyFixVersionFilter();
    }, [gridApi, fixVersion, versions, applyFixVersionFilter]);

    useEffect(() => {
        let releaseNotesVersion = fixVersion;
        if (!releaseNotesVersion) {
            // Find the latest release notes version
            releaseNotesVersion = allReleaseNotes?.find((element: any) => !!element['release version'])?.[
                'release version'
            ];
        }

        if (releaseNotesVersion && allReleaseNotes) {
            const releaseNotes = allReleaseNotes.find((element: any) =>
                element['release version'].includes(releaseNotesVersion)
            );

            let currentReleaseNotesHtml = null;

            if (releaseNotes) {
                if (releaseNotes['markdown']) {
                    fetch(urlWithBaseUrl(`/changelog` + releaseNotes['markdown']))
                        .then((response) => response.text())
                        .then((markdownContent) => {
                            setMarkdownContent(markdownContent);
                        })
                        .catch((error) => {
                            // eslint-disable-next-line no-console
                            console.error('Error fetching Markdown content:', error);
                        });
                } else {
                    currentReleaseNotesHtml = Object.keys(releaseNotes)
                        .map((element) => releaseNotes[element])
                        .join(' ');
                    setMarkdownContent(undefined);
                }
            } else {
                setMarkdownContent(undefined);
            }
            setCurrentReleaseNotes(currentReleaseNotesHtml);
        }
    }, [fixVersion, allReleaseNotes]);

    const gridReady = useCallback(
        (params: any) => {
            setGridApi(params.api);
            searchBarEl.current.value = URLFilterItemKey;
            params.api.updateGridOptions({ quickFilterText: URLFilterItemKey });
        },
        [URLFilterItemKey]
    );

    const onQuickFilterChange = useCallback(
        (event: any) => {
            gridApi.updateGridOptions({ quickFilterText: event.target.value });
        },
        [gridApi]
    );

    const isRowMaster = useCallback((params: any) => {
        return params.moreInformation || params.deprecationNotes || params.breakingChangesNotes;
    }, []);

    const switchDisplayedFixVersion = useCallback(
        (fixVersion: any) => {
            setFixVersion(fixVersion);
            const url = new URL(window.location as any);
            url.searchParams.set('fixVersion', fixVersion);
            window.history.pushState({}, '', url);
        },
        [setFixVersion]
    );

    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            resizable: true,
            cellClass: styles.fontClass,
            headerClass: styles.fontClass,
            autoHeaderHeight: true,
            wrapHeaderText: true,
            suppressMenu: true,
            filter: true,
            floatingFilter: true,
            suppressKeyboardEvent: (params: any) => {
                if (params.event.key === 'Enter' && params.node.master && params.event.type === 'keydown') {
                    params.api.getCellRendererInstances({ rowNodes: [params.node] })[0].clickHandlerFunc();
                    return true;
                }
                return false;
            },
            cellDataType: false,
        }),
        []
    );

    const detailCellRendererParams = useCallback((params: any) => {
        function produceHTML(fieldName: any, fieldInfo: any) {
            return fieldName !== 'Link to Documentation'
                ? `<strong>${fieldName}:</strong><br> ${fieldInfo}<br><br>`
                : `<strong>${fieldName}:</strong><br> ${fieldInfo}`;
        }

        const moreInfo = params.data.moreInformation
            ? produceHTML('More Information', params.data.moreInformation)
            : '';
        const deprecationNotes = params.data.deprecationNotes
            ? produceHTML('Deprecation Notes', params.data.deprecationNotes)
            : '';
        const breakingChangesNotes = params.data.breakingChangesNotes
            ? produceHTML('Breaking Changes', params.data.breakingChangesNotes)
            : '';
        const linkToDocumentation = params.data.documentationUrl
            ? produceHTML('Link to Documentation', params.data.documentationUrl)
            : '';

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
                            ? `<a class=${styles.link} href="${link}"
         target="_blank">${link}</a>${element.substr(endIndex)}`
                            : `<a class=${styles.link} target="_blank" href="${link}">${link}</a>`;
                        return element.substr(0, beginningIndex) + htmlLink;
                    }
                    return element;
                });
                message = msgArr.join(' ');
            }
            return message;
        }

        const message = makeLinksFunctional(
            (moreInfo + deprecationNotes + breakingChangesNotes + linkToDocumentation)
                .replaceAll('\n\r', '<br>')
                .replaceAll('\n', '<br>')
                .replaceAll('\r', '<br>')
        );
        return {
            message: message,
        };
    }, []);

    const COLUMN_DEFS = useMemo(
        () => [
            {
                colId: 'key',
                field: 'key',
                headerName: 'Issue',
                width: 150,
                resizable: true,
                cellRendererSelector: (params: any) => {
                    if (
                        params.node.data.moreInformation ||
                        params.node.data.deprecationNotes ||
                        params.node.data.breakingChangesNotes
                    ) {
                        return {
                            component: 'chevronButtonCellRenderer',
                        };
                    }
                    return {
                        component: 'paddingCellRenderer',
                    };
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    comparator: (a: any, b: any) => {
                        const valA = parseInt(a);
                        const valB = parseInt(b);
                        if (valA === valB) return 0;
                        return valA > valB ? -1 : 1;
                    },
                },
            },
            {
                field: 'summary',
                tooltipField: 'summary',
                resizable: true,
                width: 300,
                minWidth: 200,
                flex: 1,
                filter: 'agTextColumnFilter',
            },
            {
                field: 'versions',
                headerName: 'Version',
                width: 145,
                resizable: true,
                filter: 'agSetColumnFilter',
                valueGetter: (params: any) => {
                    const version =
                        params.data.versions && params.data.versions.length === 1 ? params.data.versions[0] : '';
                    return gridToChartVersion(version);
                },
                filterParams: {
                    comparator: (a: any, b: any) => {
                        const valA = parseInt(a);
                        const valB = parseInt(b);
                        if (valA === valB) return 0;
                        return valA > valB ? -1 : 1;
                    },
                },
            },
            {
                field: 'issueType',
                valueFormatter: (params: any) => (params.value === 'Bug' ? 'Defect' : 'Feature Request'),
                cellRenderer: 'issueTypeCellRenderer',
                width: 175,
            },
            {
                field: 'status',
                valueGetter: (params: any) => {
                    return params.data.resolution;
                },
                width: 110,
            },
        ],
        []
    );

    const releaseNotesMarkdownContent = fixVersion === ALL_FIX_VERSIONS ? undefined : markdownContent;
    const hideExpander = fixVersion === ALL_FIX_VERSIONS || Boolean(releaseNotesMarkdownContent);

    return (
        <>
            {!IS_SSR && (
                <div className={styles.container}>
                    <h1>AG Charts Changelog</h1>

                    <section className={styles.header}>
                        <Alert type="idea">
                            This changelog enables you to identify the specific version in which a feature request or
                            bug fix was included. Check out the <a href="../pipeline/">Pipeline</a> to see what's in our
                            product backlog.
                        </Alert>

                        <ReleaseVersionNotes
                            releaseNotes={fixVersion === ALL_FIX_VERSIONS ? undefined : releaseNotesMarkdownContent}
                            markdownContent={markdownContent}
                            versions={versions}
                            fixVersion={fixVersion}
                            onChange={switchDisplayedFixVersion}
                            hideExpander={hideExpander}
                        />
                    </section>

                    <div className={styles.searchBarOuter}>
                        <Icon name="search" />
                        <input
                            type="search"
                            className={styles.searchBar}
                            placeholder={'Search changelog...'}
                            ref={searchBarEl}
                            onChange={onQuickFilterChange}
                        />
                        <span className={classnames(styles.searchExplainer, 'text-secondary')}>
                            Find changelog items by issue number, summary content, or version
                        </span>
                    </div>

                    <Grid
                        gridHeight={'70.5vh'}
                        columnDefs={COLUMN_DEFS}
                        rowData={rowData}
                        components={components}
                        defaultColDef={defaultColDef}
                        detailRowAutoHeight={true}
                        enableCellTextSelection={true}
                        detailCellRendererParams={detailCellRendererParams}
                        detailCellRenderer={'myDetailCellRenderer'}
                        isRowMaster={isRowMaster}
                        masterDetail
                        autoSizeStrategy={autoSizeStrategy}
                        onGridReady={gridReady}
                        onFirstDataRendered={() => {
                            applyFixVersionFilter();
                        }}
                        theme={darkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}
                    />
                </div>
            )}
        </>
    );
};
