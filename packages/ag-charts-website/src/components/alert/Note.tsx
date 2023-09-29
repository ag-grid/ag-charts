import type { FunctionComponent, ReactElement } from 'react';

import { Alert } from './Alert';

interface Props {
    children: ReactElement;
}

const Note: FunctionComponent<Props> = ({ children }) => {
    return (
        <Alert type="info" className="font-size-responsive">
            {children}
        </Alert>
    );
};

export default Note;
