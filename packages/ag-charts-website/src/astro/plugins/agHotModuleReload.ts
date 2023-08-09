import chokidar from 'chokidar';
import { getDevFileList } from '../../utils/pages';
import { getAllExamplesFileList } from '../../features/docs/utils/filesData';

export default function createAgHotModuleReload() {
    return {
        configureServer(server) {
            const devFiles = getDevFileList();

            const fullReload = (path: string) => {
                server.ws.send({ type: 'full-reload', path });
            };

            const watcher = chokidar.watch(devFiles);
            watcher
                .on('change', (path) => {
                    fullReload(path);
                })
                .on('add', (path) => {
                    fullReload(path);
                });

            getAllExamplesFileList().then((files) => {
                const watcher = chokidar.watch(files);
                watcher
                    .on('change', (path) => {
                        fullReload(path);
                    })
                    .on('add', (path) => {
                        fullReload(path);
                    });
            });
        },
    };
}
