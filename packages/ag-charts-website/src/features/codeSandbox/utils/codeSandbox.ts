import type { FileContents } from '@features/examples-generator/types';
import { pathJoin } from '@utils/pathJoin';

const CREATE_CODE_SANDBOX_URL = 'https://codesandbox.io/api/v1/sandboxes/define?json=1';
const CODE_SANDBOX_URL_PREFIX = 'https://codesandbox.io/p/sandbox/';

const getCodeSandboxTemplate = (config: object) => {
    return { ...config, tags: ['ag-grid', 'ag-charts', 'example'], published: false };
};

export const createNewCodeSandbox = async ({ title, files }: { title: string; files: FileContents }) => {
    const configFiles = {
        '.codesandbox/template.json': {
            content: JSON.stringify(getCodeSandboxTemplate({ title }), null, 2),
        },
    };
    const sandboxFiles: Record<string, { content: string }> = {
        ...configFiles,
    };

    for (const [name, content] of Object.entries<string>(files)) {
        sandboxFiles[name] = {
            content,
        };
    }
    const bodyObj = {
        files: sandboxFiles,
    };
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
