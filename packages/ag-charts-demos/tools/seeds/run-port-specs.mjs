#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

/**
 * Runs the demos' functional Playwright specs against each framework port of a plan written by
 * `port-spec-plan.mjs`, one port at a time: the port's built `dist` is served with the parity
 * run's own static server (`e2e/parity/serve-dist.mjs`), and the specs of that port's demo, and only
 * those, are pointed at it with `DEMOS_BASE_URL`, which also stops the config starting the dev
 * server. Each port's report and results get their own file and folder, so one run does not
 * overwrite another's and a failure names the demo and framework.
 *
 * It needs nothing but Node and Playwright, so it runs inside the Playwright container CI uses,
 * from the demos package. It exits non-zero when any port's specs fail, or when a port cannot be
 * run at all (no built `dist`, a server that does not come up).
 *
 * Usage: node tools/seeds/run-port-specs.mjs --plan <file> [--port-base <port>] [-- <playwright args>]
 */

const DEMOS_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const WORKSPACE_ROOT = resolve(DEMOS_ROOT, '..', '..');

/** Ports are served from here upwards, clear of the parity run's own (4701, 4702 and 4710+). */
export const DEFAULT_PORT_BASE = 4810;

/** How long to wait for a port's server to answer. */
const SERVER_TIMEOUT_MS = 30_000;

/** `demo/framework`, the name a port goes by in every message. */
const portName = ({ demo, framework }) => `${demo}/${framework}`;

/**
 * How to run one entry of the plan (`{ demo, framework, dist, grep }`) on `port`: the folder to
 * serve, the URL it answers on, and the Playwright arguments and environment that run only its
 * demo's specs against it and keep its output apart from every other port's.
 */
export function describePortRun(entry, { port, workspaceRoot = WORKSPACE_ROOT, extraArgs = [] }) {
    const name = `${entry.demo}-${entry.framework}`;
    const baseURL = `http://localhost:${port}`;
    return {
        name: portName(entry),
        distDir: resolve(workspaceRoot, entry.dist),
        baseURL,
        serveArgs: ['--dir', resolve(workspaceRoot, entry.dist), '--port', String(port)],
        playwrightArgs: [
            'playwright',
            'test',
            '-g',
            entry.grep,
            '--output',
            `test-results/ports/${name}`,
            ...extraArgs,
        ],
        env: {
            DEMOS_BASE_URL: baseURL,
            // Wins over the junit reporter's configured file, which every run would otherwise share.
            PLAYWRIGHT_JUNIT_OUTPUT_FILE: resolve(workspaceRoot, 'reports', `ag-charts-demos-e2e-port-${name}.xml`),
        },
    };
}

/** The closing lines of a run: one per port, then the verdict. `results` are `{ name, ok, reason }`. */
export function summarise(results) {
    if (results.length === 0) return ['No ports to run the functional specs against.'];
    const failed = results.filter((result) => !result.ok);
    return [
        'Functional specs per framework port:',
        ...results.map(({ name, ok, reason }) => `  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ` (${reason})`}`),
        failed.length === 0
            ? `All ${results.length} port(s) passed.`
            : `${failed.length} of ${results.length} port(s) failed: ${failed.map((result) => result.name).join(', ')}`,
    ];
}

export function readPlan(path) {
    const plan = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(plan.run)) throw new Error(`${path} is not a port-spec plan: it has no "run" array`);
    return plan.run;
}

/** Resolves once `url` answers, rejects when it does not within the timeout or `exited` settles first. */
async function waitForServer(url, exited) {
    const deadline = Date.now() + SERVER_TIMEOUT_MS;
    let stopped = false;
    exited.then(() => (stopped = true));
    while (Date.now() < deadline) {
        if (stopped) throw new Error('the static server exited before it answered');
        const answered = await new Promise((done) => {
            const request = http.get(url, (response) => {
                response.resume();
                done(true);
            });
            request.on('error', () => done(false));
        });
        if (answered) return;
        await delay(250);
    }
    throw new Error(`nothing answered at ${url} within ${SERVER_TIMEOUT_MS / 1000}s`);
}

const run = (command, args, options) =>
    new Promise((done) => {
        const child = spawn(command, args, { stdio: 'inherit', ...options });
        child.on('error', () => done(1));
        child.on('exit', (code, signal) => done(code ?? (signal ? 1 : 0)));
    });

/** Serves `distDir`, runs the port's specs, stops the server. Returns `{ name, ok, reason }`. */
async function runPort(entry, options) {
    const description = describePortRun(entry, options);
    const { name } = description;
    if (!existsSync(join(description.distDir, 'index.html'))) {
        return {
            name,
            ok: false,
            reason: `no built dist at ${entry.dist}; run \`yarn nx run ag-charts-demos-seeds:build\``,
        };
    }

    const server = spawn(
        process.execPath,
        [join(DEMOS_ROOT, 'e2e', 'parity', 'serve-dist.mjs'), ...description.serveArgs],
        {
            stdio: ['ignore', 'inherit', 'inherit'],
        }
    );
    const exited = new Promise((done) => server.on('exit', done));
    try {
        await waitForServer(description.baseURL, exited);
        const code = await run('npx', description.playwrightArgs, {
            cwd: DEMOS_ROOT,
            env: { ...process.env, ...description.env },
        });
        return code === 0 ? { name, ok: true } : { name, ok: false, reason: `playwright exited with ${code}` };
    } catch (error) {
        return { name, ok: false, reason: error.message };
    } finally {
        server.kill();
        await exited;
    }
}

export async function main(argv) {
    const separator = argv.indexOf('--');
    const own = separator === -1 ? argv : argv.slice(0, separator);
    const extraArgs = separator === -1 ? [] : argv.slice(separator + 1);
    const option = (name) => (own.includes(name) ? own[own.indexOf(name) + 1] : undefined);

    const planPath = option('--plan');
    if (!planPath) throw new Error('--plan <file> is required');
    const portBase = Number(option('--port-base') ?? DEFAULT_PORT_BASE);
    if (!Number.isInteger(portBase) || portBase <= 0) throw new Error('--port-base must be a port number');

    const github = process.env.GITHUB_ACTIONS === 'true';
    const results = [];
    for (const [index, entry] of readPlan(planPath).entries()) {
        const name = portName(entry);
        console.log(github ? `::group::Functional specs: ${name}` : `\n== Functional specs: ${name}`);
        const result = await runPort(entry, { port: portBase + index, extraArgs });
        if (github) console.log('::endgroup::');
        if (!result.ok) {
            console.log(
                github
                    ? `::error title=Demo specs failed on a framework port::${name}: ${result.reason}`
                    : `FAILED ${name}: ${result.reason}`
            );
        }
        results.push(result);
    }
    for (const line of summarise(results)) console.log(line);
    return results.every((result) => result.ok) ? 0 : 1;
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        process.exit(await main(process.argv.slice(2)));
    } catch (error) {
        console.error(`run-port-specs: ${error.message}`);
        process.exit(2);
    }
}
