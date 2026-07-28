#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Zero-dependency static file server for built ag-charts-website output.
 *
 * Serves a dist directory at a base path (default /charts), matching how the
 * production site is hosted. Used by the benchmark tooling so shards can run
 * against a pre-built site artifact without an Astro dev server or checkout.
 *
 * Usage:
 *   node tools/benchmark/serve-static.js --dir dist/packages/ag-charts-website [--port 4601] [--base /charts]
 *
 * Prints a single parseable line on readiness:
 *   SERVING http://localhost:<port><base>
 */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
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
    '.xml': 'application/xml; charset=utf-8',
    '.wasm': 'application/wasm',
    '.map': 'application/json; charset=utf-8',
};

function parseArgs(argv) {
    const args = { port: 4601, base: '/charts', dir: undefined };
    for (let i = 2; i < argv.length; i++) {
        switch (argv[i]) {
            case '--dir':
                args.dir = argv[++i];
                break;
            case '--port':
                args.port = Number(argv[++i]);
                break;
            case '--base':
                args.base = argv[++i];
                break;
            default:
                console.error(`Unknown argument: ${argv[i]}`);
                process.exit(1);
        }
    }
    if (!args.dir) {
        console.error('Usage: serve-static.js --dir <dist-dir> [--port <port>] [--base </charts>]');
        process.exit(1);
    }
    args.base = `/${args.base.replace(/^\/|\/$/g, '')}`;
    return args;
}

const { dir, port, base } = parseArgs(process.argv);
const root = path.resolve(dir);

if (!fs.existsSync(root)) {
    console.error(`Directory not found: ${root}`);
    process.exit(1);
}

// Astro emits pages at the outDir root and expects the directory to be hosted
// at the base path. Some artifact layouts may instead contain the base segment
// as a real directory — detect that and serve accordingly.
const baseSegment = base.slice(1);
const baseIsRealDir = baseSegment.length > 0 && fs.existsSync(path.join(root, baseSegment));

function resolveFile(urlPath) {
    let relPath = decodeURIComponent(urlPath.split('?')[0]);

    if (!baseIsRealDir && base !== '/') {
        if (relPath === base) relPath = '/';
        else if (relPath.startsWith(`${base}/`)) relPath = relPath.slice(base.length);
        else return undefined;
    }

    const filePath = path.join(root, relPath);
    // Prevent path traversal
    if (filePath !== root && !filePath.startsWith(root + path.sep)) return undefined;

    const candidates = [filePath];
    if (relPath.endsWith('/')) {
        candidates.unshift(path.join(filePath, 'index.html'));
    } else if (!path.extname(filePath)) {
        candidates.unshift(path.join(filePath, 'index.html'), `${filePath}.html`);
    }

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
    }
    return undefined;
}

const server = http.createServer((req, res) => {
    const filePath = resolveFile(req.url ?? '/');
    if (!filePath) {
        // Do not reflect the requested URL back into the response body — echoing
        // untrusted request input is an XSS vector (and trips SAST scanners) for no
        // real benefit in a benchmark file server.
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('Not found');
        return;
    }

    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, { 'content-type': contentType, 'cache-control': 'no-store' });
    fs.createReadStream(filePath).pipe(res);
});

server.on('error', (err) => {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
    const { port: actualPort } = server.address();
    console.log(`Serving ${root} (base ${base}${baseIsRealDir ? ', real dir' : ''})`);
    console.log(`SERVING http://localhost:${actualPort}${base === '/' ? '' : base}`);
});
