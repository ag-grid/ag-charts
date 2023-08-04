import chokidar from 'chokidar';
import { getDevFileList } from '../../utils/pages';

export default function createAgHotModuleReload() {
    return {
        configureServer(server) {
            const devFiles = getDevFileList();
            const devFileWatchers = {};

            const fullReload = (path: string) => {
                server.ws.send({ type: 'full-reload', path });
            };

            devFiles.forEach((devFile) => {
                const watcher = chokidar.watch(devFile);
                watcher
                    .on('change', (path) => {
                        fullReload(path);
                    })
                    .on('add', (path) => {
                        fullReload(path);
                    });

                devFileWatchers[devFile] = watcher;
            });
        },
    };
}
