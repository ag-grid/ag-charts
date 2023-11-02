import type { ReactElement } from 'react';

interface Props {
    id?: string;
    label: string;
    children: ReactElement;
}

export const TabHtmlContent = ({ id, label, children }: Props) => {
    return (
        <div tab-id={id} tab-label={label}>
            {children}
        </div>
    );
};
