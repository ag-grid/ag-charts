const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const yaml = require('js-yaml');

/** The shard job's Playwright browser install, run as Actions does with `npx` and `sleep` replaced by stubs. */

const WORKFLOW = path.resolve(__dirname, '../../.github/workflows/benchmark.yml');
const workflow = yaml.load(fs.readFileSync(WORKFLOW, 'utf8'));
const installStep = workflow.jobs.benchmark.steps.find((s) => s.name === 'Install Playwright Chromium');

/** Runs the step with `npx playwright install chromium` failing its first `failures` calls. */
function runInstall(failures) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-install-'));
    try {
        const bin = path.join(dir, 'bin');
        fs.mkdirSync(bin);
        const log = path.join(dir, 'calls.log');
        fs.writeFileSync(log, '');
        fs.writeFileSync(
            path.join(bin, 'npx'),
            `#!/usr/bin/env bash
echo "npx $*" >> "$CALLS_LOG"
calls=$(grep -c '^npx ' "$CALLS_LOG")
[[ $calls -gt $FAILURES ]]
`,
            { mode: 0o755 }
        );
        fs.writeFileSync(path.join(bin, 'sleep'), '#!/usr/bin/env bash\necho "sleep $*" >> "$CALLS_LOG"\n', {
            mode: 0o755,
        });
        const proc = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', installStep.run], {
            encoding: 'utf8',
            env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CALLS_LOG: log, FAILURES: String(failures) },
        });
        const calls = fs.readFileSync(log, 'utf8').split('\n').filter(Boolean);
        return { status: proc.status, stdout: proc.stdout, calls };
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

const INSTALL = 'npx playwright install chromium';

test('a first-attempt install succeeds without retrying', () => {
    const { status, calls } = runInstall(0);
    assert.equal(status, 0);
    assert.deepEqual(calls, [INSTALL]);
});

test('a transient failure is retried after a short back-off, and the step then succeeds', () => {
    const { status, calls } = runInstall(1);
    assert.equal(status, 0);
    assert.deepEqual(calls, [INSTALL, 'sleep 10', INSTALL]);

    const second = runInstall(2);
    assert.equal(second.status, 0);
    assert.deepEqual(second.calls, [INSTALL, 'sleep 10', INSTALL, 'sleep 30', INSTALL]);
});

test('the step fails closed after the third failed attempt', () => {
    const { status, calls } = runInstall(3);
    assert.notEqual(status, 0);
    assert.deepEqual(calls, [INSTALL, 'sleep 10', INSTALL, 'sleep 30', INSTALL]);
});
