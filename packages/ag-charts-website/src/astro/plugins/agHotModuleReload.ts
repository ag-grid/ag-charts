import chokidar from 'chokidar';
import type { Plugin, ViteDevServer } from 'vite';
import { getAllExamplesFileList } from '../../features/docs/utils/filesData';
import { getIsDev } from '../../utils/env';
import { getDevFileList } from '../../utils/pages';

export default function createAgHotModuleReload(): Plugin {
    return {
        name: 'ag-hmr',
        async configureServer(server: ViteDevServer) {
            if (!getIsDev()) return;

            const devFiles = getDevFileList();
            const exampleFiles = await getAllExamplesFileList();

            const fullReload = (path: string) => {
                server.ws.send({ type: 'full-reload', path });
            };

            const watcher = chokidar.watch([...devFiles, ...exampleFiles]);
            watcher
                .on('change', (path) => {
                    fullReload(path);
                })
                .on('add', (path) => {
                    fullReload(path);
                });
        },
    };
}
