import chokidar from 'chokidar';
import type { Plugin, ViteDevServer } from 'vite';

import { getIsDev } from '../src/utils/env';

const BUILD_QUEUE_EMPTY_FILE = '../../node_modules/.cache/ag-build-queue.empty';

// Ignored by Vite's watcher (`server.watch.ignored` in astro.config.mjs, keep the two in step), so nothing
// else invalidates these modules.
const PACKAGE_DIST_FILE = /\/packages\/ag-charts-[^/]+\/dist\//;

/**
 * Drops the cached transform of every module built into a package's `dist/`, so the reload that
 * follows fetches the rebuilt code. Fails open: the caller reloads whatever happens here.
 */
export function invalidatePackageDist(server: ViteDevServer) {
    try {
        let invalidated = 0;
        for (const environment of Object.values(server.environments)) {
            const { moduleGraph } = environment;
            for (const [file, modules] of moduleGraph.fileToModulesMap) {
                if (!PACKAGE_DIST_FILE.test(file)) continue;

                for (const module of modules) {
                    moduleGraph.invalidateModule(module);
                    invalidated++;
                }
            }
        }
        if (invalidated === 0) {
            server.config.logger.warn('[ag-hmr] No package dist modules to invalidate; reloading anyway.');
        }
    } catch (error) {
        server.config.logger.warn(
            `[ag-hmr] Invalidating package dist modules failed; reloading anyway: ${String(error)}`
        );
    }
}

/**
 * Coalesces build-queue-empty signals: each burst invalidates the package dist modules and then sends
 * one `full-reload`.
 */
export function createFullReload(server: ViteDevServer) {
    let timeout: NodeJS.Timeout | undefined;
    return {
        reload(path: string) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                invalidatePackageDist(server);
                server.ws.send({ type: 'full-reload', path });
            }, 10);
        },
        cancel() {
            clearTimeout(timeout);
        },
    };
}

export default function createAgHotModuleReload(): Plugin {
    return {
        name: 'ag-hmr',
        configureServer(server: ViteDevServer) {
            if (!getIsDev()) return;

            const filesToWatch = [BUILD_QUEUE_EMPTY_FILE];
            const fullReload = createFullReload(server);

            const watcher = chokidar.watch(filesToWatch);
            watcher
                .on('change', (path) => {
                    fullReload.reload(path);
                })
                .on('add', (path) => {
                    fullReload.reload(path);
                });

            // Vite's in-place restart closes the old HTTP server; without this the watcher (and the
            // `server` its callbacks capture) outlives every restarted generation.
            server.httpServer?.once('close', () => {
                fullReload.cancel();
                void watcher.close();
            });
        },
    };
}
