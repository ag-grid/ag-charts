import { execSync } from 'child_process';
import path from 'path';

function runRuleTest(ruleNameSuffix: string) {
    const lintDataFile = path.resolve(__dirname, `lint-${ruleNameSuffix}.data.ts`);
    const eslintConfigFile = path.resolve(__dirname, `lint-${ruleNameSuffix}-eslint-config.mjs`);
    let stdout: string = '';
    let stderr: string = '';
    const env: any = { ...process.env, NO_COLOR: '1' };
    delete env['FORCE_COLOR'];

    try {
        // eslint-disable-next-line sonarjs/os-command
        stdout = execSync(`npx eslint -c ${eslintConfigFile} ${lintDataFile}`, {
            env,
            encoding: 'utf-8',
            stdio: 'pipe',
        });
    } catch (error: any) {
        stdout = error.stdout;
        stderr = error.stderr;
    }
    // The `__dirname` variable depends on the current buildhost. So substitute it to make the test consistent.
    stdout = stdout.replaceAll(__dirname, '<dirname>');
    stderr = stderr.replaceAll(__dirname, '<dirname>');
    expect({ stdout, stderr }).toMatchSnapshot();
}

function testRule(ruleNameSuffix: string) {
    test(`aglint/${ruleNameSuffix}`, () => runRuleTest(ruleNameSuffix));
}

testRule('change-detection');
testRule('require-explicit-generic');
testRule('validate-module-registration');
