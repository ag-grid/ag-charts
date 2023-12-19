import { OpenInCTA } from '@components/open-in-cta/OpenInCTA';
import type { FileContents } from '@features/examples-generator/types';
import { fetchTextFile } from '@utils/fetchTextFile';
import type { FunctionComponent } from 'react';

import { createNewCodeSandbox, getCodeSandboxUrl } from '../utils/codeSandbox';

interface Props {
    title: string;
    files: FileContents;
    htmlUrl: string;
    boilerPlateFiles?: FileContents;
}

export const OpenInCodeSandbox: FunctionComponent<Props> = ({ title, files, htmlUrl, boilerPlateFiles }) => {
    return (
        <OpenInCTA
            type="codesandbox"
            onClick={async () => {
                const html = await fetchTextFile(htmlUrl);
                const sandboxFiles = {
                    ...files,
                    ...boilerPlateFiles,
                    'index.html': html,
                };
                const { sandboxId } = await createNewCodeSandbox({
                    title,
                    files: sandboxFiles,
                });
                const url = getCodeSandboxUrl(sandboxId);
                if (url) {
                    window.open(url);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn('Error opening code sandbox url');
                }
            }}
        />
    );
};
