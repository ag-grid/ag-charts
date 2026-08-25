import type { InternalFramework } from '@ag-grid-types';
import { OpenInCodeSandbox } from '@ag-website-shared/components/codeSandbox/components/OpenInCodeSandbox';
import { OpenInPlunkr } from '@ag-website-shared/components/plunkr/components/OpenInPlunkr';
import type { FileContents } from '@components/example-generator/types';
import {
    EXAMPLE_RUNNER_SCRIPT_FILE_NAME,
    exampleRunnerScriptSrc,
} from '@components/example-runner/framework-templates/lib/ExampleRunnerClient';
import type { ExampleOptions } from '@components/example-runner/types';

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
                        runtimeFileUrls={runtimeFileUrls}
                    />
                </li>
            ) : undefined}
        </>
    );
}
