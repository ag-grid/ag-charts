import type { Framework } from '@ag-grid-types';
import { FRAMEWORKS } from '@constants';
import { getFrameworkDisplayText, getNewFrameworkPath } from '@utils/framework';

export interface FrameworkVersionLink {
    framework: Framework;
    label: string;
    href: string;
}

/**
 * Links to the same page in each of the other frameworks. Every docs page is built in every framework, so all of them
 * are linked.
 */
export function getFrameworkVersionLinks({
    path,
    currentFramework,
}: {
    path: string;
    currentFramework: Framework;
}): FrameworkVersionLink[] {
    return FRAMEWORKS.filter((framework) => framework !== currentFramework).map((framework) => ({
        framework,
        label: `${getFrameworkDisplayText(framework)} Charts`,
        href: getNewFrameworkPath({ path, currentFramework, newFramework: framework }),
    }));
}
