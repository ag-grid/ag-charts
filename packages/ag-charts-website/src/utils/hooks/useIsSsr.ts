import { useEffect, useState } from 'react';

import { getIsDev } from '../env';

let didRender = false;

// Manages SSRs and the hydration of a page
export const useIsSsr = () => {
    const [isSsr, setIsSsr] = useState(!didRender);

    useEffect(() => {
        if (didRender) {
            return;
        }

        if (!getIsDev()) {
            // We get hydration warnings due to hmr
            didRender = true;
        }

        setIsSsr(false);
    });

    return isSsr;
};
