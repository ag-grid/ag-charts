import { useEffect, useState } from 'react';

// Manages SSRs and the hydration of a page
export const useIsSsr = () => {
    const [isSsr, setIsSsr] = useState(false);

    useEffect(() => {
        setIsSsr(false);
    }, []);

    return isSsr;
};
