import type { Framework } from '@ag-grid-types';
import { useStore } from '@nanostores/react';
import { $internalFramework, updateInternalFrameworkBasedOnFramework } from '@stores/frameworkStore';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { useEffect } from 'react';

/**
 * Sync framework store with the state of the page
 */
export function useSyncFrameworkStoreState(framework: Framework) {
    const internalFramework = useStore($internalFramework);

    // Update the internal framework store if it is different to the framework to sync with localstorage
    useEffect(() => {
        const frameworkFromInternalFramework = getFrameworkFromInternalFramework(internalFramework);
        if (frameworkFromInternalFramework !== framework) {
            updateInternalFrameworkBasedOnFramework(framework);
        }
    }, [internalFramework, framework]);
}
