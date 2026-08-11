import { type ExampleFramework, getImportMap } from '@utils/exampleModules/getImportMap';
import { toModuleFileName } from '@utils/exampleModules/transformExampleModule';
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
 * Example modules are loaded natively by the browser: an import map resolves the bare
 * package specifiers, and the entry file is loaded as a module. TypeScript and JSX sources
 * are transpiled server-side and served as `.js`, so the entry point is requested as such.
 * The exception is Plunker, which is handed the sources as authored -- see `transpileInBrowser`.
 */
export const ExampleModules = ({ appLocation, entryFileName, framework, transpileInBrowser }: Props) => {
    const importMap = getImportMap({ framework });
    const startFile = pathJoin(appLocation, toModuleFileName(entryFileName));

    return (
        <>
            <script
                type="importmap"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({ imports: importMap }, null, 4) }}
            />

            {/* Examples read `process.env.NODE_ENV` to guard dev-only validations, and nothing
                in a browser defines it. Classic scripts run before deferred module scripts, so
                this is in place by the time the example's own code does. */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.process = { env: { NODE_ENV: 'development' } };
window.addEventListener('error', function (e) { console.error('ERROR', e.message, e.filename); });`,
                }}
            />
            {transpileInBrowser ? (
                <BrowserTranspiler entryFileName={entryFileName} />
            ) : (
                <script type="module" src={startFile} />
            )}
        </>
    );
};
