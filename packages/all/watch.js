const { spawn } = require('child_process');

const QUIET_PERIOD_MS = 1000;
const BATCH_LIMIT = 50;
const PROJECT_ECHO_LIMIT = 3;
const IGNORED_PROJECTS = ['all', 'ag-charts-website'];
const NX_ARGS = ['--output-style', 'compact'];

if ((process.env.BUILD_FWS ?? '0') !== '1') {
    IGNORED_PROJECTS.push('ag-charts-angular', 'ag-charts-react', 'ag-charts-vue3');
}

const RED = '\x1b[;31m';
const GREEN = '\x1b[;32m';
const YELLOW = '\x1b[;33m';
const RESET = '\x1b[m';

function success(msg, ...args) {
    console.log(`*** ${GREEN}${msg}${RESET}`, ...args);
}
function warning(msg, ...args) {
    console.log(`*** ${YELLOW}${msg}${RESET}`, ...args);
}
function error(msg, ...args) {
    console.log(`*** ${RED}${msg}${RESET}`, ...args);
}

const spawnedChildren = new Set();

function spawnNxWatch(outputCb) {
    let exitResolve, exitReject;
    const exitPromise = new Promise((resolve, reject) => {
        exitResolve = resolve;
        exitReject = reject;
    });

    const nxWatch = spawn('nx', [...NX_ARGS, ...'watch --all -- echo ${NX_PROJECT_NAME}'.split(' ')]);
    spawnedChildren.add(nxWatch);
    nxWatch.on('error', (e) => {
        console.error(e);
        exitReject(e);
    });
    nxWatch.on('exit', () => {
        spawnedChildren.delete(nxWatch);
        exitResolve();
    });
    nxWatch.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const project of lines) {
            if (project.trim().length === 0) continue;

            outputCb(project);
        }
    });

    return exitPromise;
}

function spawnNxRun(target, config, projects) {
    let exitResolve, exitReject;
    const exitPromise = new Promise((resolve, reject) => {
        exitResolve = resolve;
        exitReject = reject;
    });

    const nxRunArgs = [...NX_ARGS, 'run-many', '-t', target];
    if (config != null) {
        nxRunArgs.push('-c', config);
    }
    nxRunArgs.push('-p', ...projects);

    success(`Executing: nx ${nxRunArgs.join(' ')}`);
    const nxRun = spawn(`nx`, nxRunArgs, { stdio: 'inherit', env: process.env });
    spawnedChildren.add(nxRun);
    nxRun.on('error', (e) => {
        console.error(e);
        exitReject(e);
    });
    nxRun.on('exit', (code) => {
        spawnedChildren.delete(nxRun);
        if (code === 0) {
            exitResolve();
        } else {
            exitReject();
        }
    });

    return exitPromise;
}

function nxProjectBuildTarget(project) {
    if (project.startsWith('ag-charts-website-')) {
        return [[project, ['generate'], 'watch']];
    }

    switch (project) {
        case 'ag-charts-community':
            return [
                [project, ['build'], 'watch'],
                [project, ['docs-resolved-interfaces'], 'watch'],
                ['ag-charts-enterprise', ['build'], 'watch'],
            ];
        case 'ag-charts-enterprise':
            return [[project, ['build'], 'watch']];
    }

    return [[project, ['build'], undefined]];
}

let timeout;
function scheduleBuild() {
    if (buildBuffer.length > 0) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => build(), QUIET_PERIOD_MS);
    }
}

let buildBuffer = [];
function processWatchOutput(rawProject) {
    if (IGNORED_PROJECTS.includes(rawProject)) return;
    if (rawProject === '') return;

    for (const [project, targets, config] of nxProjectBuildTarget(rawProject)) {
        for (const target of targets) {
            buildBuffer.push([project, config, target]);
        }
    }

    scheduleBuild();
}

let buildRunning = false;
async function build() {
    if (buildRunning) return;
    buildRunning = true;

    const [, config, target] = buildBuffer.at(0);
    const newBuildBuffer = [];
    const projects = new Set();
    for (const next of buildBuffer) {
        if (projects.size < BATCH_LIMIT && next[2] === target && next[1] === config) {
            projects.add(next[0]);
        } else {
            newBuildBuffer.push(next);
        }
    }
    buildBuffer = newBuildBuffer;

    let targetMsg = [...projects.values()].slice(0, PROJECT_ECHO_LIMIT).join(' ');
    if (projects.size > PROJECT_ECHO_LIMIT) {
        targetMsg += ` (+${projects.size - PROJECT_ECHO_LIMIT} targets)`;
    }
    try {
        success(`Starting build for: ${targetMsg}`);
        await spawnNxRun(target, config, [...projects.values()]);
        success(`Completed build for: ${targetMsg}`);
        success(`Build queue has ${buildBuffer.length} remaining.`);
    } catch (e) {
        error(`Build failed for: ${targetMsg}`);
    } finally {
        buildRunning = false;
        scheduleBuild();
    }
}

async function run() {
    while (true) {
        success('Starting watch...');

        await spawnNxWatch(processWatchOutput);
        await waitMs(1_000);
    }
}

function waitMs(timeMs) {
    let resolveWait;
    setInterval(() => resolveWait(), timeMs);
    return new Promise((r) => (resolveWait = r));
}

process.on('beforeExit', () => {
    for (const child of spawnedChildren) {
        child.kill();
    }
    spawnedChildren.clear();
});

run();
