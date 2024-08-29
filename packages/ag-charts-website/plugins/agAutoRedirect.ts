import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin, ViteDevServer } from 'vite';

export default function agAutoRedirect(): Plugin {
    return {
        name: 'ag-auto-redirect',
        configureServer(server: ViteDevServer) {
            const { PUBLIC_BASE_URL } = process.env;

            return () => {
                server.middlewares.stack.unshift({
                    route: '',
                    handle(req: IncomingMessage, res: ServerResponse, next: () => void) {
                        if (PUBLIC_BASE_URL && req.url?.startsWith(PUBLIC_BASE_URL) === false) {
                            res.writeHead(302, {
                                Location: `${PUBLIC_BASE_URL}${req.url}`,
                            });
                            res.end();
                        } else {
                            next();
                        }
                    },
                });
            };
        },
    };
}
