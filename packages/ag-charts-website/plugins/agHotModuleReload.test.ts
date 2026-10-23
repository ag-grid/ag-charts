import type { ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFullReload, invalidatePackageDist } from './agHotModuleReload';

type StubModule = { id: string };

/** A stub of the parts of a Vite dev server the plugin touches, keyed by environment name then file. */
function createServer(graphs: Record<string, Record<string, StubModule[]>>) {
    const warn = vi.fn();
    const send = vi.fn();
    const invalidateModule = vi.fn();
    const environments = Object.fromEntries(
        Object.entries(graphs).map(([name, files]) => [
            name,
            { moduleGraph: { fileToModulesMap: new Map(Object.entries(files)), invalidateModule } },
        ])
    );
    const server = { environments, config: { logger: { warn } }, ws: { send } } as unknown as ViteDevServer;
    return { server, warn, send, invalidateModule };
}

const dist = (name: string) => `/repo/packages/ag-charts-community/dist/package/${name}`;
const src = (name: string) => `/repo/packages/ag-charts-website/src/${name}`;

describe('invalidatePackageDist', () => {
    it('invalidates every package dist module in every environment and nothing else', () => {
        const clientDist = { id: 'client-dist' };
        const clientEnterprise = { id: 'client-enterprise' };
        const clientMap = { id: 'client-map' };
        const ssrDist = { id: 'ssr-dist' };
        const clientSrc = { id: 'client-src' };
        const ssrSrc = { id: 'ssr-src' };
        const { server, warn, invalidateModule } = createServer({
            client: {
                [dist('main.esm.mjs')]: [clientDist],
                '/repo/packages/ag-charts-enterprise/dist/package/main.esm.mjs': [clientEnterprise],
                [dist('main.esm.mjs.map')]: [clientMap],
                [src('page.ts')]: [clientSrc],
            },
            ssr: {
                [dist('main.cjs.js')]: [ssrDist],
                [src('page.astro')]: [ssrSrc],
            },
        });

        invalidatePackageDist(server);

        const invalidated = invalidateModule.mock.calls.map(([module]) => module);
        expect(invalidated).toHaveLength(4);
        expect(invalidated).toEqual(expect.arrayContaining([clientDist, clientEnterprise, clientMap, ssrDist]));
        expect(invalidated).not.toContain(clientSrc);
        expect(invalidated).not.toContain(ssrSrc);
        expect(warn).not.toHaveBeenCalled();
    });

    it('invalidates each module of a file that has several', () => {
        const first = { id: 'first' };
        const second = { id: 'second' };
        const { server, invalidateModule } = createServer({ client: { [dist('main.esm.mjs')]: [first, second] } });

        invalidatePackageDist(server);

        expect(invalidateModule.mock.calls.map(([module]) => module)).toEqual([first, second]);
    });

    it('warns and does not throw when the graphs hold no package dist modules', () => {
        const { server, warn, invalidateModule } = createServer({
            client: { [src('page.ts')]: [{ id: 'client-src' }] },
            ssr: {},
        });

        expect(() => invalidatePackageDist(server)).not.toThrow();

        expect(invalidateModule).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('reloading anyway');
    });

    it('warns and does not throw when invalidation throws', () => {
        const { server, warn, invalidateModule } = createServer({
            client: { [dist('main.esm.mjs')]: [{ id: 'client-dist' }] },
        });
        invalidateModule.mockImplementation(() => {
            throw new Error('graph is gone');
        });

        expect(() => invalidatePackageDist(server)).not.toThrow();

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('graph is gone');
        expect(warn.mock.calls[0][0]).toContain('reloading anyway');
    });
});

describe('createFullReload', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sends one full-reload after invalidating package dist modules', () => {
        const distModule = { id: 'client-dist' };
        const { server, send, warn, invalidateModule } = createServer({
            client: { [dist('main.esm.mjs')]: [distModule], [src('page.ts')]: [{ id: 'client-src' }] },
        });

        createFullReload(server).reload('build-queue.empty');
        expect(send).not.toHaveBeenCalled();
        vi.advanceTimersByTime(10);

        expect(invalidateModule).toHaveBeenCalledTimes(1);
        expect(invalidateModule).toHaveBeenCalledWith(distModule);
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith({ type: 'full-reload', path: 'build-queue.empty' });
        // Asserted from outside the code under test: a failure inside a mock would be swallowed by the fail-open catch.
        expect(invalidateModule.mock.invocationCallOrder[0]).toBeLessThan(send.mock.invocationCallOrder[0]);
        expect(warn).not.toHaveBeenCalled();
    });

    it('sends one full-reload for signals within 10ms of each other', () => {
        const { server, send, warn, invalidateModule } = createServer({
            client: { [dist('main.esm.mjs')]: [{ id: 'client-dist' }] },
        });
        const fullReload = createFullReload(server);

        fullReload.reload('first');
        vi.advanceTimersByTime(5);
        fullReload.reload('second');
        vi.advanceTimersByTime(100);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith({ type: 'full-reload', path: 'second' });
        expect(invalidateModule).toHaveBeenCalledTimes(1);
        expect(warn).not.toHaveBeenCalled();
    });

    it('sends a reload for each signal that is more than 10ms apart', () => {
        const { server, send, warn } = createServer({
            client: { [dist('main.esm.mjs')]: [{ id: 'client-dist' }] },
        });
        const fullReload = createFullReload(server);

        fullReload.reload('first');
        vi.advanceTimersByTime(10);
        fullReload.reload('second');
        vi.advanceTimersByTime(10);

        expect(send.mock.calls.map(([message]) => message.path)).toEqual(['first', 'second']);
        expect(warn).not.toHaveBeenCalled();
    });

    it('still sends the reload when invalidation throws', () => {
        const { server, send, warn, invalidateModule } = createServer({
            client: { [dist('main.esm.mjs')]: [{ id: 'client-dist' }] },
        });
        invalidateModule.mockImplementation(() => {
            throw new Error('graph is gone');
        });

        createFullReload(server).reload('build-queue.empty');
        vi.advanceTimersByTime(10);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith({ type: 'full-reload', path: 'build-queue.empty' });
    });

    it('still sends the reload when the graphs are empty', () => {
        const { server, send, warn } = createServer({ client: {}, ssr: {} });

        createFullReload(server).reload('build-queue.empty');
        vi.advanceTimersByTime(10);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith({ type: 'full-reload', path: 'build-queue.empty' });
    });

    it('sends nothing once cancelled', () => {
        const { server, send, invalidateModule } = createServer({
            client: { [dist('main.esm.mjs')]: [{ id: 'client-dist' }] },
        });
        const fullReload = createFullReload(server);

        fullReload.reload('build-queue.empty');
        fullReload.cancel();
        vi.advanceTimersByTime(100);

        expect(send).not.toHaveBeenCalled();
        expect(invalidateModule).not.toHaveBeenCalled();
    });
});
