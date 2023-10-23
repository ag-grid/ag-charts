import type { AllHTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './ApiDocumentation.module.scss';

function wbrInject(text: string, splitRegex = /(?=[A-Z]|\s+\|\s+)/) {
    return text
        .split(splitRegex)
        .reduce<ReactNode[]>((result, part, index) => result.concat(index ? [<wbr key={index} />, part] : part), []);
}

/**
 * Split display name on capital letter, add <wbr> to improve text splitting across lines
 */
export function SplitName({
    as: Component = 'span',
    isRequired,
    children,
    ...props
}: AllHTMLAttributes<Element> & { as?: string; isRequired?: boolean }) {
    if (typeof children !== 'string') {
        return <Component {...props} />;
    }
    return (
        <Component {...props}>
            {wbrInject(children)}
            {isRequired && (
                <span title="Required" className={styles.required}>
                    &ast;
                </span>
            )}
        </Component>
    );
}
