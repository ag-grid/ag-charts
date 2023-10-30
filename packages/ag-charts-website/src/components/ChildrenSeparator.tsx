import type { ReactNode } from 'react';
import { Children, Fragment } from 'react';

export function ChildrenSeparator({ children, separator = ', ' }: { children: ReactNode[]; separator?: ReactNode }) {
    const createSeparator =
        typeof separator === 'string' ? () => separator : (key: number) => <Fragment key={key}>{separator}</Fragment>;
    return (
        <>
            {Children.toArray(children).reduce<ReactNode[]>(
                (result, child, index) => result.concat(index ? [createSeparator(index), child] : child),
                []
            )}
        </>
    );
}
