import type { AllHTMLAttributes, ReactElement } from 'react';

import styles from './ApiDocumentation.module.scss';

const splitRegex = /(?=[A-Z]|\s+\|\s+)/;

function wbrReducer(result: (string | ReactElement)[], part: string, index: number) {
    // (part ? result.concat(index ? [<wbr key={index} />, part] : part) : result)
    return result.concat(index ? [<wbr key={index} />, part] : part);
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
            {children.split(splitRegex).reduce(wbrReducer, [])}
            {isRequired && (
                <span title="Required" className={styles.required}>
                    &ast;
                </span>
            )}
        </Component>
    );
}
