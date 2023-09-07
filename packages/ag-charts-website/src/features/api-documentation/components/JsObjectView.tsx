import { Fragment, useState, type FunctionComponent, createContext, useContext } from 'react';
import type { JsObjectViewProps } from '../types';
import classnames from 'classnames';
import styles from './JsObjectView.module.scss';
import type {
    JsonArray,
    JsonFunction,
    JsonModel,
    JsonObjectProperty,
    JsonPrimitiveProperty,
    JsonProperty,
    JsonUnionType,
} from '../utils/model';
import { Icon } from '@components/icon/Icon';
import { getTopSelection, getUnionPathInfo } from '../utils/modelPath';

const SelectionContext = createContext<{ handleSelection?: JsObjectViewProps['handleSelection'] }>({});

const DEFAULT_JSON_NODES_EXPANDED = false;
const HIDE_TYPES = true;
const DEFAULT_ENDING_PUNCTUATION = ',';

type Config = {
    includeDeprecated?: boolean;
    excludeProperties?: string[];
    expandedProperties?: string[];
    expandedPaths?: string[];
    expandAll?: boolean;
    lookupRoot?: string;
};

export interface ExpandableSnippetParams {
    interfacename: string;
    overridesrc?: string;
    breadcrumbs?: string[];
    config?: Config;
}

interface ModelSnippetWithBreadcrumbsParams {
    framework?: string;
    breadcrumbs?: string[];
    model: JsonModel;
    config: Config;
    topBreakcrumbOnClick: () => void;
}

export const JsObjectView: FunctionComponent<JsObjectViewProps> = ({
    model,
    breadcrumbs = [],
    config = {},
    handleSelection,
}) => {
    const handleTopObjectSelection = () => {
        handleSelection &&
            handleSelection(
                getTopSelection({
                    model,
                    hideChildren: true,
                })
            );
    };
    return (
        <div className={styles.expandableSnippet} role="presentation">
            <pre className={classnames('code', 'language-ts')}>
                <code className={'language-ts'}>
                    <SelectionContext.Provider value={{ handleSelection }}>
                        <ModelSnippetWithBreadcrumbs
                            breadcrumbs={breadcrumbs}
                            model={model}
                            config={config}
                            topBreakcrumbOnClick={handleTopObjectSelection}
                        />
                    </SelectionContext.Provider>
                </code>
            </pre>
        </div>
    );
};

const ModelSnippetWithBreadcrumbs: React.FC<ModelSnippetWithBreadcrumbsParams> = ({
    model,
    breadcrumbs = [],
    config = {},
    topBreakcrumbOnClick,
}) => {
    return (
        <ObjectBreadcrumb
            breadcrumbs={breadcrumbs}
            bodyContent={() => (
                <>
                    <div className={styles.jsonObject} role="presentation">
                        <ModelSnippet model={model} config={config} path={[]}></ModelSnippet>
                    </div>
                </>
            )}
            topBreakcrumbOnClick={topBreakcrumbOnClick}
        />
    );
};

interface ModelSnippetParams {
    model: JsonModel | JsonUnionType;
    skip?: string[];
    closeWith?: string;
    path: string[];
    config: Config;
}

const ModelSnippet: React.FC<ModelSnippetParams> = ({
    model,
    closeWith = DEFAULT_ENDING_PUNCTUATION,
    path,
    config = {},
}) => {
    if (model.type === 'model') {
        const propertiesRendering = Object.entries(model.properties)
            .map(([propName, propInfo]) => {
                if (config.excludeProperties?.includes(propName)) {
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
                        closeWith={closeWith}
                        config={config}
                    />
                );
            })
            .filter((v) => !!v);
        return <>{propertiesRendering}</>;
    } else if (model.type === 'union') {
        return <Union model={model} closeWith={closeWith} path={path} config={config} />;
    }

    return null;
};

function PrimitiveUnionOption({
    opt,
    closeWith,
    last,
}: {
    opt: JsonPrimitiveProperty;
    closeWith: string;
    last: boolean;
}) {
    return (
        <>
            {<PrimitiveType desc={opt} />}
            {!last && <span className={classnames('token', 'operator')}> | </span>}
            {last && closeWith && <span className={classnames('token', 'punctuation')}>{closeWith}</span>}
        </>
    );
}

function Union({
    model,
    closeWith,
    path,
    config,
}: {
    model: JsonUnionType;
    closeWith: string;
    path: string[];
    config: Config;
}) {
    if (model.options.every((opt) => opt.type === 'primitive')) {
        const lastIdx = model.options.length - 1;
        return model.options.map((opt, idx) => {
            return opt.type === 'primitive' ? (
                <PrimitiveUnionOption key={idx} closeWith={closeWith} opt={opt} last={idx >= lastIdx} />
            ) : null;
        });
    }

    return (
        <div className={styles.jsonObjectUnion} role="presentation">
            {model.options
                .map((desc, idx) => {
                    const lastIdx = model.options.length - 1;
                    switch (desc.type) {
                        case 'primitive':
                            return <PrimitiveUnionOption opt={desc} closeWith={closeWith} last={idx >= lastIdx} />;
                        case 'array':
                            break;
                        case 'nested-object':
                            return (
                                <UnionNestedObject
                                    desc={desc}
                                    index={idx}
                                    last={idx >= lastIdx}
                                    closeWith={closeWith}
                                    path={path}
                                    config={config}
                                />
                            );
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

function DiscriminatorType({ discriminatorType }: { discriminatorType: string }) {
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

function UnionNestedObject({
    desc,
    index,
    last,
    closeWith,
    path,
    config,
}: {
    desc: JsonObjectProperty;
    index: number;
    last: boolean;
    closeWith: string;
    path: string[];
    config: Config;
}) {
    const { pathItem, discriminatorType, discriminatorProp, discriminator } = getUnionPathInfo({
        model: desc.model,
        index,
    });
    const unionPath = path.concat(pathItem);
    const expandedInitially = isExpandedInitially(discriminatorType || String(index), unionPath, config);
    const [isExpanded, setExpanded] = useState(expandedInitially);
    const { handleSelection } = useContext(SelectionContext);
    const handleUnionNestedObjectSelection = () => {
        handleSelection &&
            handleSelection({
                type: 'unionNestedObject',
                index,
                // NOTE: Not passing in `unionPath`, as selection should handle how to determine the path
                path,
                model: desc,
            });
    };
    const toggleExpand = () => {
        setExpanded((expanded) => !expanded);
    };

    if (discriminatorType) {
        return (
            <Fragment key={discriminatorType}>
                <span className={styles.expandable}>
                    {isExpanded && <div className={styles.expanderBar}></div>}
                    <span className={classnames('token', 'punctuation')}>
                        {isExpanded && <JsonNodeExpander isExpanded={isExpanded} toggleExpand={toggleExpand} />}
                        {' { '}
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
                            />{' '}
                            = <DiscriminatorType discriminatorType={discriminatorType} />
                        </>
                    )}
                    {!isExpanded && <span className={classnames('token', 'punctuation')}>{closeWith}</span>}
                    {isExpanded ? (
                        <div className={styles.jsonObject} onClick={(e) => e.stopPropagation()} role="presentation">
                            <ModelSnippet model={desc.model} config={config} path={unionPath}></ModelSnippet>
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
                    {!last && (
                        <span className={classnames('token', 'operator')}>
                            {' '}
                            | <br />
                        </span>
                    )}
                    {last && closeWith && <span className={classnames('token', 'punctuation')}>{closeWith}</span>}
                </span>
            </Fragment>
        );
    }

    return (
        <Fragment key={index}>
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
                        <ModelSnippet model={desc.model} config={config} path={unionPath}></ModelSnippet>
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
                {!last && (
                    <span className={classnames('token', 'operator')}>
                        {' '}
                        | <br />
                    </span>
                )}
                {last && closeWith && <span className={classnames('token', 'punctuation')}>{closeWith}</span>}
            </span>
        </Fragment>
    );
}

interface PropertySnippetParams {
    propName: string;
    desc: JsonProperty;
    meta: Omit<JsonModel['properties'][number], 'desc'>;
    forceInitiallyExpanded?: boolean;
    needsClosingSemi?: boolean;
    path: string[];
    closeWith: string;
    config: Config;
}

const PropertySnippet: React.FC<PropertySnippetParams> = ({
    propName,
    desc,
    meta,
    forceInitiallyExpanded,
    needsClosingSemi = true,
    path,
    closeWith,
    config,
}) => {
    const propPath = path.concat(propName);
    const expandedInitially = forceInitiallyExpanded || isExpandedInitially(propName, propPath, config);
    const [isJSONNodeExpanded, setJSONNodeExpanded] = useState(expandedInitially);
    const { handleSelection } = useContext(SelectionContext);
    const handlePropertySelection = () => {
        handleSelection && handleSelection({ type: 'property', propName, path, model: meta });
    };
    const toggleExpand = () => {
        if (!expandable) {
            return;
        }

        setJSONNodeExpanded((expanded) => !expanded);
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
            propertyRendering = <ArrayType desc={desc} path={propPath} config={config} />;
            collapsePropertyRendering = desc.elements.type !== 'primitive' && (
                <span onClick={toggleExpand}>
                    <span className={classnames('token', 'punctuation')}> {'['.repeat(desc.depth)}</span>
                    <span className={classnames('token', 'operator')}> ... </span>
                    <span className={classnames('token', 'punctuation')}>{']'.repeat(desc.depth)}</span>
                </span>
            );
            break;
        case 'nested-object':
            propertyRendering = <NestedObject desc={desc} path={propPath} config={config} />;
            collapsePropertyRendering = <CollapsedNestedObject toggleExpand={toggleExpand} />;
            break;
        case 'union':
            const simpleUnion = isSimpleUnion(desc);
            propertyRendering = !simpleUnion ? (
                <ModelSnippet model={desc} config={config} path={propPath}></ModelSnippet>
            ) : null;
            collapsePropertyRendering = !simpleUnion ? <></> : null;
            needsClosingSemi = simpleUnion;
            break;
        case 'function':
            propertyRendering = isJSONNodeExpanded ? (
                <FunctionFragment desc={desc} path={propPath} closeWith={closeWith} config={config} />
            ) : null;
            collapsePropertyRendering = <CollapsedFunction desc={desc} />;
            renderTsType = isSimpleFunction(desc);
            break;
        default:
            // eslint-disable-next-line no-console
            console.warn(`AG Docs - unhandled sub-type: ${desc['type']}`);
    }

    const expandable = !!collapsePropertyRendering;
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
            {
                <PropertyDeclaration
                    propName={propName}
                    tsType={renderTsType ? tsType : null}
                    propDesc={meta}
                    isExpanded={isJSONNodeExpanded}
                    expandable={expandable}
                    toggleExpand={toggleExpand}
                    onSelection={handlePropertySelection}
                />
            }
            {!isJSONNodeExpanded && collapsePropertyRendering ? (
                collapsePropertyRendering
            ) : (
                <span className={classnames(styles['unexpandable'])} onClick={(e) => e.stopPropagation()}>
                    {propertyRendering}
                </span>
            )}
            {(!isJSONNodeExpanded || needsClosingSemi) && (
                <span className={classnames('token', 'punctuation')}>{closeWith}</span>
            )}
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
    isExpanded,
    expandable,
    toggleExpand,
    onSelection,
    style = 'propertyName',
}: {
    propName: string;
    tsType: string | null;
    propDesc: { required: boolean };
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
                <span onClick={onSelection}>{propName}</span>
            </span>
            {!required && <span className={classnames('token', 'optional')}>?</span>}
            {!HIDE_TYPES && (
                <>
                    <span className={classnames('token', 'operator')}>: </span>
                    {tsType && <span className={classnames('token', 'builtin')}>{tsType}</span>}
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

function NestedObject({ desc, path, config }: { desc: JsonObjectProperty; path: string[]; config: Config }) {
    return (
        <>
            <span className={classnames('token', 'punctuation')}>{' { '}</span>
            <div className={styles.jsonObject} role="presentation">
                <ModelSnippet model={desc.model} config={config} path={path}></ModelSnippet>
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

function ArrayType({ desc, path, config }: { desc: JsonArray; path: string[]; config: Config }) {
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
                        <ModelSnippet model={desc.elements.model} path={path} config={config}></ModelSnippet>
                    </div>
                    <span className={classnames('token', 'punctuation')}>{'}'}</span>
                </>
            );
            break;
        case 'union':
            arrayElementRendering = (
                <>
                    <ModelSnippet model={desc.elements} closeWith={''} path={path} config={config}></ModelSnippet>
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

function CollapsedFunction({ desc }: { desc: JsonFunction }) {
    if (isSimpleFunction(desc)) {
        return null;
    }

    const paramEntries = Object.entries(desc.parameters);
    return (
        <>
            <span className={classnames('token', 'punctuation')}> (</span>
            {paramEntries.map(([name, type], idx) => (
                <Fragment key={name}>
                    <span className={classnames('token', 'name')}>{name}</span>
                    {!HIDE_TYPES && (
                        <>
                            <span className={classnames('token', 'punctuation')}>: </span>
                            <span className={classnames('token', 'builtin')}>{type.desc.tsType}</span>
                        </>
                    )}
                    {idx + 1 < paramEntries.length && <span className={classnames('token', 'punctuation')}>, </span>}
                </Fragment>
            ))}
            <span className={classnames('token', 'punctuation')}>)</span>
            <span className={classnames('token', 'operator')}>{' => '}</span>
            <span className={classnames('token', 'builtin')}>{desc.returnType.tsType}</span>
        </>
    );
}

function FunctionFragment({
    desc,
    path,
    closeWith,
    config,
}: {
    desc: JsonFunction;
    path: string[];
    closeWith: string;
    config: Config;
}) {
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
                            config={config}
                            forceInitiallyExpanded={singleParameter}
                            needsClosingSemi={false}
                            closeWith={closeWith}
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

function isExpandedInitially(propName: string, path: string[], config: Config) {
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
    topBreakcrumbOnClick,
}: {
    breadcrumbs: string[];
    bodyContent: () => any;
    topBreakcrumbOnClick?: () => void;
}) {
    return (
        <>
            {breadcrumbs.length > 0 && (
                <>
                    <div role="presentation">
                        <span className={styles.topBreadcrumb} onClick={topBreakcrumbOnClick}>
                            {breadcrumbs[0]}
                        </span>
                        : {'{'}
                    </div>
                </>
            )}
            {breadcrumbs.length > 1 ? (
                <div className={styles.jsonObject} role="presentation">
                    <div role="presentation">...</div>
                    {<ObjectBreadcrumb breadcrumbs={breadcrumbs.slice(1)} bodyContent={bodyContent} />}
                </div>
            ) : (
                bodyContent()
            )}
            {breadcrumbs.length > 0 && <div>{'}'}</div>}
        </>
    );
}
