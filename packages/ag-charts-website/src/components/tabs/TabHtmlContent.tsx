import type { ReactElement } from 'react';

interface Props {
    label: string;
    children: ReactElement;
}

export const TabHtmlContent = ({ label, children }: Props) => {
    return <div tab-label={label}>{children}</div>;
};
