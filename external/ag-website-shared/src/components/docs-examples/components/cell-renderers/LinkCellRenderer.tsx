import type { InternalFramework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { getExampleContentsUrl, getExampleUrl } from '@components/docs/utils/urlPaths';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { urlWithPrefix } from '@utils/urlWithPrefix';

const HEADER_NAME_INTERNAL_FRAMEWORK_MAPPING: Record<string, InternalFramework> = {
    React: 'reactFunctional',
    'React TS': 'reactFunctionalTs',
    Angular: 'angular',
    Vue: 'vue3',
    JavaScript: 'vanilla',
    Typescript: 'typescript',
};

export function LinkCellRenderer({ colDef, data }) {
    if (!data) {
        return;
    }
    const internalFramework = HEADER_NAME_INTERNAL_FRAMEWORK_MAPPING[colDef.headerName];
    const { pageName, exampleName } = data;
    const titlePrefix = `${pageName} > ${exampleName} > ${internalFramework}`;

    return (
        <div>
            <a
                href={urlWithPrefix({
                    framework: getFrameworkFromInternalFramework(internalFramework),
                    url: `./${pageName}`,
                })}
                target="_blank"
                title={`${pageName} ${internalFramework} page`}
            >
                Page
            </a>{' '}
            |{' '}
            <a
                href={urlWithPrefix({
                    framework: getFrameworkFromInternalFramework(internalFramework),
                    url: `./${pageName}#example-${exampleName}`,
                })}
                target="_blank"
                title={`${titlePrefix} example on page`}
            >
                Page Ex
            </a>{' '}
            |{' '}
            <a
                href={getExampleUrl({
                    internalFramework,
                    pageName,
                    exampleName,
                })}
                target="_blank"
                title={`${titlePrefix} example`}
            >
                Ex
            </a>{' '}
            |{' '}
            <a
                href={getExampleContentsUrl({
                    internalFramework,
                    pageName,
                    exampleName,
                })}
                target="_blank"
                title={`${titlePrefix} contents.json`}
            >
                <Icon name="codeResult" />
            </a>
        </div>
    );
}
