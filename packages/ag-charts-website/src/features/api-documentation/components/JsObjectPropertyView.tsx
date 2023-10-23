import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import classnames from 'classnames';
import { useContext } from 'react';

import type { JsObjectSelection, JsObjectSelectionProperty, JsObjectSelectionUnionNestedObject } from '../types';
import { convertMarkdown, formatPropertyDocumentation, removeDefaultValue } from '../utils/documentationHelpers';
import { FrameworkContext } from '../utils/frameworkContext';
import { getSelectionReferenceId } from '../utils/getObjectReferenceId';
import { getPropertyType } from '../utils/getPropertyType';
import { JsObjectPropertiesViewConfigContext } from '../utils/jsObjectPropertiesViewConfigContext';
import type { JsonArray, JsonModel, JsonModelProperty, JsonObjectProperty, JsonUnionType } from '../utils/model';
import { getUnionPathInfo } from '../utils/modelPath';
import { OptionsDataContext } from '../utils/optionsDataContext';
import { removeTopLevelPath } from '../utils/removeTopLevelPath';
import styles from './ApiDocumentation.module.scss';
import { HeadingPath } from './HeadingPath';
import { MetaList } from './MetaList';
import { SplitName } from './SplitName';

interface Props {
    selection: JsObjectSelection;
    parentName?: string;
    isRoot?: boolean;
}

function NameHeading({ id, name, path }: { id: string; name?: string; path: string[] }) {
    const keepTopLevelIfOnlyItem = !name;
    const headingPath = removeTopLevelPath({ path, keepTopLevelIfOnlyItem });
    const pathSeparator = name && headingPath.length > 0 ? '.' : '';

    return (
        <h6 className={classnames(styles.name, 'side-menu-exclude')}>
            <HeadingPath path={path} keepTopLevelIfOnlyItem={keepTopLevelIfOnlyItem} />
            <span>
                {pathSeparator}
                <SplitName>{name}</SplitName>
            </span>
            {/* Hide, until nav support is added <LinkIcon href={`#${id}`} /> */}
        </h6>
    );
}

function Actions({ propName }: { propName?: string }) {
    const framework = useContext(FrameworkContext);
    const optionsData = useContext(OptionsDataContext);
    const config = useContext(JsObjectPropertiesViewConfigContext);
    const actionsData = optionsData[propName];
    const more = actionsData?.more;
    const hasMore = Boolean(more);

    if (!actionsData || !hasMore) {
        return null;
    }

    return (
        <div className={styles.actions}>
            {hasMore && more.url && !config.hideMore && (
                <span>
                    <span className="text-secondary">See:</span>{' '}
                    <a
                        href={getExamplePageUrl({
                            path: more.url,
                            framework,
                        })}
                    >
                        {more.name}
                    </a>
                </span>
            )}
        </div>
    );
}

function PrimitivePropertyView({
    id,
    name,
    model,
    path,
}: {
    id: string;
    name: string;
    model: JsonModelProperty;
    path: string[];
}) {
    const framework = useContext(FrameworkContext);
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const propertyType = getPropertyType(
        (model as any).type === 'primitive' ? (model as any).tsType : model.desc.tsType
    );
    const description = convertMarkdown(formattedDocumentation, framework);
    return (
        <tr id={id}>
            <td role="presentation" className={styles.leftColumn}>
                <NameHeading id={id} name={name} path={path} />
                <MetaList propertyType={propertyType} model={model} description={description} />
            </td>
            <td className={styles.rightColumn}>
                <div
                    role="presentation"
                    className={styles.description}
                    dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                ></div>
                <Actions propName={name} />
            </td>
        </tr>
    );
}

function NestedObjectProperties({
    parentName,
    parentPath,
    properties,
    onlyShowToDepth,
    isRoot,
}: {
    parentName?: string;
    parentPath: string[];
    properties: JsonModel['properties'];
    onlyShowToDepth?: number;
    isRoot?: boolean;
}) {
    return (
        <>
            {Object.entries(properties).map(([propName, model]) => {
                const selection: JsObjectSelectionProperty = {
                    type: 'property',
                    propName,
                    path: parentPath,
                    model,
                    onlyShowToDepth,
                    isRoot,
                };
                return <JsObjectPropertyView key={propName} selection={selection} parentName={parentName} />;
            })}
        </>
    );
}

function NestedObjectPropertyView({
    id,
    name,
    path,
    model,
    onlyShowToDepth,
    isRoot,
}: {
    id: string;
    name?: string;
    path: string[];
    model: JsonModelProperty;
    onlyShowToDepth?: number;
    isRoot?: boolean;
}) {
    const framework = useContext(FrameworkContext);
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);
    const {
        model: { properties },
    } = model.desc as JsonObjectProperty;
    const nestedObjectPropertiesPath = name ? path.concat(name) : path;
    const showChildren = onlyShowToDepth === undefined ? true : path.length < onlyShowToDepth;
    const showTopLevel = path.length > 0 || isRoot;

    return (
        <>
            {showTopLevel && (
                <tr id={id}>
                    <td role="presentation" className={styles.leftColumn}>
                        <NameHeading id={id} name={name} path={path} />
                        <MetaList propertyType={propertyType} model={model} description={description} />
                    </td>
                    <td className={styles.rightColumn}>
                        <div
                            role="presentation"
                            className={styles.description}
                            dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                        ></div>
                        <Actions propName={name} />
                    </td>
                </tr>
            )}
            {showChildren && (
                <NestedObjectProperties
                    parentName={name}
                    properties={properties}
                    parentPath={nestedObjectPropertiesPath}
                    onlyShowToDepth={onlyShowToDepth}
                />
            )}
        </>
    );
}

function UnionProperties({
    parentName,
    parentPath,
    elements,
    onlyShowToDepth,
    isRoot,
}: {
    parentName: string;
    parentPath: string[];
    elements: JsonUnionType;
    onlyShowToDepth?: number;
    isRoot?: boolean;
}) {
    return elements.options.map((model, index) => (
        <JsObjectPropertyView
            key={JSON.stringify(model)}
            parentName={parentName}
            selection={{ type: 'unionNestedObject', path: parentPath, index, model, onlyShowToDepth, isRoot }}
        />
    ));
}

function NestedArrayProperties({
    parentId,
    parentName,
    parentPath,
    parentModel,
    elements,
    onlyShowToDepth,
    isRoot,
}: {
    parentId: string;
    parentName: string;
    parentPath: string[];
    parentModel: JsonModelProperty;
    elements: JsonArray['elements'];
    onlyShowToDepth?: number;
    isRoot?: boolean;
}) {
    const { type } = elements;

    if (type === 'primitive') {
        return <PrimitivePropertyView id={parentId} model={parentModel} name={parentName} path={parentPath} />;
    } else if (type === 'nested-object') {
        const {
            model: { properties },
        } = elements;
        return (
            <NestedObjectProperties
                parentName={parentName}
                properties={properties}
                parentPath={parentPath}
                onlyShowToDepth={onlyShowToDepth}
                isRoot={isRoot}
            />
        );
    } else if (type === 'union') {
        return (
            <UnionProperties
                parentName={parentName}
                elements={elements}
                parentPath={parentPath}
                onlyShowToDepth={onlyShowToDepth}
                isRoot={isRoot}
            />
        );
    } else {
        throw new Error(`Unhandled array element type: ${type}`);
    }
}

function ArrayPropertyView({
    id,
    name,
    path,
    model,
    onlyShowToDepth,
    isRoot,
}: {
    id: string;
    name: string;
    path: string[];
    model: JsonModelProperty;
    onlyShowToDepth?: number;
    isRoot?: boolean;
}) {
    const framework = useContext(FrameworkContext);
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);
    const { elements } = model.desc as JsonArray;
    const nestedArrayPropertiesPath = name ? path.concat(name) : path;
    const showChildren = onlyShowToDepth === undefined ? true : path.length < onlyShowToDepth;
    const showTopLevel = path.length > 0 || isRoot;

    return (
        <>
            {showTopLevel && (
                <tr id={id}>
                    <td role="presentation" className={styles.leftColumn}>
                        <NameHeading id={id} name={name} path={path} />
                        <MetaList propertyType={propertyType} model={model} description={description} />
                    </td>
                    <td className={styles.rightColumn}>
                        <div
                            role="presentation"
                            className={styles.description}
                            dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                        ></div>
                        <Actions propName={name} />
                    </td>
                </tr>
            )}
            {showChildren && elements.type !== 'primitive' && (
                <NestedArrayProperties
                    parentId={id}
                    parentName={name}
                    parentPath={nestedArrayPropertiesPath}
                    parentModel={model}
                    elements={elements}
                    onlyShowToDepth={onlyShowToDepth}
                    isRoot={isRoot}
                />
            )}
        </>
    );
}

function FunctionPropertyView({
    id,
    name,
    model,
    path,
}: {
    id: string;
    name: string;
    model: JsonModelProperty;
    path: string[];
}) {
    const framework = useContext(FrameworkContext);
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);

    return (
        <tr id={id}>
            <td role="presentation" className={styles.leftColumn}>
                <NameHeading id={id} name={name} path={path} />
                <MetaList propertyType={propertyType} model={model} description={description} />
            </td>
            <td className={styles.rightColumn}>
                <div
                    role="presentation"
                    className={styles.description}
                    dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                ></div>
                <Actions propName={name} />
            </td>
        </tr>
    );
}

export function JsObjectPropertyView({ selection, parentName }: Props) {
    const { type, path, model, onlyShowToDepth, isRoot } = selection;
    const id = getSelectionReferenceId(selection);

    if (type === 'model') {
        const { properties } = model;
        return (
            <NestedObjectProperties
                parentName={parentName}
                parentPath={path}
                properties={properties}
                onlyShowToDepth={onlyShowToDepth}
                isRoot={isRoot}
            />
        );
    } else if (type === 'property') {
        const { propName } = selection as JsObjectSelectionProperty;
        const propertyType = model.desc.type;
        const propertyId = id!;
        if (propertyType === 'primitive') {
            return <PrimitivePropertyView id={propertyId} model={model} name={propName} path={path} />;
        } else if (propertyType === 'nested-object') {
            return (
                <NestedObjectPropertyView
                    id={propertyId}
                    name={propName}
                    path={path}
                    model={model}
                    onlyShowToDepth={onlyShowToDepth}
                    isRoot={isRoot}
                />
            );
        } else if (propertyType === 'array') {
            return (
                <ArrayPropertyView
                    id={propertyId}
                    name={propName}
                    path={path}
                    model={model}
                    onlyShowToDepth={onlyShowToDepth}
                    isRoot={isRoot}
                />
            );
        } else if (propertyType === 'function') {
            return <FunctionPropertyView id={propertyId} model={model} name={propName} path={path} />;
        } else if (propertyType === 'union') {
            const elements = model.desc;
            return (
                <UnionProperties
                    parentName={propName}
                    elements={elements}
                    parentPath={path}
                    onlyShowToDepth={onlyShowToDepth}
                    isRoot={isRoot}
                />
            );
        }
    } else if (type === 'unionNestedObject') {
        const { index } = selection as JsObjectSelectionUnionNestedObject;
        const unionNestedObjectId = id!;
        const propertyType = model.type;
        const name = parentName!;

        if (propertyType === 'primitive') {
            return <PrimitivePropertyView id={unionNestedObjectId} model={model} name={name} path={path} />;
        } else if (propertyType === 'nested-object') {
            const nestedObjectModel = {
                desc: model,
            } as JsonModelProperty;

            const { pathItem } = getUnionPathInfo({
                model: model.model,
                index,
            });
            const nestedObjectPath = path.concat(pathItem);
            return (
                <NestedObjectPropertyView
                    id={unionNestedObjectId}
                    // NOTE: No `name`, as it's a union nested object
                    path={nestedObjectPath}
                    model={nestedObjectModel}
                    onlyShowToDepth={onlyShowToDepth}
                    isRoot={isRoot}
                />
            );
        } else if (propertyType === 'array') {
            return (
                <ArrayPropertyView
                    id={unionNestedObjectId}
                    name={name}
                    path={path}
                    model={model}
                    onlyShowToDepth={onlyShowToDepth}
                    isRoot={isRoot}
                />
            );
        }
    }

    throw new Error(`Unhandled JsObjectPropertyView type: ${type} (${path})`);
}
