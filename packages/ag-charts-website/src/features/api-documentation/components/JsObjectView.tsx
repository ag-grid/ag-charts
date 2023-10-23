import { Icon } from '@components/icon/Icon';
import classnames from 'classnames';
import { Fragment, type FunctionComponent, createContext, useCallback, useContext, useState } from 'react';
import { SearchBox } from 'src/features/api-documentation/components/SearchBox';

import { UNION_DISCRIMINATOR_PROP } from '../constants';
import type {
    Config,
    JsObjectPropertiesViewConfig,
    JsObjectSelection,
    JsObjectSelectionProperty,
    JsObjectSelectionUnionNestedObject,
    JsObjectViewProps,
} from '../types';
import { JsObjectPropertiesViewConfigContext } from '../utils/jsObjectPropertiesViewConfigContext';
import type {
    JsonArray,
    JsonFunction,
    JsonModel,
    JsonObjectProperty,
    JsonPrimitiveProperty,
    JsonProperty,
    JsonUnionType,
} from '../utils/model';
import { getTopSelection, getUnionPathInfo } from '../utils/modelPath';
import { Highlight } from './Highlight';
import styles from './JsObjectView.module.scss';

interface SelectionContextData {
    handleSelection?: JsObjectViewProps['handleSelection'];
    selectionPathId: string;
    isSelected: (selection: JsObjectSelection) => boolean;
}

const SelectionContext = createContext<SelectionContextData>({} as SelectionContextData);

const DEFAULT_JSON_NODES_EXPANDED = false;
const HIDE_TYPES = true;

export interface ExpandableSnippetParams {
    interfacename: string;
    overridesrc?: string;
    breadcrumbs?: string[];
}

interface ModelSnippetWithBreadcrumbsParams {
    breadcrumbs?: string[];
    model: JsonModel;
}

function getSelectionPathId(selection: JsObjectSelection): string {
    let selectionPathId: string[] = selection.path;
    if (selection.type === 'property') {
        selectionPathId = selectionPathId.concat(selection.propName);
    } else if (selection.type === 'unionNestedObject') {
        selectionPathId = selectionPathId.concat(selection.index.toString());
    }
    return selectionPathId.join('.');
}

export const JsObjectView: FunctionComponent<JsObjectViewProps> = ({
    model,
    breadcrumbs = [],
    handleSelection: parentHandleSelection,
}) => {
    const [selectionPathId, setSelectionPathId] = useState<string>('');
    const isSelected = useCallback(
        (selection: JsObjectSelection) => {
            return selectionPathId === getSelectionPathId(selection);
        },
        [selectionPathId]
    );
    const handleSelection = (selection: JsObjectSelection) => {
        parentHandleSelection(selection);
        setSelectionPathId(getSelectionPathId(selection));
    };
    return (
        <div className={styles.expandableSnippet} role="presentation">
            <header>
                <h3>Options Reference</h3>
                <p className="text-secondary font-size-small">
                    A comprehensive interactive explorer for the <b>AgChartOptions</b> structure.
                </p>

                <SearchBox />
            </header>

            <pre className={classnames('code', 'language-ts')}>
                <code className={'language-ts'}>
                    <SelectionContext.Provider value={{ handleSelection, selectionPathId, isSelected }}>
                        <ModelSnippetWithBreadcrumbs breadcrumbs={breadcrumbs} model={model} />
                    </SelectionContext.Provider>
                </code>
            </pre>
        </div>
    );
};

const ModelSnippetWithBreadcrumbs: React.FC<ModelSnippetWithBreadcrumbsParams> = ({ model, breadcrumbs = [] }) => {
    return (
        <ObjectBreadcrumb
            breadcrumbs={breadcrumbs}
            model={model}
            bodyContent={() => (
                <>
                    <div className={styles.jsonObject} role="presentation">
                        <ModelSnippet model={model} path={[]}></ModelSnippet>
                    </div>
                </>
            )}
        />
    );
};

interface ModelSnippetParams {
    model: JsonModel | JsonUnionType;
    skip?: string[];
    path: string[];
    showTypeAsDiscriminatorValue?: boolean;
}

const ModelSnippet: React.FC<ModelSnippetParams> = ({ model, path, showTypeAsDiscriminatorValue }) => {
    const config = useContext(JsObjectPropertiesViewConfigContext);

    if (model.type === 'model') {
        const propertiesRendering = Object.entries(model.properties)
            .map(([propName, propInfo]) => {
                if (config?.excludeProperties?.includes(propName)) {
                    return;
                }

                const { desc } = propInfo;
                return (
                    <PropertySnippet
                        key={propName}
                        propName={propName}
                        desc={desc}
                        meta={propInfo}
                        path={path}
                        showTypeAsDiscriminatorValue={showTypeAsDiscriminatorValue}
                    />
                );
            })
            .filter((v) => !!v);
        return <>{propertiesRendering}</>;
    } else if (model.type === 'union') {
        return <Union model={model} path={path} />;
    }

    return null;
};

function PrimitiveUnionOption({ opt }: { opt: JsonPrimitiveProperty }) {
    return <PrimitiveType desc={opt} />;
}

function Union({ model, path }: { model: JsonUnionType; path: string[] }) {
    if (model.options.every((opt) => opt.type === 'primitive')) {
        return (
            <>
                {model.options.map((opt, idx) => {
                    return opt.type === 'primitive' ? <PrimitiveUnionOption key={idx} opt={opt} /> : null;
                })}
            </>
        );
    }

    return (
        <div className={styles.jsonObjectUnion} role="presentation">
            {model.options
                .map((desc, idx) => {
                    switch (desc.type) {
                        case 'primitive':
                            return <PrimitiveUnionOption opt={desc} />;
                        case 'array':
                            break;
                        case 'nested-object':
                            return <UnionNestedObject desc={desc} index={idx} path={path} />;
                    }
                })
                .map((el, idx) => (
                    <div key={idx} className={styles.jsonUnionItem}>
                        {el}
                    </div>
                ))}
        </div>
    );
}

function DiscriminatorType({ discriminatorType }: { discriminatorType?: string }) {
    if (!discriminatorType) {
        return null;
    }

    const quotationMatches = /(["'])(.*)(["'])/.exec(discriminatorType);
    if (!quotationMatches) {
        return <>{discriminatorType}</>;
    }

    const [_, leftQuote, value, rightQuote] = quotationMatches;
    return (
        <>
            {leftQuote}
            <span className={styles.unionDiscriminator}>{value}</span>
            {rightQuote}
        </>
    );
}

function UnionNestedObject({ desc, index, path }: { desc: JsonObjectProperty; index: number; path: string[] }) {
    const config = useContext(JsObjectPropertiesViewConfigContext);
    const { pathItem, discriminatorType, discriminatorProp, discriminator } = getUnionPathInfo({
        model: desc.model,
        index,
    });
    const unionPath = path.concat(pathItem);
    const expandedInitially = isExpandedInitially(discriminatorType || String(index), unionPath, config);
    const [isExpanded, setExpanded] = useState(expandedInitially);
    const { handleSelection, isSelected } = useContext(SelectionContext);
    const selection = {
        type: 'unionNestedObject',
        index,
        // NOTE: Not passing in `unionPath`, as selection should handle how to determine the path
        path,
        model: desc,
    } as JsObjectSelectionUnionNestedObject;
    const handleUnionNestedObjectSelection = () => {
        handleSelection && handleSelection(selection);
    };
    const toggleExpand = () => {
        setExpanded((expanded: boolean) => !expanded);
    };

    const SelectionWrapper = isSelected(selection) ? Highlight : Fragment;

    if (discriminatorType) {
        return (
            <SelectionWrapper>
                <span className={styles.expandable}>
                    {isExpanded && <div className={styles.expanderBar}></div>}
                    <span className={classnames('token', 'punctuation')}>
                        {isExpanded && <JsonNodeExpander isExpanded={isExpanded} toggleExpand={toggleExpand} />}
                        {'{ '}
                    </span>
                    {!isExpanded && (
                        <>
                            <PropertyDeclaration
                                propName={discriminatorProp}
                                tsType={discriminatorType}
                                propDesc={discriminator}
                                isExpanded={isExpanded}
                                expandable={true}
                                toggleExpand={toggleExpand}
                                onSelection={handleUnionNestedObjectSelection}
                                style="unionTypeProperty"
                            />
                            <span onClick={handleUnionNestedObjectSelection}>
                                {' '}
                                = <DiscriminatorType discriminatorType={discriminatorType} />
                            </span>
                        </>
                    )}
                    {isExpanded ? (
                        <div className={styles.jsonObject} onClick={(e) => e.stopPropagation()} role="presentation">
                            <ModelSnippet
                                model={desc.model}
                                path={unionPath}
                                showTypeAsDiscriminatorValue={true}
                            ></ModelSnippet>
                        </div>
                    ) : (
                        <span onClick={toggleExpand} className={classnames('token', 'operator')}>
                            {' '}
                            ...{' '}
                        </span>
                    )}
                    <span className={classnames('token', 'punctuation')}>{' }'}</span>
                    {!HIDE_TYPES && (
                        <>
                            {': '}
                            <span className={classnames('token', 'builtin')}>{desc.tsType}</span>
                        </>
                    )}
                </span>
            </SelectionWrapper>
        );
    }

    return (
        <SelectionWrapper>
            <span className={styles.expandable}>
                {isExpanded && <div className={styles.expanderBar}></div>}
                <span className={classnames('token', 'punctuation')}>
                    {<JsonNodeExpander isExpanded={isExpanded} toggleExpand={toggleExpand} />}
                    {' {'}
                </span>
                {isExpanded ? (
                    <div
                        className={classnames(styles.jsonObject, styles.unexpandable)}
                        onClick={(e) => e.stopPropagation()}
                        role="presentation"
                    >
                        <ModelSnippet model={desc.model} path={unionPath}></ModelSnippet>
                    </div>
                ) : (
                    <span className={classnames('token', 'operator')}> ... </span>
                )}
                <span className={classnames('token', 'punctuation')}>{'}'}</span>
                {!HIDE_TYPES && (
                    <>
                        {': '}
                        <span className={classnames('token', 'builtin')}>{desc.tsType}</span>
                    </>
                )}
            </span>
        </SelectionWrapper>
    );
}

interface PropertySnippetParams {
    propName: string;
    desc: JsonProperty;
    meta: Omit<JsonModel['properties'][number], 'desc'>;
    forceInitiallyExpanded?: boolean;
    path: string[];
    showTypeAsDiscriminatorValue?: boolean;
}

const PropertySnippet: React.FC<PropertySnippetParams> = ({
    propName,
    desc,
    meta,
    forceInitiallyExpanded,
    path,
    showTypeAsDiscriminatorValue,
}) => {
    const config = useContext(JsObjectPropertiesViewConfigContext);
    const propPath = path.concat(propName);
    const expandedInitially = forceInitiallyExpanded || isExpandedInitially(propName, propPath, config as Config);
    const [isJSONNodeExpanded, setJSONNodeExpanded] = useState(expandedInitially);
    const { handleSelection, isSelected } = useContext(SelectionContext);
    const selection = { type: 'property', propName, path, model: meta } as JsObjectSelectionProperty;
    const handlePropertySelection = () => {
        handleSelection && handleSelection(selection);
    };
    const toggleExpand = () => {
        if (!expandable) {
            return;
        }

        setJSONNodeExpanded((expanded: boolean) => !expanded);
    };

    const { deprecated } = meta;
    const { tsType } = desc;

    let propertyRendering;
    let collapsePropertyRendering;
    let renderTsType = true;
    switch (desc.type) {
        case 'primitive':
            propertyRendering = null;
            break;
        case 'array':
            propertyRendering = <ArrayType desc={desc} path={propPath} />;
            collapsePropertyRendering = desc.elements.type !== 'primitive' && (
                <span onClick={toggleExpand}>
                    <span className={classnames('token', 'punctuation')}> {'['.repeat(desc.depth)}</span>
                    <span className={classnames('token', 'operator')}> ... </span>
                    <span className={classnames('token', 'punctuation')}>{']'.repeat(desc.depth)}</span>
                </span>
            );
            break;
        case 'nested-object':
            propertyRendering = <NestedObject desc={desc} path={propPath} />;
            collapsePropertyRendering = <CollapsedNestedObject toggleExpand={toggleExpand} />;
            break;
        case 'union':
            const simpleUnion = isSimpleUnion(desc);
            propertyRendering = !simpleUnion ? <ModelSnippet model={desc} path={propPath}></ModelSnippet> : null;
            collapsePropertyRendering = !simpleUnion ? <></> : null;
            break;
        case 'function':
            propertyRendering = isJSONNodeExpanded ? <FunctionFragment desc={desc} path={propPath} /> : null;
            renderTsType = isSimpleFunction(desc);
            break;
        default:
            // eslint-disable-next-line no-console
            console.warn(`AG Docs - unhandled sub-type: ${desc['type']}`);
    }

    const shouldHideChildren = config.hideChildrenInNavProperties?.includes(propName);
    const expandable = !shouldHideChildren && !!collapsePropertyRendering;

    let propertyValue;
    if (shouldHideChildren) {
        propertyValue = null;
    } else if (!isJSONNodeExpanded && collapsePropertyRendering) {
        propertyValue = collapsePropertyRendering;
    } else {
        propertyValue = (
            <span className={classnames(styles['unexpandable'])} onClick={(e) => e.stopPropagation()}>
                {propertyRendering}
            </span>
        );
    }

    const SelectionWrapper = isSelected(selection) ? Highlight : Fragment;

    return (
        <div
            className={classnames(
                expandable && styles.expandable,
                styles.jsonProperty,
                deprecated && styles.deprecated,
                styles['type-' + desc.type]
            )}
            role="presentation"
        >
            <SelectionWrapper>
                {
                    <PropertyDeclaration
                        propName={propName}
                        tsType={renderTsType ? tsType : null}
                        propDesc={meta}
                        isExpanded={isJSONNodeExpanded}
                        expandable={expandable}
                        toggleExpand={toggleExpand}
                        onSelection={handlePropertySelection}
                        showTypeAsDiscriminatorValue={
                            showTypeAsDiscriminatorValue && propName === UNION_DISCRIMINATOR_PROP
                        }
                    />
                }
                {propertyValue}
            </SelectionWrapper>
        </div>
    );
};

function JsonNodeExpander({ toggleExpand, isExpanded }: { toggleExpand: () => void; isExpanded: boolean }) {
    return (
        <Icon
            name="chevronRight"
            svgClasses={classnames(styles.expander, isExpanded && styles.active)}
            onClick={toggleExpand}
        />
    );
}

function PropertyDeclaration({
    propName,
    tsType,
    propDesc,
    showTypeAsDiscriminatorValue,
    isExpanded,
    expandable,
    toggleExpand,
    onSelection,
    style = 'propertyName',
}: {
    propName: string;
    tsType: string | null;
    propDesc: { required: boolean };
    showTypeAsDiscriminatorValue?: boolean;
    isExpanded: boolean;
    expandable: boolean;
    toggleExpand: () => void;
    onSelection: () => void;
    style?: string;
}) {
    const { required } = propDesc;
    return (
        <>
            {isExpanded && <div className={styles.expanderBar}></div>}
            <span className={classnames('token', 'name', styles[style])}>
                {expandable && <JsonNodeExpander isExpanded={isExpanded} toggleExpand={toggleExpand} />}
                <span onClick={onSelection} onDoubleClick={toggleExpand}>
                    {propName}
                </span>
            </span>
            {!HIDE_TYPES && (
                <>
                    <span className={classnames('token', 'operator')}>: </span>
                    {tsType && <span className={classnames('token', 'builtin')}>{tsType}</span>}
                </>
            )}
            {showTypeAsDiscriminatorValue && (
                <>
                    {` = `}
                    <DiscriminatorType discriminatorType={tsType!} />
                </>
            )}
        </>
    );
}

function PrimitiveType({ desc }: { desc: JsonPrimitiveProperty }) {
    if (desc.aliasType) {
        return (
            <>
                <span className={classnames('token', 'comment')}>/* {desc.aliasType} */</span>
                {!HIDE_TYPES && <span className={classnames('token', 'builtin')}>{desc.tsType}</span>}
            </>
        );
    }

    return HIDE_TYPES ? null : <span className={classnames('token', 'builtin')}>{desc.tsType}</span>;
}

function NestedObject({ desc, path }: { desc: JsonObjectProperty; path: string[] }) {
    return (
        <>
            <span className={classnames('token', 'punctuation')}>{' { '}</span>
            <div className={styles.jsonObject} role="presentation">
                <ModelSnippet model={desc.model} path={path}></ModelSnippet>
            </div>
            <span className={classnames('token', 'punctuation')}>{'}'}</span>
        </>
    );
}

function CollapsedNestedObject({ toggleExpand }: { toggleExpand: () => void }) {
    return (
        <span onClick={toggleExpand}>
            <span className={classnames('token', 'punctuation')}>{' {'}</span>
            <span className={classnames('token', 'operator')}> ... </span>
            <span className={classnames('token', 'punctuation')}>{'}'}</span>
        </span>
    );
}

function ArrayType({ desc, path }: { desc: JsonArray; path: string[] }) {
    let arrayElementRendering;
    let arrayBracketMode = 'surround';

    switch (desc.elements.type) {
        case 'primitive':
            arrayBracketMode = 'none';
            arrayElementRendering = null;
            break;
        case 'nested-object':
            arrayElementRendering = (
                <>
                    <span className={classnames('token', 'punctuation')}>{'{ '}</span>
                    <div className={styles.jsonObject} role="presentation">
                        <ModelSnippet model={desc.elements.model} path={path}></ModelSnippet>
                    </div>
                    <span className={classnames('token', 'punctuation')}>{'}'}</span>
                </>
            );
            break;
        case 'union':
            arrayElementRendering = (
                <>
                    <ModelSnippet model={desc.elements} path={path}></ModelSnippet>
                </>
            );
            break;
        default:
            // eslint-disable-next-line no-console
            console.warn(`AG Docs - unhandled sub-type: ${desc['type']}`);
    }

    return (
        <>
            {arrayBracketMode === 'surround' && (
                <span className={classnames('token', 'punctuation')}> {'['.repeat(desc.depth)}</span>
            )}
            {arrayElementRendering}
            {arrayBracketMode === 'surround' && (
                <span className={classnames('token', 'punctuation')}>{']'.repeat(desc.depth)}</span>
            )}
            {arrayBracketMode === 'after' && (
                <span className={classnames('token', 'punctuation')}>{'[]'.repeat(desc.depth)}</span>
            )}
        </>
    );
}

function FunctionFragment({ desc, path }: { desc: JsonFunction; path: string[] }) {
    if (isSimpleFunction(desc)) {
        return null;
    }

    const paramEntries = Object.entries(desc.parameters);
    const singleParameter = paramEntries.length === 1;
    return (
        <>
            <span className={classnames('token', 'punctuation')}> (</span>
            <div className={styles.jsonObject} role="presentation">
                {paramEntries.map(([prop, model], idx) => (
                    <Fragment key={prop}>
                        <PropertySnippet
                            propName={prop}
                            desc={model.desc}
                            meta={model}
                            path={path}
                            forceInitiallyExpanded={singleParameter}
                        ></PropertySnippet>
                        {idx + 1 < paramEntries.length && (
                            <span className={classnames('token', 'punctuation')}>, </span>
                        )}
                    </Fragment>
                ))}
            </div>
            <span className={classnames('token', 'punctuation')}>)</span>
            <span className={classnames('token', 'operator')}>{' => '}</span>
            <span className={classnames('token', 'builtin')}>{desc.returnType.tsType}</span>
        </>
    );
}

function isSimpleUnion(desc: JsonUnionType) {
    return desc.options.every((opt) => opt.type === 'primitive');
}

function isSimpleFunction(desc: JsonFunction) {
    return Object.entries(desc.parameters).every(([_, type]) => type.desc.type === 'primitive');
}

function isExpandedInitially(propName: string, path: string[], config: JsObjectPropertiesViewConfig) {
    if (config.expandAll) {
        return true;
    }

    const currentPath = path.join('.').replace(/\.\[/g, '[').replace(/'/g, '');
    return (
        config.expandedProperties?.includes(propName) ??
        config.expandedPaths?.some((p) => p.startsWith(currentPath)) ??
        DEFAULT_JSON_NODES_EXPANDED
    );
}

export function buildObjectIndent(level: number): string {
    return '  '.repeat(level);
}

export function ObjectBreadcrumb({
    breadcrumbs,
    bodyContent,
    model,
}: {
    breadcrumbs: string[];
    bodyContent: () => any;
    model: JsonModel;
}) {
    const { handleSelection, isSelected } = useContext(SelectionContext);
    const selection = getTopSelection({
        model,
        hideChildren: true,
    });
    const handleTopObjectSelection = () => {
        handleSelection && handleSelection(selection);
    };
    const SelectionWrapper = isSelected(selection) ? Highlight : Fragment;

    return (
        <>
            {breadcrumbs.length > 0 && (
                <>
                    <div role="presentation">
                        <span className={styles.topBreadcrumb} onClick={handleTopObjectSelection}>
                            <SelectionWrapper>
                                <span>{breadcrumbs[0]}</span>
                            </SelectionWrapper>
                        </span>
                        : {'{'}
                    </div>
                </>
            )}
            {breadcrumbs.length > 1 ? (
                <div className={styles.jsonObject} role="presentation">
                    <div role="presentation">...</div>
                    {<ObjectBreadcrumb breadcrumbs={breadcrumbs.slice(1)} bodyContent={bodyContent} model={model} />}
                </div>
            ) : (
                bodyContent()
            )}
            {breadcrumbs.length > 0 && <div>{'}'}</div>}
        </>
    );
}
