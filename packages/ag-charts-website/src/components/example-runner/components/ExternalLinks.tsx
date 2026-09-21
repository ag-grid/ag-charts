import type { InternalFramework } from '@ag-grid-types';
import { OpenInCodeSandbox } from '@ag-website-shared/components/codeSandbox/components/OpenInCodeSandbox';
import {
    EXAMPLE_RUNNER_SCRIPT_FILE_NAME,
    exampleRunnerScriptSrc,
} from '@ag-website-shared/components/example-runner/components/ExampleRunnerClient';
import { OpenInPlunkr } from '@ag-website-shared/components/plunkr/components/OpenInPlunkr';
import type { FileContents } from '@components/example-generator/types';
import type { ExampleOptions } from '@components/example-runner/types';
import { getIsDev } from '@utils/env';

export function ExternalLinks({
    title,
    options,
    internalFramework,
    exampleFiles,
    packageJson,
    initialSelectedFile,
    plunkrHtmlUrl,
    codeSandboxHtmlUrl,
}: {
    title: string;
    options?: ExampleOptions;
    internalFramework: InternalFramework;
    exampleFiles?: FileContents;
    packageJson?: Record<string, any>;
    initialSelectedFile?: string;

    plunkrHtmlUrl?: string;
    codeSandboxHtmlUrl?: string;
}) {
    // Both exports transpile in the page, so each needs its own copy of the example runtime
    const runtimeFileUrls = { [EXAMPLE_RUNNER_SCRIPT_FILE_NAME]: exampleRunnerScriptSrc() };
    // The dev server's example HTML carries the Vite client and dev-server URLs, which the export
    // has to strip (`cleanIndexHtml`) or the sandbox loads nothing. Derived here rather than taken
    // as a prop so that no caller can forget to pass it: the website has no type-check gate that
    // would catch the omission.
    const isDev = getIsDev();

    return (
        <>
            {!options?.noCodeSandbox && codeSandboxHtmlUrl && exampleFiles ? (
                <li>
                    <OpenInCodeSandbox
                        title={title}
                        files={exampleFiles}
                        htmlUrl={codeSandboxHtmlUrl}
                        internalFramework={internalFramework}
                        packageJson={packageJson}
                        isDev={isDev}
                        runtimeFileUrls={runtimeFileUrls}
                    />
                </li>
            ) : undefined}
            {!options?.noPlunker && plunkrHtmlUrl && exampleFiles ? (
                <li>
                    <OpenInPlunkr
                        title={title}
                        files={exampleFiles}
                        htmlUrl={plunkrHtmlUrl}
                        packageJson={packageJson!}
                        fileToOpen={initialSelectedFile!}
                        isDev={isDev}
                        runtimeFileUrls={runtimeFileUrls}
                    />
                </li>
            ) : undefined}
        </>
    );
}
