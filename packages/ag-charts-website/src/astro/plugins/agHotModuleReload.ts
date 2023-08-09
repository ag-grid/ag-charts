import chokidar from 'chokidar';
import { getDevFileList } from '../../utils/pages';
import { getAllExamplesFileList } from '../../features/docs/utils/filesData';
import { getIsDev } from '../../utils/env';

export default function createAgHotModuleReload() {
    return {
        async configureServer(server) {
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
