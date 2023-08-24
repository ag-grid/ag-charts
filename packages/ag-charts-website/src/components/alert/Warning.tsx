import type { ReactElement } from 'react';
import { Alert } from './Alert';

interface Props {
    title: string;
    children: ReactElement;
}

const Warning = ({ children, title }: Props) => {
    return (
        <Alert type="warning" className="font-size-responsive">
            <div>
                {title && <h4>{title}</h4>}
                {children}
            </div>
        </Alert>
    );
};

export default Warning;
