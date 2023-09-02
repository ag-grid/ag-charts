import classnames from 'classnames';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import type { Config, DocEntryMap, SectionProps } from '../types';
import { convertMarkdown, getLongestNameLength } from '../utils/documentationHelpers';
import { Breadcrumbs } from './Breadcrumbs';
import { Property } from './Property';
import styles from './ApiDocumentation.module.scss';
import { Icon } from '@components/icon/Icon';
import { ObjectCodeSample } from './ObjectCodeSample';
import type { FunctionComponent } from 'react';
import { LinkIcon } from '@components/link-icon/LinkIcon';

export const Section: FunctionComponent<SectionProps> = ({
    framework,
    title,
    properties,
    config = {} as Config,
    breadcrumbs = {},
    names = [],
}): any => {
    const { meta } = properties;
    const displayName = (meta && meta.displayName) || title;
    if (meta && meta.isEvent) {
        // Support event display for a section
        config = { ...config, isEvent: true };
    }
    if (meta && meta.suppressMissingPropCheck) {
        config = { ...config, suppressMissingPropCheck: true };
    }

    breadcrumbs[title] = displayName;

    const breadcrumbKeys = Object.keys(breadcrumbs);
    const id = breadcrumbKeys.join('.');

    let header = null;

    const pattern = new RegExp(config.namePattern || '.*');

    if (!config.isSubset) {
        const headerLevel = config.headerLevel || breadcrumbKeys.length + 1;
        const HeaderTag: any = `h${headerLevel}`;

        // We use a plugin (gatsby-remark-autolink-headers) to insert links for all the headings in Markdown
        // We manually add the element here ourselves to match
        header = (
            <>
                {!config.hideHeader && (
                    <HeaderTag id={`reference-${id}`} style={{ position: 'relative' }}>
                        {displayName}
                        <LinkIcon href={`#reference-${id}`} />
                    </HeaderTag>
                )}
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                {meta && meta.description && (
                    <p dangerouslySetInnerHTML={{ __html: convertMarkdown(meta.description, framework) }}></p>
                )}
                {meta && meta.page && (
                    <p>
                        See{' '}
                        <a
                            href={getExamplePageUrl({
                                path: meta.page.url,
                                framework,
                            })}
                        >
                            {meta.page.name}
                        </a>{' '}
                        for more information.
                    </p>
                )}
                {config.showSnippets && names.length < 1 && (
                    <ObjectCodeSample framework={framework} id={id} breadcrumbs={breadcrumbs} properties={properties} />
                )}
            </>
        );
    }

    if (Object.keys(properties).filter((p) => p !== 'meta').length < 1) {
        return null;
    }

    const rows = [];
    const objectProperties: DocEntryMap = {};

    let leftColumnWidth = 25;
    const processed = new Set();
    Object.entries(properties)
        .sort((a, b) => {
            return config.sortAlphabetically ? (a[0] < b[0] ? -1 : 1) : 0;
        })
        .forEach(([name, definition]) => {
            if (name === 'meta' || (names.length > 0 && !names.includes(name))) {
                return;
            }
            processed.add(name);

            if (!pattern.test(name)) {
                return;
            }

            const length = getLongestNameLength(name);
            if (leftColumnWidth < length) {
                leftColumnWidth = length;
            }
            if (config.maxLeftColumnWidth < leftColumnWidth) {
                leftColumnWidth = config.maxLeftColumnWidth;
            }

            const gridOptionProperty = config.lookups?.codeLookup[name];

            rows.push(
                <Property
                    key={name}
                    framework={framework}
                    id={id}
                    name={name}
                    definition={definition}
                    config={{
                        ...config,
                        gridOpProp: gridOptionProperty,
                        interfaceHierarchyOverrides: definition.interfaceHierarchyOverrides,
                    }}
                />
            );

            if (typeof definition !== 'string' && definition.meta) {
                // store object property to process later
                objectProperties[name] = definition;
            }
        });

    if (names.length > 0) {
        // Validate we found properties for each provided name
        names.forEach((n) => {
            if (!processed.has(n)) {
                throw new Error(
                    `Failed to find a property named ${n} that we requested under section ${title}. Check if you passed the correct name or if the name appears in the source json file that you are using.`
                );
            }
        });
    }

    return (
        <div className={styles.apiReferenceOuter}>
            {header}
            <table
                className={classnames(styles.reference, styles.apiReference)}
                style={config.overrideBottomMargin ? { marginBottom: config.overrideBottomMargin } : {}}
            >
                <colgroup>
                    <col></col>
                    <col></col>
                </colgroup>
                <tbody>{rows}</tbody>
            </table>
            {Object.entries(objectProperties).map(([name, definition]) => (
                <Section
                    key={name}
                    framework={framework}
                    title={name}
                    properties={definition}
                    config={{ ...config, isSubset: false }}
                    breadcrumbs={{ ...breadcrumbs }}
                />
            ))}
        </div>
    );
};
