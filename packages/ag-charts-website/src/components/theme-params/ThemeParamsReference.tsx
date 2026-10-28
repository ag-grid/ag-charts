import { Icon } from '@ag-website-shared/components/icon/Icon';
import { fetchInterfacesReference } from '@utils/client/fetchInterfacesReference';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import type {
    ColDef,
    GetDataPath,
    ICellRendererParams,
    IRowNode,
    RowClickedEvent,
    RowSelectionOptions,
} from 'ag-grid-community';
import { AllCommunityModule, colorSchemeDark, themeQuartz } from 'ag-grid-community';
import { ModuleRegistry, RowGroupingModule, TreeDataModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AgChartThemeName } from 'ag-charts-community';

import styles from './ThemeParamsReference.module.scss';
import { STOCK_THEMES, loadThemeParamsGraph, resolveThemeParams } from './loadThemeParamsData';
import { type ThemeParamNode, treePath } from './themeParamsGraph';

ModuleRegistry.registerModules([AllCommunityModule, TreeDataModule, RowGroupingModule]);

const MAX_OPTION_MATCHES = 30;
const darkTheme = themeQuartz.withPart(colorSchemeDark);

interface ParamDocs {
    description?: string;
    type?: string;
}

interface ParamRow {
    node: ThemeParamNode;
    value: unknown;
}

const isColourString = (value: unknown): value is string =>
    typeof value === 'string' && /^(#|rgb|hsl|color-mix|transparent)/i.test(value.trim());

function ValueView({ value }: { value: unknown }) {
    if (value == null) return null;
    if (isColourString(value)) {
        return (
            <span className={styles.value}>
                <span className={styles.swatch} style={{ background: value }} />
                <code>{value}</code>
            </span>
        );
    }
    if (typeof value === 'object') {
        return (
            <span className={styles.value}>
                {Object.keys(value).map((key) => (
                    <span key={key} className={styles.value}>
                        {key}: <ValueView value={(value as Record<string, unknown>)[key]} />
                    </span>
                ))}
            </span>
        );
    }
    return <code className={styles.plainValue}>{Array.isArray(value) ? value.join(', ') : String(value)}</code>;
}

function ParamLink({ name, onSelect }: { name: string; onSelect: (name: string) => void }) {
    return (
        <button type="button" className={styles.paramLink} onClick={() => onSelect(name)}>
            <code>{name}</code>
        </button>
    );
}

function Chain({ chain, onSelect }: { chain: string[]; onSelect: (name: string) => void }) {
    return (
        <span className={styles.chain}>
            {chain.map((name, index) => (
                <span key={name}>
                    {index > 0 && <span className={styles.arrow}>←</span>}
                    <ParamLink name={name} onSelect={onSelect} />
                </span>
            ))}
        </span>
    );
}

function seriesLabel(seriesTypes: string[], seriesTypeCount: number) {
    if (seriesTypes.length === seriesTypeCount) return 'all series';
    if (seriesTypes.length > 4) return `${seriesTypes.length} series types`;
    return seriesTypes.join(', ');
}

function ParamDetail({
    node,
    docs,
    value,
    themeName,
    seriesTypeCount,
    onSelect,
}: {
    node: ThemeParamNode;
    docs?: ParamDocs;
    value: unknown;
    themeName: string;
    seriesTypeCount: number;
    onSelect: (name: string) => void;
}) {
    return (
        <div className={styles.detail}>
            <h3 className={styles.detailTitle}>
                <code>{node.name}</code>
            </h3>
            {docs?.description != null && <p>{docs.description}</p>}
            <dl className={styles.facts}>
                {docs?.type != null && (
                    <>
                        <dt>Type</dt>
                        <dd>
                            <code>{docs.type}</code>
                        </dd>
                    </>
                )}
                <dt>Default</dt>
                <dd>
                    <code>{node.defaultText}</code>
                </dd>
                <dt>Value in {themeName}</dt>
                <dd>
                    <ValueView value={value} />
                </dd>
                {node.chain.length > 1 && (
                    <>
                        <dt>Inherits from</dt>
                        <dd>
                            <Chain chain={node.chain.slice(1)} onSelect={onSelect} />
                        </dd>
                    </>
                )}
                {node.parents.length > 1 && (
                    <>
                        <dt>Also blends</dt>
                        <dd>
                            {node.parents.slice(1).map((parent) => (
                                <ParamLink key={parent} name={parent} onSelect={onSelect} />
                            ))}
                        </dd>
                    </>
                )}
                {node.children.length > 0 && (
                    <>
                        <dt>Inherited by</dt>
                        <dd>
                            {node.children.map((child) => (
                                <ParamLink key={child} name={child} onSelect={onSelect} />
                            ))}
                        </dd>
                    </>
                )}
                <dt>CSS variable</dt>
                <dd>
                    <code>{node.cssVariable}</code>
                </dd>
            </dl>

            <h4>Options that default to this param</h4>
            {node.options.length === 0 ? (
                <p className={styles.muted}>
                    No chart options read this param directly. It is applied to the chart's HTML elements (tooltips,
                    menus, toolbars, dialogs) through its CSS variable, or reaches options through the params that
                    inherit from it.
                </p>
            ) : (
                <ul className={styles.optionList}>
                    {node.options.map((option) => (
                        <li key={option.path}>
                            <code>{option.path}</code>
                            <span className={styles.muted}>
                                {' '}
                                {seriesLabel(option.seriesTypes, seriesTypeCount)}
                                {!option.direct && ' · blended with other values'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {node.totalOptionCount > node.options.length && (
                <p className={styles.muted}>
                    Changing <code>{node.name}</code> affects {node.totalOptionCount} option paths in total, including
                    those reached through the params that inherit from it.
                </p>
            )}
        </div>
    );
}

export function ThemeParamsReference() {
    const gridRef = useRef<AgGridReact<ParamRow>>(null);
    const [darkMode] = useDarkmode();
    const [themeName, setThemeName] = useState<AgChartThemeName>('ag-default');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string>();
    const [docs, setDocs] = useState<Map<string, ParamDocs>>(new Map());

    const graph = useMemo(() => loadThemeParamsGraph(), []);
    const values = useMemo(() => resolveThemeParams(themeName), [themeName]);

    useEffect(() => {
        fetchInterfacesReference()
            .then((reference) => {
                const result = new Map<string, ParamDocs>();
                for (const interfaceName of ['AgBaseChartThemeParams', 'AgChartThemeParams']) {
                    const node = reference.get(interfaceName);
                    if (node == null || !('members' in node)) continue;
                    for (const member of node.members) {
                        result.set(member.name, { description: member.docs?.join(' '), type: member.type });
                    }
                }
                setDocs(result);
            })
            .catch(() => setDocs(new Map()));
    }, []);

    const rowData = useMemo<ParamRow[]>(
        () => [...graph.params.values()].map((node) => ({ node, value: values[node.name] })),
        [graph, values]
    );

    const query = search.trim().toLowerCase();

    const optionMatches = useMemo(() => {
        if (query.length < 2) return [];
        const matches: Array<{ path: string; param: ThemeParamNode }> = [];
        for (const node of graph.params.values()) {
            for (const option of node.options) {
                if (option.path.toLowerCase().includes(query)) matches.push({ path: option.path, param: node });
            }
        }
        return matches.sort((a, b) => a.path.localeCompare(b.path));
    }, [graph, query]);

    const matchingParams = useMemo(() => {
        if (query.length === 0) return undefined;
        const names = new Set<string>();
        for (const node of graph.params.values()) {
            if (node.name.toLowerCase().includes(query)) names.add(node.name);
        }
        for (const { param } of optionMatches) names.add(param.name);
        return names;
    }, [graph, query, optionMatches]);

    useEffect(() => {
        const api = gridRef.current?.api;
        if (api == null) return;
        api.onFilterChanged();
        if (matchingParams != null) api.expandAll();
    }, [matchingParams]);

    const selectParam = useCallback((name: string) => {
        setSelected(name);
        const api = gridRef.current?.api;
        const rowNode = api?.getRowNode(name);
        if (api == null || rowNode == null) return;
        let parent = rowNode.parent;
        while (parent != null) {
            parent.setExpanded(true);
            parent = parent.parent;
        }
        rowNode.setSelected(true, true);
        api.ensureNodeVisible(rowNode, 'middle');
    }, []);

    const columnDefs = useMemo<ColDef<ParamRow>[]>(
        () => [
            {
                headerName: 'Default',
                valueGetter: ({ data }) => data?.node.defaultText,
                flex: 2,
                cellRenderer: ({ value, data }: ICellRendererParams<ParamRow>) =>
                    data?.node.isRoot ? <span className={styles.muted}>{value}</span> : <code>{value}</code>,
                tooltipValueGetter: ({ value }) => value,
            },
            {
                headerName: `Value in ${themeName}`,
                valueGetter: ({ data }) => data?.value,
                flex: 2,
                cellRenderer: ({ value }: ICellRendererParams<ParamRow>) => <ValueView value={value} />,
            },
            {
                headerName: 'Options Affected',
                valueGetter: ({ data }) => data?.node.totalOptionCount,
                width: 150,
                type: 'rightAligned',
                cellRenderer: ({ value }: ICellRendererParams<ParamRow>) =>
                    value === 0 || value == null ? '-' : value,
            },
        ],
        [themeName]
    );

    const autoGroupColumnDef = useMemo<ColDef<ParamRow>>(
        () => ({
            headerName: 'Parameter',
            flex: 3,
            minWidth: 280,
            valueGetter: ({ data }) => data?.node.name,
            cellRendererParams: { suppressCount: true },
        }),
        []
    );

    const getDataPath = useCallback<GetDataPath<ParamRow>>((data) => treePath(data.node), []);

    const rowSelection = useMemo<RowSelectionOptions>(
        () => ({ mode: 'singleRow', checkboxes: false, enableClickSelection: true }),
        []
    );

    const doesExternalFilterPass = useCallback(
        (rowNode: IRowNode<ParamRow>) => rowNode.data == null || matchingParams?.has(rowNode.data.node.name) !== false,
        [matchingParams]
    );

    const selectedNode = selected == null ? undefined : graph.params.get(selected);

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Icon name="search" svgClasses={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        type="search"
                        placeholder="Search params or option paths, e.g. textColor or label.color"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
                <label className={styles.themeSelect}>
                    Values for
                    <select
                        value={themeName}
                        onChange={(event) => setThemeName(event.target.value as AgChartThemeName)}
                    >
                        {STOCK_THEMES.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {optionMatches.length > 0 && (
                <div className={styles.optionMatches}>
                    <h4>Options matching “{search.trim()}”, and the params that set them</h4>
                    <ul className={styles.optionList}>
                        {optionMatches.slice(0, MAX_OPTION_MATCHES).map(({ path, param }) => (
                            <li key={`${path}:${param.name}`}>
                                <code>{path}</code> <span className={styles.arrow}>←</span>{' '}
                                <Chain chain={param.chain} onSelect={selectParam} />
                            </li>
                        ))}
                    </ul>
                    {optionMatches.length > MAX_OPTION_MATCHES && (
                        <p className={styles.muted}>
                            {optionMatches.length - MAX_OPTION_MATCHES} more matches; refine the search to narrow them.
                        </p>
                    )}
                </div>
            )}

            <div className={matchingParams == null ? styles.grid : undefined}>
                <AgGridReact<ParamRow>
                    ref={gridRef}
                    theme={darkMode ? darkTheme : themeQuartz}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    autoGroupColumnDef={autoGroupColumnDef}
                    treeData
                    getDataPath={getDataPath}
                    getRowId={({ data }) => data.node.name}
                    groupDefaultExpanded={1}
                    domLayout={matchingParams == null ? 'normal' : 'autoHeight'}
                    rowSelection={rowSelection}
                    onRowClicked={(event: RowClickedEvent<ParamRow>) => setSelected(event.data?.node.name)}
                    isExternalFilterPresent={() => matchingParams != null}
                    doesExternalFilterPass={doesExternalFilterPass}
                    loadThemeGoogleFonts
                    suppressContextMenu
                    enableCellTextSelection
                    tooltipShowDelay={300}
                />
            </div>

            {selectedNode ? (
                <ParamDetail
                    node={selectedNode}
                    docs={docs.get(selectedNode.name)}
                    value={values[selectedNode.name]}
                    themeName={themeName}
                    seriesTypeCount={graph.seriesTypeCount}
                    onSelect={selectParam}
                />
            ) : (
                <p className={styles.muted}>Select a param to see what it inherits from and which options it sets.</p>
            )}
        </div>
    );
}
