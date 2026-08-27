import {
    ExampleRunnerCall,
    ExampleRunnerClient,
} from '@ag-website-shared/components/example-runner/components/ExampleRunnerClient';
import { toModuleFileName } from '@ag-website-shared/components/example-runner/utils/transformExampleModule';
import { type ExampleFramework, getImportMap } from '@utils/example-modules/getImportMap';
import { pathJoin } from '@utils/pathJoin';

import { BrowserTranspiler } from './BrowserTranspiler';

interface Props {
    appLocation: string;
    entryFileName: string;
    framework: ExampleFramework;
    /**
     * Whether the example's sources are transpiled in the page rather than served transpiled,
     * which is what Plunker needs (see `BrowserTranspiler`)
     */
    transpileInBrowser?: boolean;
}

/**
 * Example modules are loaded natively: an import map resolves bare specifiers, and the entry
 * file is served transpiled as `.js` -- except for an export, which transpiles in the page.
 */
export const ExampleModules = ({ appLocation, entryFileName, framework, transpileInBrowser }: Props) => {
    const importMap = getImportMap({ framework });
    const startFile = pathJoin(appLocation, toModuleFileName(entryFileName));

    return (
        <>
            <ExampleRunnerClient isExported={transpileInBrowser} />
            <script
                type="importmap"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({ imports: importMap }, null, 4) }}
            />

            {/* Classic scripts run before deferred module scripts, so the shell is in place */}
            <ExampleRunnerCall fn="setUpPage" />

            {transpileInBrowser ? (
                <BrowserTranspiler entryFileName={entryFileName} />
            ) : (
                <script type="module" src={startFile} />
            )}
        </>
    );
};
