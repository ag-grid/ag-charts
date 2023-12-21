import type { InternalFramework } from '@ag-grid-types';
import type { FileContents } from '@features/examples-generator/types';
import { pathJoin } from '@utils/pathJoin';

const CREATE_CODE_SANDBOX_URL = 'https://codesandbox.io/api/v1/sandboxes/define?json=1';
const CODE_SANDBOX_URL_PREFIX = 'https://codesandbox.io/p/sandbox/';

type SandboxFiles = Record<string, { content: string }>;

const getCodeSandboxTemplate = (config: object) => {
    return { ...config, tags: ['ag-grid', 'ag-charts', 'example'], published: false };
};

function isReactFramework(internalFramework: InternalFramework) {
    return new Set(['reactFunctional', 'reactFunctionalTs']).has(internalFramework);
}

const getPathForFile = ({
    fileName,
    internalFramework,
}: {
    fileName: string;
    internalFramework: InternalFramework;
}) => {
    if (!isReactFramework(internalFramework)) {
        return fileName;
    }

    if (fileName === 'index.html') {
        return `public/index.html`;
    }

    if (/([a-zA-Z0-9\\s_.])+(.js|.jsx|.tsx|.ts|.css)$/.test(fileName)) {
        if (fileName.endsWith('.js')) {
            return `public/${fileName}`;
        }

        if (fileName.startsWith('index.')) {
            return `src/${fileName === 'index.jsx' ? 'index.js' : fileName}`;
        }

        if (fileName === 'styles.css') {
            return `src/styles.css`;
        }
        return `src/${fileName}`;
    }

    return fileName;
};

const getCodeSandboxRuntime = (internalFramework: InternalFramework) => {
    switch (internalFramework) {
        case 'reactFunctional':
            return 'create-react-app';
        case 'reactFunctionalTs':
            return 'create-react-app-typescript';
        default:
            return 'static';
    }
};

const getCodeSandboxFiles = ({
    files,
    boilerPlateFiles,
    internalFramework,
}: {
    files: FileContents;
    boilerPlateFiles: FileContents;
    internalFramework: InternalFramework;
}) => {
    const sandboxFiles: SandboxFiles = {};
    const allFiles = isReactFramework(internalFramework)
        ? {
              ...files,
          }
        : { ...boilerPlateFiles, ...files };

    for (const [name, content] of Object.entries(allFiles)) {
        const key = getPathForFile({ fileName: name, internalFramework });
        sandboxFiles[key] = {
            content: content as string,
        };
    }

    return sandboxFiles;
};

const getCodeSandboxBody = ({
    title,
    files,
    boilerPlateFiles,
    internalFramework,
}: {
    title: string;
    files: FileContents;
    boilerPlateFiles: FileContents;
    internalFramework: InternalFramework;
}) => {
    const runtime = getCodeSandboxRuntime(internalFramework);
    const configFiles = {
        '.codesandbox/template.json': {
            content: JSON.stringify(getCodeSandboxTemplate({ title, runtime }), null, 2),
        },
    };
    const sandboxFiles = {
        ...configFiles,
        ...getCodeSandboxFiles({
            files,
            boilerPlateFiles,
            internalFramework,
        }),
    };

    return {
        files: sandboxFiles,
    };
};

export const createNewCodeSandbox = async ({
    title,
    files,
    boilerPlateFiles,
    internalFramework,
}: {
    title: string;
    files: FileContents;
    boilerPlateFiles: FileContents;
    internalFramework: InternalFramework;
}) => {
    const bodyObj = getCodeSandboxBody({
        title,
        files,
        boilerPlateFiles,
        internalFramework,
    });
    const body = JSON.stringify(bodyObj);

    return fetch(CREATE_CODE_SANDBOX_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body,
    })
        .then((x) => x.json())
        .then((result) => {
            const sandboxId = result?.sandbox_id;
            return {
                sandboxId,
            };
        });
};

export const getCodeSandboxUrl = (sandboxId: string) => {
    if (!sandboxId) return;

    return pathJoin(CODE_SANDBOX_URL_PREFIX, sandboxId);
};
