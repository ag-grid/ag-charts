import { updateInternalFrameworkBasedOnFramework } from '@stores/frameworkStore';
import { useFramework } from '@utils/hooks/useFramework';
import { useCallback } from 'react';

export function useFrameworkSelector() {
    const { framework, internalFramework } = useFramework();

    const handleFrameworkChange = useCallback((newFramework: string) => {
        updateInternalFrameworkBasedOnFramework(newFramework);
    }, []);

    return {
        internalFramework,
        framework,
        handleFrameworkChange,
    };
}
