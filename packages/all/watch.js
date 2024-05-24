const { spawn } = require('child_process');

const QUIET_PERIOD_MS = 1000;
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

    const nxWatch = spawn('nx', [
        ...NX_ARGS,
        ...'watch --all -- echo ${NX_PROJECT_NAME} ${NX_FILE_CHANGES}'.split(' '),
    ]);
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
        for (const line of lines) {
            const [project, ...files] = line.split(' ');
            outputCb(project, files);
        }
    });

    return exitPromise;
}

function spawnNxRun(targets) {
    let exitResolve, exitReject;
    const exitPromise = new Promise((resolve, reject) => {
        exitResolve = resolve;
        exitReject = reject;
    });

    const nxRun = spawn(`nx`, [...NX_ARGS, 'run', ...targets], { stdio: 'inherit' });
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
        return [project, ['generate'], 'watch'];
    }

    switch (project) {
        case 'ag-charts-community':
            return [project, ['build:types', 'build:package', 'build:umd', 'docs-resolved-interfaces'], 'watch'];
        case 'ag-charts-enterprise':
            return [project, ['build:types', 'build:package', 'build:umd'], 'watch'];
    }

    return [project, ['build'], undefined];
}

function hasValidFiles(files) {
    for (const file of files) {
        if (file.includes('/dist/')) continue;
        if (file.includes('/node_modules/')) continue;

        return true;
    }

    return false;
}

let timeout;
function scheduleBuild() {
    if (buildBuffer.size > 0) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => build(), QUIET_PERIOD_MS);
    }
}

const buildBuffer = new Set();
function processWatchOutput(rawProject, files) {
    if (!hasValidFiles(files)) return;
    if (IGNORED_PROJECTS.includes(rawProject)) return;

    const [project, targets, config] = nxProjectBuildTarget(rawProject);

    for (const target of targets) {
        buildBuffer.add(`${project}:${target}${config ? `:${config}` : ''}`);
    }

    scheduleBuild();
}

let buildRunning = false;
async function build() {
    if (buildRunning) return;
    buildRunning = true;

    const targets = [...buildBuffer.values()];
    buildBuffer.clear();

    const targetMsg = targets.length > 5 ? `(${targets.length} targets)` : targets.join(' ');
    try {
        success(`Starting build for: ${targetMsg}`);
        await spawnNxRun(targets);
        success(`Completed build for: ${targetMsg}`);
    } catch (e) {
        error(`Build failed for: ${targetMsg}`);

        if (!targets.includes('all:dev:setup')) {
            // Fallback to trying to build everything next time around.
            buildBuffer.add('all:dev:setup');
        }
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
