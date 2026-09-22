#!/usr/bin/env node
// A static file server with no dependencies, for the parity run's discovered ports: Playwright's
// `webServer` starts one per seed `dist`, alongside the `vite preview` of the React reference.
//
//   node e2e/parity/serve-dist.mjs --dir <path> --port <number>
//
// Files are served from `dir`; a path with no file behind it gets `index.html` (the seeds are
// single-page apps, and the parity URL carries a query string and a hash), so an unknown path is
// never a 404. Paths that escape `dir` are refused.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    '.wasm': 'application/wasm',
};

function readArgs(argv) {
    const args = { dir: undefined, port: undefined };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--dir') args.dir = argv[++i];
        else if (argv[i] === '--port') args.port = Number(argv[++i]);
        else throw new Error(`Unknown argument "${argv[i]}"`);
    }
    if (!args.dir) throw new Error('--dir <path> is required');
    if (!Number.isInteger(args.port) || args.port <= 0) throw new Error('--port <number> is required');
    return { dir: resolve(args.dir), port: args.port };
}

async function fileAt(path) {
    const info = await stat(path).catch(() => null);
    return info?.isFile() ? path : null;
}

const { dir, port } = readArgs(process.argv.slice(2));
const root = dir.endsWith(sep) ? dir : dir + sep;
const index = join(dir, 'index.html');

if (!(await fileAt(index))) {
    throw new Error(`No index.html under ${dir}; build the seed first`);
}

const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const requested = normalize(join(dir, pathname));
    if (requested !== dir && !requested.startsWith(root)) {
        response.writeHead(403).end();
        return;
    }

    const file = (await fileAt(requested)) ?? index;
    response.writeHead(200, {
        'content-type': CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
        'cache-control': 'no-store',
    });
    if (request.method === 'HEAD') {
        response.end();
        return;
    }
    createReadStream(file)
        .on('error', () => response.destroy())
        .pipe(response);
});

server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Serving ${dir} at http://localhost:${port}`);
});
