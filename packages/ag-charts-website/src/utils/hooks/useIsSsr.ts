import { useEffect, useState } from 'react';

// Manages SSRs and the hydration of a page
export const useIsSsr = () => {
    const [isSsr, setIsSsr] = useState(true);

    useEffect(() => {
        setIsSsr(false);
    }, []);

    return isSsr;
};
