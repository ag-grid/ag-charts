import type { AllHTMLAttributes, ReactNode } from 'react';

import styles from './ApiDocumentation.module.scss';

const defaultSplitRegex = /(?=[A-Z]|\s+\|\s+)/;

function wbrInject(text: string, splitRegex: RegExp) {
    return text
        .split(splitRegex)
        .reduce<ReactNode[]>((result, part, index) => result.concat(index ? [<wbr key={index} />, part] : part), []);
}

/**
 * Split display name on capital letter, add <wbr> to improve text splitting across lines
 */
export function PropertyName({
    as: Component = 'span',
    splitRegex = defaultSplitRegex,
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
