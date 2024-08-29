import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin, ViteDevServer } from 'vite';

export default function agAutoRedirect(redirectPathsIter: Iterable<string> = []): Plugin {
    const redirectPaths = new Set(redirectPathsIter);

    const isRedirectPath = (url: string) => {
        for (const path of redirectPaths) {
            if (url.startsWith(path)) {
                return true;
            }
        }
        return false;
    };

    return {
        name: 'ag-auto-redirect',
        configureServer(server: ViteDevServer) {
            const { PUBLIC_BASE_URL } = process.env;

            return () => {
                server.middlewares.stack.unshift({
                    route: '',
                    handle(req: IncomingMessage, res: ServerResponse, next: () => void) {
                        if (PUBLIC_BASE_URL && (req.url === '/' || (req.url != null && isRedirectPath(req.url)))) {
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
