import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import { LinkIcon } from '@ag-website-shared/components/link-icon/LinkIcon';
import styles from '@ag-website-shared/components/reference-documentation/ApiReference.module.scss';
import { useScrollToAnchor } from '@ag-website-shared/utils/navigation';
import classnames from 'classnames';
import { type AllHTMLAttributes, type FunctionComponent, type ReactNode } from 'react';

import { cleanupName } from '../apiReferenceHelpers';

interface PropertyTitleOptions {
    name: string;
    anchorId: string;
    prefixPath?: string[];
    required?: boolean;
}

export type CollapsibleType = 'childrenProperties' | 'code' | 'none';

export function PropertyTitle({ name, anchorId, prefixPath, required }: PropertyTitleOptions) {
    const scrollToAnchor = useScrollToAnchor();

    return (
        <div className={classnames(styles.name, 'side-menu-exclude')}>
            <PropertyNamePrefix prefixPath={prefixPath} />
            <PropertyName isRequired={required}>{name}</PropertyName>
            <LinkIcon
                href={`#${anchorId}`}
                onClick={scrollToAnchor}
                className={styles.linkIcon}
                aria-label={`Link to ${name} property`}
            />
        </div>
    );
}

export function PropertyNamePrefix({
    as: Component = PropertyName,
    prefixPath,
}: {
    as?: string | FunctionComponent<AllHTMLAttributes<Element>>;
    prefixPath?: string[];
}) {
    const parentPrefix = prefixPath?.join('.');
    return (
        <>
            {parentPrefix && (
                <Component className={styles.parentProperties}>{`${cleanupName(parentPrefix)}.`}</Component>
            )}
        </>
    );
}

function CodeCollapsibleButton({
    name,
    isExpanded,
    onClick,
    collapsibleType,
}: {
    name: string;
    isExpanded?: boolean;
    onClick?: () => void;
    collapsibleType?: CollapsibleType;
}) {
    if (collapsibleType !== 'code') {
        return null;
    }

    return (
        <button
            className={classnames(styles.seeMore, 'button-style-none', {
                [styles.isExpanded]: isExpanded,
            })}
            onClick={onClick}
            aria-label={`See more details about ${name}`}
        >
            <Icon className={`${styles.chevron} ${isExpanded ? 'expandedIcon' : ''}`} name="chevronDown" />
        </button>
    );
}

export function PropertyType({
    name,
    type,
    typeUrl,
    defaultValue,
    collapsibleType,
    isExpanded,
    onCollapseClick,
}: {
    name: string;
    type: string;
    typeUrl?: string;
    defaultValue?: string;
    collapsibleType?: CollapsibleType;
    isExpanded?: boolean;
    onCollapseClick?: () => void;
}) {
    const isCollapsibleCode = collapsibleType === 'code';

    return (
        <div className={styles.metaItem}>
            <div className={styles.metaRow}>
                <CodeCollapsibleButton
                    name={name}
                    isExpanded={isExpanded}
                    onClick={onCollapseClick!}
                    collapsibleType={collapsibleType}
                />
                {typeUrl && isCollapsibleCode ? (
                    <a
                        className={styles.metaValue}
                        href={typeUrl}
                        target={typeUrl.startsWith('http') ? '_blank' : '_self'}
                        rel="noreferrer"
                    >
                        {type}
                    </a>
                ) : (
                    <span
                        onClick={onCollapseClick}
                        className={classnames(styles.metaValue, {
                            [styles.isExpandable]: isCollapsibleCode,
                        })}
                    >
                        {type}
                    </span>
                )}
            </div>
            {defaultValue != null && (
                <div className={styles.metaItem}>
                    <span className={classnames(styles.metaValue, styles.defaultValue)}>
                        <span>default: </span>
                        {defaultValue}
                    </span>
                </div>
            )}

            {/* TODO: Add this for grid, when this component is shared
            {isInitial && (
                <div className={classnames(styles.metaItem)}>
                    <a
                        className={styles.metaValue}
                        href={urlWithPrefix({
                            url: './grid-interface/#initial-grid-options',
                            framework,
                        })}
                    >
                        Initial
                    </a>
                </div>
            )} */}
        </div>
    );
}

function PropertyName({
    as: Component = 'span',
    splitRegex = /(?=[A-Z]|\s+\|\s+)/,
    isRequired,
    children,
    ...props
}: AllHTMLAttributes<Element> & { as?: string; isRequired?: boolean; splitRegex?: RegExp }) {
    if (typeof children !== 'string') {
        // eslint-disable-next-line no-console
        console.warn('PropertyName children must be of type string', children);
        return <Component {...props} />;
    }
    return (
        <Component {...props}>
            {wbrInject(children, splitRegex)}
            {isRequired && <span className={styles.required}>required</span>}
        </Component>
    );
}

function wbrInject(text: string, splitRegex: RegExp) {
    return text
        .split(splitRegex)
        .reduce<ReactNode[]>((result, part, index) => result.concat(index ? [<wbr key={index} />, part] : part), []);
}
