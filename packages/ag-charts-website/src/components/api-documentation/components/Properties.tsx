import { Icon } from '@ag-website-shared/components/icon/Icon';
import { LinkIcon } from '@ag-website-shared/components/link-icon/LinkIcon';
import styles from '@ag-website-shared/components/reference-documentation/ApiReference.module.scss';
import { useScrollToAnchor } from '@ag-website-shared/utils/navigation';
import classnames from 'classnames';
import type { AllHTMLAttributes, FunctionComponent, ReactNode } from 'react';

import { cleanupName } from '../apiReferenceHelpers';

interface PropertyTitleOptions {
    name: string;
    anchorId: string;
    prefixPath?: string[];
    nameSeparator?: string;
    required?: boolean;
    hasChildProps?: boolean;
    isExpandable?: boolean;
    childPropsOnClick?: () => void;
}

export type CollapsibleType = 'childrenProperties' | 'code' | 'unionTypes' | 'none';

export function PropertyTitle({
    name,
    anchorId,
    prefixPath,
    nameSeparator,
    required,
    hasChildProps,
    isExpandable,
    childPropsOnClick,
}: PropertyTitleOptions) {
    const scrollToAnchor = useScrollToAnchor();

    const propName =
        hasChildProps || isExpandable ? (
            <span className={styles.propNameExpander} onClick={childPropsOnClick}>
                <Icon svgClasses={styles.propNameChevron} name="chevronRight" />
                <PropertyNamePrefix prefixPath={prefixPath} separator={nameSeparator} />
                <PropertyName>{name}</PropertyName>
            </span>
        ) : (
            <span>
                <PropertyNamePrefix prefixPath={prefixPath} separator={nameSeparator} />
                <PropertyName>{name}</PropertyName>
            </span>
        );

    return (
        <div className={classnames(styles.name, 'side-menu-exclude')}>
            {propName}

            {required && <span className={styles.required}>required</span>}

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
    separator = '.',
}: {
    as?: string | FunctionComponent<AllHTMLAttributes<Element>>;
    prefixPath?: string[];
    separator?: string;
}) {
    // Discriminator segments (`[type='x']`) attach to the preceding property without a dot and keep
    // their quotes, so a nested path reads `subtitle.text[type='text'].lineHeight`.
    const parentPrefix = prefixPath?.reduce((acc, segment) => {
        if (segment.startsWith('[')) {
            return `${acc}${segment}`;
        }
        return acc ? `${acc}.${cleanupName(segment)}` : cleanupName(segment);
    }, '');
    return (
        <>
            {parentPrefix && <Component className={styles.parentProperties}>{`${parentPrefix}${separator}`}</Component>}
        </>
    );
}

function CodeCollapsibleButton({
    name,
    isExpanded,
    onClick,
}: {
    name: string;
    isExpanded?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            className={classnames(styles.seeMore, 'button-style-none', {
                [styles.isExpanded]: isExpanded,
            })}
            onClick={onClick}
            aria-label={`See more details about ${name}`}
        >
            <Icon name="chevronDown" />
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
    hasSignature,
    isSignatureExpanded,
    onSignatureToggle,
}: {
    type: string;
    name?: string;
    typeUrl?: string;
    defaultValue?: string;
    collapsibleType?: CollapsibleType;
    isExpanded?: boolean;
    onCollapseClick?: () => void;
    hasSignature?: boolean;
    isSignatureExpanded?: boolean;
    onSignatureToggle?: () => void;
}) {
    const isCollapsibleCode = collapsibleType === 'code';
    const isExpandable = isCollapsibleCode || collapsibleType === 'unionTypes';
    // The square chevron toggles the inline code block (a `code` member's definition, or a mixed-union
    // signature); union variant rows have their own ("See available interfaces") affordance instead.
    const showCodeButton = isCollapsibleCode || Boolean(hasSignature);
    const codeButtonExpanded = isCollapsibleCode ? isExpanded : isSignatureExpanded;
    const codeButtonOnClick = isCollapsibleCode ? onCollapseClick : onSignatureToggle;

    // The type text is only clickable when it toggles a code block; child-property, union-variant and
    // `none` rows have none, so they keep the default cursor.
    return (
        <div className={styles.metaItem}>
            <div className={styles.metaRow}>
                {name && showCodeButton && (
                    <CodeCollapsibleButton name={name} isExpanded={codeButtonExpanded} onClick={codeButtonOnClick} />
                )}
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
                        onClick={showCodeButton ? codeButtonOnClick : undefined}
                        className={classnames(styles.metaValue, {
                            [styles.isExpandable]: isExpandable,
                            [styles.isClickable]: showCodeButton,
                        })}
                    >
                        {type}
                    </span>
                )}
            </div>
            {defaultValue != null && (
                <div className={styles.metaItem}>
                    <span className={classnames(styles.metaValue, styles.defaultValue)}>
                        <span className={styles.defaultLabel}>default: </span>
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
    children,
    ...props
}: AllHTMLAttributes<Element> & { as?: string; splitRegex?: RegExp }) {
    if (typeof children !== 'string') {
        // eslint-disable-next-line no-console
        console.warn('PropertyName children must be of type string', children);
        return <Component {...props} />;
    }
    return <Component {...props}>{wbrInject(children, splitRegex)}</Component>;
}

function wbrInject(text: string, splitRegex: RegExp) {
    return text
        .split(splitRegex)
        .reduce<ReactNode[]>((result, part, index) => result.concat(index ? [<wbr key={index} />, part] : part), []);
}
