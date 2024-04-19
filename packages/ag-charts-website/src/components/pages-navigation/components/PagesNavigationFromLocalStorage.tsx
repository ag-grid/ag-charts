import type { Framework, MenuData } from '@ag-grid-types';
import { useStore } from '@nanostores/react';
import { $internalFramework } from '@stores/frameworkStore';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { useEffect, useState } from 'react';

import { PagesNavigation } from './PagesNavigation';

export function PagesNavigationFromLocalStorage({ menuData, pageName }: { menuData: MenuData; pageName: string }) {
    const internalFramework = useStore($internalFramework);
    const [framework, setFramework] = useState<Framework>();

    useEffect(() => {
        const newFramework = getFrameworkFromInternalFramework(internalFramework);

        if (newFramework !== framework) {
            setFramework(newFramework);
        }
    }, [internalFramework]);

    return (
        framework && <PagesNavigation menuData={menuData} framework={framework} pageName={pageName}></PagesNavigation>
    );
}
