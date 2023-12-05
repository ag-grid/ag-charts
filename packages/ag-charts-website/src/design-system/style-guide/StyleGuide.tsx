import type { FunctionComponent } from 'react';

import { Colors } from './Colors';
import { TextStyles } from './TextStyles';

export const StyleGuide: FunctionComponent = () => {
    return (
        <>
            <h1>STYLE GUIDE</h1>
            <Colors />
            <TextStyles />
        </>
    );
};
