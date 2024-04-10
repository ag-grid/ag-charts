import { LinkIcon } from '@components/link-icon/LinkIcon';
import styles from '@legacy-design-system/modules/ApiReference.module.scss';
import { navigate, scrollIntoViewById } from '@utils/navigation';
import classnames from 'classnames';
import type { AllHTMLAttributes, FunctionComponent, MouseEventHandler, ReactNode } from 'react';

import { cleanupName } from '../apiReferenceHelpers';

interface PropertyTitleOptions {
    name: string;
    anchorId: string;
    prefixPath?: string[];
    required?: boolean;
}

export function PropertyTitle({ name, anchorId, prefixPath, required }: PropertyTitleOptions) {
    const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
        event.preventDefault();
        navigate(event.currentTarget.href);
        const href = event.currentTarget.getAttribute('href');
        if (href?.startsWith('#')) {
            scrollIntoViewById(href.substring(1));
        }
    };
    return (
        <h6 className={classnames(styles.name, 'side-menu-exclude')}>
            <PropertyNamePrefix prefixPath={prefixPath} />
            <PropertyName isRequired={required}>{name}</PropertyName>
            <LinkIcon href={`#${anchorId}`} onClick={handleClick} className={styles.linkIcon} />
        </h6>
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

export function PropertyType({ type, defaultValue }: { type: string; defaultValue?: string }) {
    return (
        <div className={styles.metaList}>
            <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Type</span>
                <PropertyName className={styles.metaValue}>{type}</PropertyName>
            </div>
            {defaultValue && (
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Default</span>
                    <span className={styles.metaValue}>{defaultValue}</span>
                </div>
            )}
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
            {isRequired && (
                <span title="Required" className={styles.required}>
                    *
                </span>
            )}
        </Component>
    );
}

function wbrInject(text: string, splitRegex: RegExp) {
    return text
        .split(splitRegex)
        .reduce<ReactNode[]>((result, part, index) => result.concat(index ? [<wbr key={index} />, part] : part), []);
}
