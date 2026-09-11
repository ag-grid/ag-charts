import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

import { moveImportMapBeforeHeadScripts } from '../src/utils/example-modules/moveImportMapBeforeHeadScripts';
import { EXAMPLES_PATH_REGEXP } from '../src/utils/htaccess/cspRules';

const toBuffer = (chunk: unknown, encoding?: BufferEncoding): Buffer => {
    if (Buffer.isBuffer(chunk)) {
        return chunk;
    }
    // Astro's response stream yields plain Uint8Array chunks (not Node Buffer instances) --
    // String(chunk) would join their byte values with commas instead of decoding them.
    if (ArrayBuffer.isView(chunk)) {
        return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    }
    return Buffer.from(String(chunk), encoding);
};

/**
 * Buffers an example-runner document's response so its complete body can be rewritten by
 * moveImportMapBeforeHeadScripts before it reaches the browser. Non-HTML responses under the same
 * paths (the example's own .js/.css assets) are re-serialised unchanged.
 */
function bufferAndFixImportMapOrder(req: IncomingMessage, res: ServerResponse, next: () => void) {
    if (!EXAMPLES_PATH_REGEXP.test(req.url ?? '')) {
        return next();
    }

    const chunks: Buffer[] = [];
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = ((chunk: unknown, encoding?: BufferEncoding | (() => void)) => {
        chunks.push(toBuffer(chunk, typeof encoding === 'string' ? encoding : undefined));
        return true;
    }) as ServerResponse['write'];

    res.end = ((chunk?: unknown, encoding?: BufferEncoding | (() => void)) => {
        if (chunk !== undefined && typeof chunk !== 'function') {
            chunks.push(toBuffer(chunk, typeof encoding === 'string' ? encoding : undefined));
        }

        // Node's ServerResponse#end(chunk) calls `this.write(chunk)` internally, which would
        // re-enter these shims instead of flushing -- restore the real methods first.
        res.write = originalWrite;
        res.end = originalEnd;

        const contentType = res.getHeader('content-type');
        const isHtml = typeof contentType === 'string' && contentType.includes('text/html');
        const body = Buffer.concat(chunks);

        if (!isHtml || body.length === 0) {
            return res.end(body);
        }

        // Headers are already flushed by the time this runs, so Content-Length (when Astro sets
        // one) can no longer be corrected for the rewritten body's new length -- only strip it
        // while that is still possible; these HTML responses are otherwise unset (chunked).
        if (!res.headersSent) {
            res.removeHeader('Content-Length');
        }
        return res.end(moveImportMapBeforeHeadScripts(body.toString('utf-8')));
    }) as ServerResponse['end'];

    next();
}

/**
 * Fixes a Firefox-only dev-server failure where example pages fail to resolve bare specifiers
 * ("was a bare specifier, but was not remapped to anything"). See
 * moveImportMapBeforeHeadScripts for the root cause and fix.
 */
export default function agDevImportMapOrder(): Plugin {
    return {
        name: 'ag-dev-importmap-order',
        configureServer(server: ViteDevServer) {
            server.middlewares.use(bufferAndFixImportMapOrder);
        },
    };
}
