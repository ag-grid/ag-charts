import type { Framework } from '@ag-grid-types';
import { useStore } from '@nanostores/react';
import { $internalFramework } from '@stores/frameworkStore';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { useEffect, useState } from 'react';

import { NewDocsNav } from './NewDocsNav';

export function NewDocsNavFromLocalStorage({ menuData, pageName }: { menuData: any; pageName: string }) {
    const internalFramework = useStore($internalFramework);
    const [framework, setFramework] = useState<Framework>();

    useEffect(() => {
        const newFramework = getFrameworkFromInternalFramework(internalFramework);

        if (newFramework !== framework) {
            setFramework(newFramework);
        }
    }, [internalFramework]);

    return framework && <NewDocsNav menuData={menuData} framework={framework} pageName={pageName} />;
}
